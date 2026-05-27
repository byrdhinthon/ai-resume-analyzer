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

    // 2. แปลงเป็น Buffer แล้ว extract text
    const buffer = Buffer.from(await fileData.arrayBuffer())
    let resumeText = ''

    if (fileName.endsWith('.pdf')) {
      resumeText = await extractPdfText(buffer)
    } else if (fileName.endsWith('.docx')) {
      resumeText = await extractDocxText(buffer)
    } else {
      return Response.json({ error: 'UNSUPPORTED_FILE_TYPE' }, { status: 400 })
    }

    resumeText = String(resumeText || '')
    if (!resumeText || resumeText.trim().length < 10) {
      return Response.json({ error: 'CANNOT_READ_FILE' }, { status: 400 })
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

    // ดึง required_skills + responsibilities ของตำแหน่งนี้จาก DB (migration 004 + 005)
    const { data: positionData } = await supabase
      .from('job_positions')
      .select('required_skills, nice_to_have, responsibilities')
      .eq('name', sanitizedPosition)
      .single()

    const requiredSkills = positionData?.required_skills || []
    const niceToHave = positionData?.nice_to_have || []
    const responsibilities = positionData?.responsibilities || ''

    const requiredText = requiredSkills.length
      ? requiredSkills.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '(ไม่ได้กำหนด — ใช้ความรู้ทั่วไปของตำแหน่งนี้)'

    const niceText = niceToHave.length
      ? niceToHave.map(s => `- ${s}`).join('\n')
      : '(ไม่มี)'

    const prompt = `You are a SUPPORTIVE IT career advisor helping Thai university students prepare resumes for internships and entry-level positions. Give FAIR, EVIDENCE-BASED scores calibrated for student/intern level — not professional senior level. The goal is to help students improve, not to discourage them.

═══════════════════════════════════════════
TARGET POSITION: ${sanitizedPosition}
═══════════════════════════════════════════

RESPONSIBILITIES:
${responsibilities}

REQUIRED SKILLS (skills that match this position):
${requiredText}

NICE-TO-HAVE SKILLS (bonus only):
${niceText}

═══════════════════════════════════════════
SCORING CONTEXT — สำคัญมาก
═══════════════════════════════════════════
ผู้สมัครส่วนใหญ่เป็น **นักศึกษา / เด็กฝึกงาน / เด็กจบใหม่** ใช้ระบบนี้เพื่อ:
- เตรียมเรซูเม่สมัคร internship / ฝึกงาน
- ปรับเรซูเม่ก่อนสมัครงานจบใหม่
- ฝึกเขียน CV ครั้งแรก

ประเมินตามมาตรฐาน **entry-level / intern** ไม่ใช่ professional senior level
**ห้ามคาดหวังประสบการณ์ production จริง** — school project / personal project / coursework = หลักฐานที่ยอมรับได้

═══════════════════════════════════════════
SCORING RULES — STUDENT-FRIENDLY
═══════════════════════════════════════════
1. EVIDENCE INCLUDES LEARNING: school project / personal project / coursework / certificate online = นับเป็นหลักฐานทักษะได้ ไม่ต้องมีประสบการณ์ทำงานจริง
2. SCORE FLOOR FOR EFFORT (สำคัญ):
   - มี Required Skills ตรง 1+ อัน (แม้แค่เขียนชื่อ) → หมวดทักษะอย่างน้อย **35%**
   - มี Required Skills + school/personal project ประกอบ → อย่างน้อย **55%**
   - มี Required Skills + internship/part-time จริง → 75%+
   - **ไม่มี Required Skill ตรงเลย** → 15-25% (ยังให้คะแนนที่ทักษะ transferable เช่น problem-solving, teamwork, basic computer literacy)
3. PROOF QUALITY MATTERS แต่อย่าโหด:
   - แค่ระบุชื่อทักษะ = 35-50% ของหมวดทักษะ (นักศึกษาที่เพิ่งเริ่ม)
   - มี school project / personal project ประกอบ = 55-75%
   - มี internship / freelance / part-time จริง = 80-100%
4. NO CREDIT for completely unrelated skills: Photoshop ในใบสมัคร Backend ยังไม่นับเป็นทักษะหลัก (แต่ไม่ตัดคะแนนแรง — แค่ไม่บวก)
5. NICE-TO-HAVE เป็น bonus เท่านั้น ไม่ทดแทน REQUIRED
6. ห้ามชดเชยหมวดที่ขาดด้วยหมวดอื่นที่ดี — ให้คะแนนแต่ละหมวดตามหลักฐานของหมวดนั้นจริงๆ

═══════════════════════════════════════════
SUGGESTION TONE — สำคัญ
═══════════════════════════════════════════
- ใช้น้ำเสียงให้กำลังใจ ไม่ใช่ตำหนิ
- **ห้าม** ใช้คำว่า "ขาด", "ไม่มี", "ไม่เพียงพอ", "ยังไม่ดีพอ"
- **ให้ใช้** คำว่า "ลองเพิ่ม...", "แนะนำให้ฝึก...", "course ที่น่าเรียน...", "ขั้นต่อไปคือ..."
- ระบุขั้นตอนต่อไปที่นักศึกษาทำได้จริง เช่น "ลองทำโปรเจกต์ todo-app ด้วย React" / "เรียน SQL บน DataCamp ฟรี" / "เข้าร่วม hackathon"
- ชี้จุดแข็งที่มีก่อน แล้วค่อยแนะนำสิ่งที่เพิ่มได้

═══════════════════════════════════════════
RESUME TEXT
═══════════════════════════════════════════
${resumeText.substring(0, 12000)}

═══════════════════════════════════════════
SCORING CATEGORIES (max scores)
═══════════════════════════════════════════
${criteriaText}

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════
Respond ONLY with valid JSON. Analyze skills FIRST, then score:

{
  "skills_analysis": {
    "required_matched": ["ทักษะใน required list ที่พบในเรซูเม่"],
    "required_missing": ["ทักษะใน required list ที่ไม่พบในเรซูเม่"],
    "nice_to_have_matched": ["nice-to-have ที่พบ"],
    "irrelevant_skills_in_resume": ["ทักษะที่มีในเรซูเม่แต่ไม่เกี่ยวกับตำแหน่ง"],
    "match_ratio": <0.0-1.0>,
    "evidence_quality": "<none|mentioned_only|with_examples|with_projects>"
  },
  "scores": {
    ${(criteriaData || []).map(c => `"${c.category}": <number 0-${c.max_score}>`).join(',\n    ')}
  },
  "suggestions": {
    ${(criteriaData || []).map(c => `"${c.category}": "<คำแนะนำภาษาไทย น้ำเสียงให้กำลังใจ — ชี้จุดแข็งก่อน แล้วแนะนำขั้นต่อไปที่นักศึกษาทำได้ (project ที่ลองทำ / course ที่ลองเรียน)>"`).join(',\n    ')}
  },
  "summary": "<สรุปภาษาไทย 2-3 ประโยค บอกจุดแข็งของผู้สมัคร + เส้นทางพัฒนาที่แนะนำ ไม่ใช่แค่ระบุสิ่งที่ขาด>",
  "candidate_name": "<ชื่อ-นามสกุล หรือ null>"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.4-nano',
      messages: [{ role: 'user', content: prompt }],
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
