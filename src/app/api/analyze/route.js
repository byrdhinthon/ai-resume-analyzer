import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as mammoth from 'mammoth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// จำกัดความยาวข้อความเรซูเม่ที่ส่งเข้า AI — รองรับ PDF หลายหน้า (เรซูเม่/portfolio ยาวๆ)
// ~40,000 ตัวอักษร ≈ 15-20 หน้า กันไม่ให้หน้าท้ายๆ ถูกตัดทิ้ง
const RESUME_TEXT_LIMIT = 40000

// แปลง error code → ข้อความภาษาคนที่ user ทั่วไปเข้าใจ + บอกวิธีแก้
const ERROR_MESSAGES = {
  DOWNLOAD_FAILED: 'ดาวน์โหลดไฟล์จากระบบไม่สำเร็จ ลองอัปโหลดไฟล์นี้ใหม่อีกครั้ง',
  UNSUPPORTED_FILE_TYPE: 'ไฟล์ชนิดนี้ไม่รองรับ — รองรับเฉพาะ PDF, Word (.docx) และรูปภาพ (PNG/JPG) เท่านั้น',
  CANNOT_READ_FILE: 'อ่านข้อความในไฟล์ไม่ได้ — ไฟล์อาจเป็นรูปสแกนที่ไม่มีข้อความ หรือไฟล์เสียหาย ลองบันทึกเป็น PDF ใหม่แล้วอัปโหลดอีกครั้ง',
  AI_INVALID_RESPONSE: 'ระบบ AI ประมวลผลไฟล์นี้ไม่สำเร็จ (อาจเพราะระบบใช้งานหนักชั่วคราว) กดวิเคราะห์ใหม่อีกครั้งได้เลย',
  AI_TIMEOUT: 'ระบบ AI ใช้เวลานานเกินไปหรือใช้งานหนักชั่วคราว ลองวิเคราะห์ใหม่อีกครั้งในอีกสักครู่',
  SAVE_FAILED: 'บันทึกผลการวิเคราะห์ไม่สำเร็จ ลองวิเคราะห์ใหม่อีกครั้ง',
  ANALYZE_ERROR: 'เกิดข้อผิดพลาดระหว่างวิเคราะห์ ลองวิเคราะห์ใหม่อีกครั้ง ถ้ายังไม่ได้ลองเปลี่ยนไฟล์',
}
function humanError(code) {
  return ERROR_MESSAGES[code] || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ ลองวิเคราะห์ใหม่อีกครั้ง'
}

async function extractPdfText(buffer) {
  const { extractText } = await import('unpdf')
  const uint8Array = new Uint8Array(buffer)
  // mergePages: true → รวมทุกหน้าเป็นข้อความเดียว (PDF หลายหน้าอ่านครบ)
  // ถ้าไม่ใส่ unpdf คืน text เป็น array ต่อหน้า → String() จะ join ด้วย comma เพี้ยน
  const result = await extractText(uint8Array, { mergePages: true })
  const text = result?.text
  if (Array.isArray(text)) return text.join('\n\n')   // เผื่อบาง version ยังคืน array
  return String(text || '')
}

