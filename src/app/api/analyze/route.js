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

async function extractPdfText(buffer) {
  const { extractText } = await import('unpdf')
  const uint8Array = new Uint8Array(buffer)
  const result = await extractText(uint8Array)
  return String(result.text || '')
}

// Extract text จาก DOCX
async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function POST(request) {
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

    const { analysisId, fileUrl: filePath, fileName, jobPosition } = await request.json()

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
    if (!jobPosition || typeof jobPosition !== 'string' || jobPosition.length > 200) {
      return Response.json({ error: 'Invalid job position' }, { status: 400 })
    }

    // ป้องกัน path traversal
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return Response.json({ error: 'Invalid file path' }, { status: 400 })
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

    // 1. ดึงไฟล์จาก Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError.message)
      return Response.json({ error: 'DOWNLOAD_FAILED' }, { status: 400 })
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
      return Response.json({ error: 'UNSUPPORTED_FILE_TYPE' }, { status: 400 })
    }

    if (!isImage) {
      resumeText = String(resumeText || '')
      if (!resumeText || resumeText.trim().length < 10) {
        return Response.json({ error: 'CANNOT_READ_FILE' }, { status: 400 })
      }
    }

    // 3. ส่งให้ OpenAI วิเคราะห์
    // ดึงเกณฑ์จาก database
    const { data: criteriaData } = await supabase
      .from('scoring_criteria')
      .select('category, max_score, description')
      .order('id')

    const criteriaText = (criteriaData || []).map(c =>
      `${c.category} (0-${c.max_score}): ${c.description}`
    ).join('\n')

    // Sanitize jobPosition เพื่อป้องกัน prompt injection
    const sanitizedPosition = jobPosition.replace(/[^\w\s\-\.\/\(\)ก-๙เแโใไะาิีึืุูัํ็่้๊๋์]+/g, '').substring(0, 100)

    // ดึง responsibilities + cached skill list ของตำแหน่งนี้
    // required_skills เก็บ list ที่ AI generate ไว้จาก analyze ครั้งก่อน — ใช้เป็น baseline
    // AI จะ review + revise แล้ว save กลับใหม่ทุก call (self-evolving cache)
    const { data: positionData } = await supabase
      .from('job_positions')
      .select('responsibilities, required_skills')
      .eq('name', sanitizedPosition)
      .single()

    const responsibilities = positionData?.responsibilities || ''
    const cachedSkills = Array.isArray(positionData?.required_skills) ? positionData.required_skills : []
    const cachedSkillsText = cachedSkills.length > 0
      ? cachedSkills.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : null

    const prompt = `You are a SUPPORTIVE IT career advisor helping Thai university students prepare resumes for internships and entry-level positions. Give FAIR, EVIDENCE-BASED scores calibrated for student/intern level — not professional senior level. The goal is to help students improve, not to discourage them.

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

═══════════════════════════════════════════
RESUME ${isImage ? '(แนบมาเป็นรูปภาพด้านล่าง — อ่านข้อความและข้อมูลทั้งหมดจากรูปภาพ)' : 'TEXT'}
═══════════════════════════════════════════
${isImage ? '(ดูเรซูเม่จากรูปภาพที่แนบ)' : resumeText.substring(0, 12000)}

═══════════════════════════════════════════
SCORING CATEGORIES (เกณฑ์ของแต่ละหมวดอยู่ใน description)
═══════════════════════════════════════════
${criteriaText}

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
  "scores": {
    ${(criteriaData || []).map(c => `"${c.category}": <number 0-${c.max_score}>`).join(',\n    ')}
  },
  "suggestions": {
    ${(criteriaData || []).map(c => `"${c.category}": "<คำแนะนำภาษาไทยสำหรับหมวดนี้ — ทำตาม tone ที่ระบุใน description ของหมวด>"`).join(',\n    ')}
  },
  "summary": "<สรุปภาษาไทย 2-3 ประโยค>",
  "candidate_name": "<ชื่อ-นามสกุล หรือ null>"
}`

    // ถ้าเป็นรูป → ส่ง prompt + image เข้าโมเดล (multimodal), ถ้าเป็น text → ส่ง prompt เดี่ยว
    const userContent = imageDataUrl
      ? [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl } }
        ]
      : prompt

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.4-nano',
      messages: [{ role: 'user', content: userContent }],
      temperature: 0,
      max_completion_tokens: 3000
    })

    const responseText = completion.choices[0].message.content.trim()

    // 4. Parse JSON response
    let result
    try {
      // ลบ markdown code block ถ้ามี
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
    } catch (parseError) {
      return Response.json({ error: 'AI_INVALID_RESPONSE' }, { status: 500 })
    }

    // 5. ตรวจสอบและจำกัดคะแนนให้อยู่ในช่วงที่ถูกต้อง
    if (!result.scores || typeof result.scores !== 'object') {
      return Response.json({ error: 'AI_INVALID_RESPONSE' }, { status: 500 })
    }

    // Clamp scores ให้อยู่ในช่วง 0 - max_score ของแต่ละ category
    const criteriaMap = {}
    ;(criteriaData || []).forEach(c => { criteriaMap[c.category] = c.max_score })

    for (const [key, value] of Object.entries(result.scores)) {
      const maxAllowed = criteriaMap[key] || 0
      result.scores[key] = Math.max(0, Math.min(Number(value) || 0, maxAllowed))
    }

    const totalScore = Object.values(result.scores).reduce((a, b) => a + b, 0)

    // 6. อัปเดตผลลงตาราง analyses
    const extractedName = result.candidate_name && result.candidate_name !== 'null' ? result.candidate_name : null
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        total_score: totalScore,
        scores: result.scores,
        suggestions: { ...result.suggestions, summary: result.summary },
        skills_analysis: result.skills_analysis || null,
        status: 'completed',
        extracted_name: extractedName
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('Update error:', updateError.message)
      return Response.json({ error: 'SAVE_FAILED' }, { status: 500 })
    }

    // 7. Save / update AI-generated skill list กลับเข้า job_positions
    //    (self-evolving cache: ครั้งหน้า AI จะเห็น list นี้ + พิจารณา revise)
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

    return Response.json({
      success: true,
      totalScore,
      scores: result.scores,
      suggestions: { ...result.suggestions, summary: result.summary },
      skills_analysis: result.skills_analysis || null
    })

  } catch (error) {
    console.error('Analyze error:', error)
    return Response.json({ error: 'ANALYZE_ERROR' }, { status: 500 })
  }
}
