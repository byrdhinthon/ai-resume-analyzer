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

    const prompt = `You are a STRICT IT resume reviewer for the Thai IT job market. Give HONEST scores based ONLY on evidence in the resume — no optimistic guesses.

═══════════════════════════════════════════
TARGET POSITION: ${sanitizedPosition}
═══════════════════════════════════════════

RESPONSIBILITIES:
${responsibilities}

REQUIRED SKILLS (candidate MUST have most of these):
${requiredText}

NICE-TO-HAVE SKILLS (bonus only):
${niceText}

═══════════════════════════════════════════
SCORING RULES — READ CAREFULLY
═══════════════════════════════════════════
1. EVIDENCE-BASED: ให้คะแนนจากสิ่งที่เขียนในเรซูเม่เท่านั้น ห้ามคาดเดาว่า "น่าจะรู้"
2. NO PARTIAL CREDIT for unrelated skills: ทักษะที่ไม่เกี่ยวกับตำแหน่งนี้ไม่นับในหมวดทักษะ (เช่น Photoshop ในใบสมัคร Backend = ไม่ใช่ทักษะที่เกี่ยวข้อง)
3. ZERO MATCH = ZERO SCORE: ถ้าใบสมัครไม่มี Required Skills ตรงเลย หมวด "ทักษะทางเทคนิค" ต้องได้ 0-15% ของคะแนนเต็ม
4. PROOF MATTERS: แค่เขียนชื่อทักษะ = 25-40% / เขียนพร้อม project / ตัวอย่างใช้งาน = 60-100%
5. NICE-TO-HAVE ไม่ทดแทน REQUIRED: มี Docker แต่ไม่มี backend language → ยังคงคะแนนต่ำ
6. ห้ามชดเชยหมวดที่ขาดด้วยหมวดอื่นที่ดี

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
    ${(criteriaData || []).map(c => `"${c.category}": "<คำแนะนำภาษาไทย ระบุทักษะที่ขาดและควรเพิ่ม>"`).join(',\n    ')}
  },
  "summary": "<สรุปภาษาไทย 2-3 ประโยค บอกระดับความพร้อมและทักษะหลักที่ขาด>",
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