// Extract text จาก DOCX
async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function POST(request) {
  // hoist ไว้ให้ catch ก้อนนอกเข้าถึงได้ — ใช้ mark failed กัน stuck pending
  let capturedAnalysisId = null
  try {
    // 0. ตรวจสอบ auth
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { analysisId, fileUrl: filePath, fileName, jobPosition, mode, passThreshold } = await request.json()
    capturedAnalysisId = (analysisId || analysisId === 0) ? analysisId : null

    // mode มี 3 แบบ:
    //  'per-position' (default) — เลือก/กรอกตำแหน่งเอง
    //  'quality'                — อาจารย์ตรวจ batch ไม่เลือกตำแหน่ง + AI แนะนำอาชีพ
    //  'ai-suggest'             — AI เลือกตำแหน่งที่เหมาะสมให้เอง แล้วให้คะแนนตามตำแหน่งนั้น
    const evalMode = ['quality', 'ai-suggest'].includes(mode) ? mode : 'per-position'
    const threshold = evalMode === 'quality' ? (parseInt(passThreshold) || 70) : null

    // ตรวจสอบ input
    if (!analysisId && analysisId !== 0) {
      return Response.json({ error: 'Invalid analysis ID' }, { status: 400 })
    }
    if (!filePath || typeof filePath !== 'string') {
      return Response.json({ error: 'Invalid file path' }, { status: 400 })
    }
    if (!fileName || typeof fileName !== 'string') {
      return Response.json({ error: 'Invalid file name' }, { status: 400 })
    }
    // บังคับ jobPosition เฉพาะ per-position mode (quality + ai-suggest ไม่ต้องส่ง)
    if (evalMode === 'per-position') {
      if (!jobPosition || typeof jobPosition !== 'string' || jobPosition.length > 200) {
        return Response.json({ error: 'Invalid job position' }, { status: 400 })
      }
    }

    // ป้องกัน path traversal
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return Response.json({ error: 'Invalid file path' }, { status: 400 })
    }

    // ป้องกัน cross-user file read: ไฟล์ต้องอยู่ในโฟลเดอร์ของ user คนที่ร้องขอเท่านั้น
    // (ตอนอัปโหลดทุกไฟล์ถูกเก็บที่ path `${user.id}/...`)
    if (!filePath.startsWith(`${user.id}/`)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ตรวจสอบว่า analysis นี้เป็นของ user คนนี้จริง
    const { data: ownerCheck } = await supabase
      .from('analyses')
      .select('user_id, status')
      .eq('id', analysisId)
      .single()

    if (!ownerCheck || ownerCheck.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ป้องกันการวิเคราะห์ซ้ำ
    if (ownerCheck.status !== 'pending') {
      return Response.json({ error: 'Analysis already processed' }, { status: 400 })
    }

    // helper: ตั้งสถานะ failed + เก็บ error message ภาษาคน เพื่อไม่ให้ค้าง pending
    // + ให้ user เห็นว่า fail เพราะอะไร (ไม่ใช่ error code ดิบ)
    const fail = async (code, status) => {
      const message = humanError(code)
      await supabase.from('analyses')
        .update({ status: 'failed', error_message: message })
        .eq('id', analysisId)
      return Response.json({ error: code, message }, { status })
    }

    // 1. ดึงไฟล์จาก Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError.message)
      return await fail('DOWNLOAD_FAILED', 400)
    }

    // 2. แปลงเป็น Buffer แล้ว extract text (หรือเตรียมรูปสำหรับ vision)
    const buffer = Buffer.from(await fileData.arrayBuffer())
    const lowerName = fileName.toLowerCase()
    const isImage = lowerName.endsWith('.png') || lowerName.endsWith('.jpg')
      || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp')
    let resumeText = ''
    let imageDataUrl = null

    if (lowerName.endsWith('.pdf')) {
      resumeText = await extractPdfText(buffer)
    } else if (lowerName.endsWith('.docx')) {
      resumeText = await extractDocxText(buffer)
    } else if (isImage) {
      // เรซูเม่เป็นรูปภาพ → ส่งเข้า vision model ให้อ่านเอง
      const mime = lowerName.endsWith('.png') ? 'image/png'
        : lowerName.endsWith('.webp') ? 'image/webp'
        : 'image/jpeg'
      imageDataUrl = `data:${mime};base64,${buffer.toString('base64')}`
    } else {
      return await fail('UNSUPPORTED_FILE_TYPE', 400)
    }

    if (!isImage) {
      resumeText = String(resumeText || '')
      if (!resumeText || resumeText.trim().length < 10) {
        return await fail('CANNOT_READ_FILE', 400)
      }
    }

    // 3. ส่งให้ OpenAI วิเคราะห์
    // ดึงเกณฑ์จาก database
    const { data: criteriaData } = await supabase
      .from('scoring_criteria')
      .select('category, label, max_score, description')
      .order('id')

    const criteriaText = (criteriaData || []).map(c =>
      `${c.category} (0-${c.max_score}): ${c.description}`
    ).join('\n')

    // Sanitize jobPosition (per-position mode เท่านั้น)
    const sanitizedPosition = evalMode === 'per-position'
      ? (jobPosition || '').replace(/[^\w\s\-\.\/\(\)ก-๙เแโใไะาิีึืุูัํ็่้๊๋์]+/g, '').substring(0, 100)
      : null

    // ดึง responsibilities + cached skill list ของตำแหน่งนี้ (per-position mode เท่านั้น)
    // required_skills เก็บ list ที่ AI generate ไว้จาก analyze ครั้งก่อน — ใช้เป็น baseline
    // AI จะ review + revise แล้ว save กลับใหม่ทุก call (self-evolving cache)
    let responsibilities = ''
    let cachedSkills = []
    let cachedSkillsText = null
    if (evalMode === 'per-position') {
      const { data: positionData } = await supabase
        .from('job_positions')
        .select('responsibilities, required_skills')
        .eq('name', sanitizedPosition)
        .single()

      responsibilities = positionData?.responsibilities || ''
      cachedSkills = Array.isArray(positionData?.required_skills) ? positionData.required_skills : []
      cachedSkillsText = cachedSkills.length > 0
        ? cachedSkills.map((s, i) => `${i + 1}. ${s}`).join('\n')
        : null
    }

    // ───────────────────────────────────────────
    // PROMPT BUILDER — มี 2 mode
    // ───────────────────────────────────────────
    // หมายเหตุเรื่อง PDF extraction — เฉพาะไฟล์ text (PDF/DOCX) ไม่ใช่รูป (vision อ่านเองไม่เพี้ยน)
    const extractionNote = isImage ? '' : `

⚠️ หมายเหตุสำคัญเรื่องข้อความ:
ข้อความด้านบนถูกแกะมาจากไฟล์ PDF/DOCX อัตโนมัติ — ภาษาไทยอาจสะกดเพี้ยน สลับลำดับตัวอักษร สระ/วรรณยุกต์หล่น (เช่น "นักศึกษา" กลายเป็น "กศกึษา") ซึ่งเป็นข้อจำกัดของระบบแกะไฟล์ ไม่ใช่ความผิดของผู้สมัคร
- ❌ ห้ามหักคะแนนหมวดโครงสร้าง/การเขียน เรื่อง typo หรือสะกดผิด ที่อาจเกิดจากการแกะ PDF
- ✅ โฟกัสที่ keyword ภาษาอังกฤษ (ชื่อทักษะ/เครื่องมือ/เทคโนโลยี) ที่มักแกะได้ถูก + ความหมายโดยรวม
- ✅ ถ้าเจอคำไทยเพี้ยน ให้เดาความหมายที่ตั้งใจแล้วประเมินตามนั้น`

    const resumeBlock = `═══════════════════════════════════════════
RESUME ${isImage ? '(แนบมาเป็นรูปภาพด้านล่าง — อ่านข้อความและข้อมูลทั้งหมดจากรูปภาพ)' : 'TEXT'}
═══════════════════════════════════════════
${isImage ? '(ดูเรซูเม่จากรูปภาพที่แนบ)' : resumeText.substring(0, RESUME_TEXT_LIMIT)}${extractionNote}

═══════════════════════════════════════════
SCORING CATEGORIES (เกณฑ์ของแต่ละหมวดอยู่ใน description)
═══════════════════════════════════════════
${criteriaText}`

    const scoresSchema = (criteriaData || []).map(c => `"${c.category}": <number 0-${c.max_score}>`).join(',\n    ')
    // suggestion แต่ละหมวดเขียนเป็น 3 ส่วน ขึ้นบรรทัดด้วย \n เพื่อให้อ่านง่าย:
    //   จุดแข็ง: (ชมก่อน) / ควรเพิ่ม: (bullet •) / ตัวอย่าง: (ก่อน → หลัง)
    const suggestionsSchema = (criteriaData || []).map(c => `"${c.category}": "จุดแข็ง: <ชมจุดดีของหมวดนี้สั้นๆ 1 ประโยค>\\nควรเพิ่ม:\\n• <สิ่งที่ควรปรับ ข้อที่ 1>\\n• <ข้อที่ 2 (ถ้ามี)>\\nตัวอย่าง: <ยกตัวอย่างก่อน → หลัง 1 อัน เช่น 'ทำ dashboard' → 'สร้าง sales dashboard ลดเวลา report 50%'>"`).join(',\n    ')

    // sections_present: ให้ AI audit ว่าแต่ละหมวดมี "หัวข้อ/section" จริงในเรซูเม่ไหม — ทำก่อนให้คะแนน
    const presenceSchema = (criteriaData || []).map(c => `"${c.category}": <true=มีหัวข้อนี้จริงในเรซูเม่ | false=ไม่มี>`).join(',\n    ')

    // PRESENCE GATE — ประเมินแบบ HR คัดกรองเอกสาร: ไม่มีหัวข้อ = 0 (ใช้ร่วมทั้ง 2 โหมด)
    const sectionAuditBlock = `
═══════════════════════════════════════════
‼️ การตรวจหัวข้อก่อนให้คะแนน (PRESENCE GATE — สำคัญที่สุด ทำก่อนเสมอ)
═══════════════════════════════════════════
ประเมินแบบ HR คัดกรองเอกสารจริง — ให้คะแนนตาม "ความครบของหัวข้อที่ปรากฏจริงในเรซูเม่" ไม่ใช่เดาศักยภาพผู้สมัคร
ไล่ตรวจทีละหมวดว่ามี section ที่เกี่ยวข้อง "ปรากฏเป็นหัวข้อจริง" ไหม แล้วบันทึกลง sections_present (true/false):
- ข้อมูลติดต่อ: มีช่องทางติดต่อจริงไหม (อีเมล/เบอร์โทร/ลิงก์)
- ทักษะ: มีหัวข้อ Skills/ทักษะ ที่ลิสต์ทักษะเป็นรายการของตัวเอง — เทคที่แทรกอยู่ในประโยคโปรเจกต์ "ไม่นับ" ว่ามีหัวข้อทักษะ
- ประสบการณ์: ✅ ถ้ามีหัวข้อ Projects/ผลงาน/โปรเจกต์ หรือ ฝึกงาน/ทำงาน → present=true เสมอ. หัวข้อ "PROJECTS" ถือเป็น section ประสบการณ์ที่มีจริง (ไม่ต้องมีคำว่า Experience/ประสบการณ์ — นี่ไม่ใช่การเดา หัวข้อมีอยู่จริง) → ห้าม mark false และห้ามให้ 0 ทั้งที่มีโปรเจกต์. ให้คะแนน band ตาม description (Projects = เพดาน 50-70% ต่ำกว่างานจริง). mark false เฉพาะเมื่อไม่มีทั้ง Projects และงาน/ฝึกงานเลยจริงๆ
- ระดับการศึกษา: มีหัวข้อ Education ที่ระบุสถาบันจริง (ม.ปลาย/มหาวิทยาลัย + สาขา) — คำว่า "Computer Science Student" หรือตำแหน่งใต้ชื่อ "ไม่นับ" ว่ามีหัวข้อการศึกษา
- โครงสร้างเรซูเม่: ดูจากจำนวนหัวข้อมาตรฐานที่ครบ (มีแค่ 1-2 หัวข้อ = ต่ำมาก)

‼️ กฎเหล็ก (ห้ามฝ่าฝืนทุกกรณี):
1. หมวดไหน sections_present=false → scores หมวดนั้น = 0 เด็ดขาด
2. ห้ามอนุมาน/ชดเชยจากหมวดอื่น จากชื่อ-รูป-ตำแหน่งใต้ชื่อ หรือความรู้ทั่วไป — นับเฉพาะที่เขียนเป็นหัวข้อจริง
3. ทำตามเงื่อนไข "ขั้น 1 ต้องมีหัวข้อก่อน" ใน description ของแต่ละหมวดเป๊ะ
4. คะแนน=เข้มงวดตามเอกสาร / suggestion=ยังให้กำลังใจได้`

    let prompt
    if (evalMode === 'ai-suggest' || evalMode === 'quality') {
      // AI เลือกตำแหน่งที่เหมาะกับ candidate เอง แล้วให้คะแนนตามตำแหน่งนั้น
      //  ai-suggest = ไฟล์เดียว, ดูคะแนน
      //  quality    = batch (ตรวจทั้งห้อง), เพิ่มเกณฑ์ผ่าน/ไม่ผ่าน (threshold)
      prompt = `You are a SUPPORTIVE IT career advisor for Thai university students. ขั้นแรกให้เลือกตำแหน่งที่เหมาะกับ candidate จากเรซูเม่ แล้วประเมินคะแนนตามตำแหน่งนั้น — ระดับ intern / entry-level
${evalMode === 'quality' ? `
**โหมดตรวจกลุ่ม (Quality Review):** Pass threshold ${threshold}/100 — ถ้าคะแนนรวม ≥ ${threshold} → ผ่าน
` : ''}
═══════════════════════════════════════════
STEP A: เลือกตำแหน่งที่เหมาะที่สุด
═══════════════════════════════════════════
อ่านเรซูเม่ → เลือกตำแหน่งงานสายเทคโนโลยี/ดิจิทัล **1 ตำแหน่ง** ที่ candidate เหมาะที่สุด (อิงทักษะ/ผลงาน/การศึกษาจริง)
- ใช้ชื่อตำแหน่งจริงในตลาดงานไทย ครอบคลุมทั้ง:
  • สาย Dev/Coding: Backend Developer, Frontend Developer, Full Stack Developer, Mobile App Developer, Data Analyst, Software Tester, System Administrator
  • สาย Design: UI/UX Designer, Graphic Designer, Web Designer, Product Designer
- เลือกสายที่หลักฐานหนักแน่นสุด — **สำคัญ:** ถ้าทักษะเป็น design ล้วน (Figma, Photoshop, Illustrator, ออกแบบ UI/โลโก้/โปสเตอร์) ให้เลือกสาย Design (เช่น UI/UX Designer) อย่าฝืนจับเป็น Frontend Developer เพียงเพราะเกี่ยวกับเว็บ/UI
- Frontend Developer = ต้องมีหลักฐาน coding (HTML/CSS/JS/React) ไม่ใช่แค่ออกแบบด้วย Figma

═══════════════════════════════════════════
STEP B: ประเมินตามตำแหน่งที่เลือก (Step A)
═══════════════════════════════════════════
- คิดทักษะที่ตำแหน่งนั้นต้องการระดับ intern (5-8 อัน)
- เทียบกับเรซูเม่ → มี / ขาด (ทักษะเทียบเคียงกันได้ให้นับว่ามี เช่น MongoDB = database)
- ให้คะแนนแต่ละหมวดตามเกณฑ์ใน description — ห้ามชดเชยหมวดอื่น

═══════════════════════════════════════════
GLOBAL CONTEXT
═══════════════════════════════════════════
ผู้สมัครเป็นนักศึกษา/เด็กฝึกงาน — ประเมิน entry-level, school/personal project นับเป็นหลักฐานได้
Tone ของ suggestion: ให้กำลังใจ + แนะนำขั้นต่อไป

${resumeBlock}
${sectionAuditBlock}

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════
Respond ONLY with valid JSON:

{
  "ai_chosen_position": "<ตำแหน่งที่ AI เลือกใน Step A>",
  "ai_chosen_reason": "<เหตุผลสั้นๆ ภาษาไทย ว่าทำไมเลือกตำแหน่งนี้>",
  "skills_analysis": {
    "position_expected_skills": ["ทักษะที่ตำแหน่งนี้ควรมีระดับ intern (5-8 อัน)"],
    "candidate_has": ["ทักษะที่พบในเรซูเม่และตรงกับ expected (รวมที่เทียบเคียงได้)"],
    "candidate_missing": ["ทักษะใน expected ที่ไม่พบในเรซูเม่"],
    "candidate_extras_relevant": ["ทักษะพิเศษที่เกี่ยวข้องแม้ไม่อยู่ใน expected list"],
    "evidence_quality": "<none|mentioned_only|with_examples|with_projects>"
  },
  "sections_present": {
    ${presenceSchema}
  },
  "scores": {
    ${scoresSchema}
  },
  "suggestions": {
    ${suggestionsSchema}
  },
  "summary": "<สรุปภาษาไทย 2-3 ประโยค>",
  "candidate_name": "<ชื่อ-นามสกุล หรือ null>"
}`
    } else {
      // Per-Position Mode (default) — ของเดิม เทียบกับตำแหน่งที่เลือก
      prompt = `You are a SUPPORTIVE IT career advisor helping Thai university students prepare resumes for internships and entry-level positions. Give FAIR, EVIDENCE-BASED scores calibrated for student/intern level — not professional senior level. The goal is to help students improve, not to discourage them.

═══════════════════════════════════════════
TARGET POSITION: ${sanitizedPosition}
═══════════════════════════════════════════

RESPONSIBILITIES:
${responsibilities || '(ไม่ได้ระบุ — ใช้ความเข้าใจทั่วไปของตำแหน่งนี้)'}

═══════════════════════════════════════════
SKILL ASSESSMENT TASK (ทำตามลำดับ)
═══════════════════════════════════════════
**Step 1:** คิด skill list สำหรับตำแหน่ง **${sanitizedPosition}** ระดับ intern / entry-level
${cachedSkillsText
  ? `**มี skill list ที่ AI generate ไว้จาก analyze ครั้งก่อน (saved cache):**
${cachedSkillsText}

Review list นี้:
- ถ้าครอบคลุม intern level อยู่แล้ว → ใช้ตามเดิม (output position_expected_skills เหมือนเดิม)
- ถ้ามีจุดควรปรับ (ทักษะหมดความนิยม / ขาดทักษะใหม่ / กว้างไป / แคบไป) → revise แล้ว output list ใหม่
- พยายาม "เสถียร" — อย่าเปลี่ยนถ้าไม่จำเป็น เพื่อให้คะแนนของผู้สมัครแต่ละคนเทียบกันได้`
  : `ยังไม่มี cached list — generate 5-8 ทักษะที่ตำแหน่งนี้ควรมีระดับ intern เป็น baseline แรก`
}
- คิดในมุมมองตลาดงาน IT ไทย (JobsDB / LinkedIn jobs)
- intern level ไม่ใช่ senior — เลือกทักษะพื้นฐาน-ระดับกลาง ไม่ใช่ advanced
- รวมทั้ง hard skill (เทคโนโลยี/ภาษา/framework) + พื้นฐานจำเป็น (Git, debug, การอ่าน doc)
- ทักษะที่เทียบเคียงกันได้ ระบุเป็น OR เช่น "React หรือ Vue หรือ Angular" / "SQL หรือ NoSQL database"

**Step 2:** เทียบกับเรซูเม่ — แยกเป็น:
- ทักษะที่ candidate **มี** = ระบุชื่อในเรซูเม่ + หรือ มีหลักฐาน (project / coursework / certificate)
- ทักษะที่เทียบเคียงกันได้ให้นับเป็น "มี" (เช่น MongoDB = database backend, FastAPI = REST framework, Streamlit = web UI tool)
- ทักษะที่ candidate **ขาด** = ไม่พบในเรซูเม่เลย

**Step 3:** ระบุทักษะ **พิเศษ** ที่ candidate มีและเกี่ยวข้องแม้ไม่ได้อยู่ใน Step 1 list (เช่น มี Docker เพิ่ม, มี ML knowledge)

**Step 4:** หลังจากทำ Step 1-3 ครบ ค่อยให้คะแนนแต่ละหมวดตามเกณฑ์ใน description ด้านล่าง

═══════════════════════════════════════════
GLOBAL SCORING CONTEXT
═══════════════════════════════════════════
ผู้สมัครส่วนใหญ่เป็น **นักศึกษา / เด็กฝึกงาน / เด็กจบใหม่** ที่กำลังเตรียมสมัคร internship หรืองานจบใหม่ ประเมินตามมาตรฐาน **entry-level** ไม่ใช่ professional senior

**GLOBAL RULES (ใช้ทุกหมวด):**
- ให้คะแนนแต่ละหมวดตามหลักฐานของหมวดนั้นเท่านั้น — ห้ามชดเชยหมวดที่ขาดด้วยหมวดอื่นที่ดี
- เกณฑ์ละเอียดของแต่ละหมวดอยู่ใน description ด้านล่าง — ใช้ description เป็นหลักในการตัดสิน
- ถ้า description ของหมวดไม่ระบุ tone ของ suggestion ให้ default = ให้กำลังใจ + แนะนำขั้นต่อไป (ไม่ใช่ตำหนิ)

${resumeBlock}
${sectionAuditBlock}

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════
Respond ONLY with valid JSON. Analyze skills FIRST, then score:

{
  "skills_analysis": {
    "position_expected_skills": ["Step 1: ทักษะที่ตำแหน่งนี้ควรมีระดับ intern (5-8 อัน)"],
    "candidate_has": ["Step 2: ทักษะที่พบในเรซูเม่และตรงกับ expected (รวมที่เทียบเคียงได้)"],
    "candidate_missing": ["Step 2: ทักษะใน expected ที่ไม่พบในเรซูเม่"],
    "candidate_extras_relevant": ["Step 3: ทักษะพิเศษที่เกี่ยวข้องแม้ไม่อยู่ใน expected list"],
    "irrelevant_skills_in_resume": ["ทักษะในเรซูเม่ที่ไม่เกี่ยวกับตำแหน่ง"],
    "match_ratio": <0.0-1.0 = candidate_has.length / position_expected_skills.length>,
    "evidence_quality": "<none|mentioned_only|with_examples|with_projects>"
  },
  "sections_present": {
    ${presenceSchema}
  },
  "scores": {
    ${scoresSchema}
  },
  "suggestions": {
    ${suggestionsSchema}
  },
  "summary": "<สรุปภาษาไทย 2-3 ประโยค>",
  "candidate_name": "<ชื่อ-นามสกุล หรือ null>"
}`
    }

    // ถ้าเป็นรูป → ส่ง prompt + image เข้าโมเดล (multimodal), ถ้าเป็น text → ส่ง prompt เดี่ยว
    const userContent = imageDataUrl
      ? [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl } }
        ]
      : prompt

    // เรียก OpenAI พร้อม retry — กัน transient error (timeout / rate limit / เน็ตสะดุด)
    // ที่เป็นสาเหตุหลักของไฟล์ที่ fail ระหว่าง batch (ยิงหลายไฟล์ติดกัน)
    let completion = null
    let lastErr = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        completion = await openai.chat.completions.create({
          model: 'gpt-5.4-nano',
          messages: [{ role: 'user', content: userContent }],
          temperature: 0,
          max_completion_tokens: 3000
        })
        break // สำเร็จ → ออกจาก loop
      } catch (err) {
        lastErr = err
        console.error(`OpenAI attempt ${attempt}/3 failed:`, err?.message || err)
        // รอแบบ exponential backoff ก่อน retry (0.8s, 1.6s) — ยกเว้นรอบสุดท้าย
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 800 * attempt))
        }
      }
    }
    if (!completion) {
      console.error('OpenAI failed after 3 attempts:', lastErr?.message || lastErr)
      return await fail('AI_TIMEOUT', 500)
    }

    const rawContent = completion.choices?.[0]?.message?.content
    if (!rawContent) {
      return await fail('AI_INVALID_RESPONSE', 500)
    }
    const responseText = rawContent.trim()

    // 4. Parse JSON response
    let result
    try {
      // ลบ markdown code block ถ้ามี
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
    } catch (parseError) {
      return await fail('AI_INVALID_RESPONSE', 500)
    }

    // 5. ตรวจสอบและจำกัดคะแนนให้อยู่ในช่วงที่ถูกต้อง
    if (!result.scores || typeof result.scores !== 'object') {
      return await fail('AI_INVALID_RESPONSE', 500)
    }

    // Clamp scores ให้อยู่ในช่วง 0 - max_score ของแต่ละ category
    const criteriaMap = {}
    ;(criteriaData || []).forEach(c => { criteriaMap[c.category] = c.max_score })

    for (const [key, value] of Object.entries(result.scores)) {
      const maxAllowed = criteriaMap[key] || 0
      result.scores[key] = Math.max(0, Math.min(Number(value) || 0, maxAllowed))
    }

    // PRESENCE GATE (server-side): หมวดที่ AI ตรวจว่าไม่มีหัวข้อจริง → บังคับ 0
    // กัน AI ใจอ่อนเผลอให้คะแนนหมวดที่ไม่มี section (เช่นเดา "การศึกษา" จากตำแหน่งใต้ชื่อ)
    if (result.sections_present && typeof result.sections_present === 'object') {
      for (const [key, present] of Object.entries(result.sections_present)) {
        if (present === false && key in result.scores) {
          result.scores[key] = 0
        }
      }
    }

    const rawTotalScore = Object.values(result.scores).reduce((a, b) => a + b, 0)

    // CRITICAL-SECTION CAP: หมวดไหนได้ 0 (section ขาด) → เรซูเม่มีรูโหว่ → cap คะแนนรวม ≤50
    // (HR มุมจริง: ขาดหมวดหลัก เช่น ไม่มีติดต่อ/การศึกษา = ยังไม่พร้อมยื่น ไม่ควรได้ "ดี"/ผ่าน)
    const SECTION_MISSING_CAP = 50
    const labelMap = {}
    ;(criteriaData || []).forEach(c => { labelMap[c.category] = c.label || c.category })
    const missingSections = Object.entries(result.scores)
      .filter(([, v]) => v === 0)
      .map(([k]) => labelMap[k] || k)
    const totalScore = missingSections.length > 0
      ? Math.min(rawTotalScore, SECTION_MISSING_CAP)
      : rawTotalScore
    const scoreCap = missingSections.length > 0
      ? { cap: SECTION_MISSING_CAP, raw: rawTotalScore, applied: rawTotalScore > SECTION_MISSING_CAP, missing: missingSections }
      : null

    // อาชีพ/ตำแหน่งที่ AI เลือก — ใช้ทั้ง quality + ai-suggest (logic เดียวกัน: AI เลือกตำแหน่ง)
    let recommendedCareer = null
    if ((evalMode === 'quality' || evalMode === 'ai-suggest') && result.ai_chosen_position) {
      recommendedCareer = result.ai_chosen_position
      if (result.ai_chosen_reason) {
        recommendedCareer += ` — ${result.ai_chosen_reason}`
      }
    }

    // quality + ai-suggest: ใช้ตำแหน่งที่ AI เลือกเป็น job_position (เดิมส่ง placeholder มา)
    const finalJobPosition = ((evalMode === 'ai-suggest' || evalMode === 'quality') && result.ai_chosen_position)
      ? result.ai_chosen_position
      : undefined // undefined = ไม่ override ของเดิม

    // 6. อัปเดตผลลงตาราง analyses
    const extractedName = result.candidate_name && result.candidate_name !== 'null' ? result.candidate_name : null
    const updatePayload = {
      total_score: totalScore,
      scores: result.scores,
      suggestions: { ...result.suggestions, summary: result.summary, sections_present: result.sections_present || null, score_cap: scoreCap },
      skills_analysis: result.skills_analysis || null,
      status: 'completed',
      extracted_name: extractedName,
      evaluation_mode: evalMode,
      pass_threshold: threshold,
      recommended_career: recommendedCareer,
      error_message: null // เคลียร์ error เก่า (เผื่อเป็นการ retry)
    }
    if (finalJobPosition) updatePayload.job_position = finalJobPosition

    const { error: updateError } = await supabase
      .from('analyses')
      .update(updatePayload)
      .eq('id', analysisId)

    if (updateError) {
      console.error('Update error:', updateError.message)
      return await fail('SAVE_FAILED', 500)
    }

    // 7. Save / update AI-generated skill list กลับเข้า job_positions (per-position mode เท่านั้น)
    //    (self-evolving cache: ครั้งหน้า AI จะเห็น list นี้ + พิจารณา revise)
    if (evalMode === 'per-position') {
      const aiSkillList = result.skills_analysis?.position_expected_skills
      if (Array.isArray(aiSkillList) && aiSkillList.length > 0) {
        const { error: skillSaveError } = await supabase
          .from('job_positions')
          .update({ required_skills: aiSkillList })
          .eq('name', sanitizedPosition)
        if (skillSaveError) {
          // ไม่ล้มเหลวทั้ง request — แค่ log
          console.error('Skill list save error:', skillSaveError.message)
        }
      }
    }

    return Response.json({
      success: true,
      totalScore,
      scores: result.scores,
      suggestions: { ...result.suggestions, summary: result.summary, sections_present: result.sections_present || null, score_cap: scoreCap },
      skills_analysis: result.skills_analysis || null,
      evaluation_mode: evalMode,
      pass_threshold: threshold,
      passed: threshold !== null ? (totalScore >= threshold) : null,
      recommended_career: recommendedCareer,
      extracted_name: extractedName
    })

  } catch (error) {
    console.error('Analyze error:', error)
    // mark analysis เป็น failed + เก็บ error message ภาษาคน กัน stuck pending
    if (capturedAnalysisId !== null) {
      try {
        await supabase.from('analyses')
          .update({ status: 'failed', error_message: humanError('ANALYZE_ERROR') })
          .eq('id', capturedAnalysisId)
      } catch (_) { /* update ไม่ได้ก็ปล่อย — อย่างน้อย return error ให้ client */ }
    }
    return Response.json({ error: 'ANALYZE_ERROR', message: humanError('ANALYZE_ERROR') }, { status: 500 })
  }
}
