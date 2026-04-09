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
  return String(result.text || result.totalPages ? result.text : JSON.stringify(result))
}

// Extract text จาก DOCX
async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function POST(request) {
  try {
    const { analysisId, fileUrl, fileName, jobPosition } = await request.json()

    // 1. ดึงไฟล์จาก Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(fileUrl)

    if (downloadError) {
      return Response.json({ error: 'ดาวน์โหลดไฟล์ล้มเหลว: ' + downloadError.message }, { status: 400 })
    }

    // 2. แปลงเป็น Buffer แล้ว extract text
    const buffer = Buffer.from(await fileData.arrayBuffer())
    let resumeText = ''

    if (fileName.endsWith('.pdf')) {
      resumeText = await extractPdfText(buffer)
    } else if (fileName.endsWith('.docx')) {
      resumeText = await extractDocxText(buffer)
    } else {
      return Response.json({ error: 'ไม่รองรับประเภทไฟล์นี้' }, { status: 400 })
    }

    resumeText = String(resumeText || '')
    if (!resumeText || resumeText.trim().length < 10) {
      return Response.json({ error: 'ไม่สามารถอ่านข้อความจากไฟล์ได้ กรุณาตรวจสอบไฟล์' }, { status: 400 })
    }

    // 3. ส่งให้ OpenAI วิเคราะห์
    // ดึงเกณฑ์จาก database
    const { data: criteriaData } = await supabase
      .from('scoring_criteria')
      .select('*')
      .order('id')

    const criteriaText = (criteriaData || []).map(c =>
      `${c.category} (0-${c.max_score}): ${c.description}`
    ).join('\n')

    const prompt = `You are an expert IT resume reviewer. Analyze the following resume for a "${jobPosition}" position.

RESUME TEXT:
${resumeText.substring(0, 4000)}

Score the resume in these categories and provide specific suggestions for improvement in each category.
Use the criteria from JobsDB Thailand career advice for IT positions.

Categories and max scores:
${criteriaText}

IMPORTANT: Respond ONLY with valid JSON in this exact format, no other text:
{
  "scores": {
    ${(criteriaData || []).map(c => `"${c.category}": <number 0-${c.max_score}>`).join(',\n    ')}
  },
  "suggestions": {
    ${(criteriaData || []).map(c => `"${c.category}": "<suggestion in Thai>"`).join(',\n    ')}
  },
  "summary": "<overall summary in Thai, 2-3 sentences>"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.4-nano',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_completion_tokens: 2000
    })

    const responseText = completion.choices[0].message.content.trim()

    // 4. Parse JSON response
    let result
    try {
      // ลบ markdown code block ถ้ามี
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
    } catch (parseError) {
      return Response.json({ error: 'AI ตอบกลับในรูปแบบที่ไม่ถูกต้อง' }, { status: 500 })
    }

    // 5. คำนวณคะแนนรวม
    const totalScore = result.scores.contact_info + result.scores.skills
      + result.scores.experience + result.scores.education + result.scores.structure

    // 6. อัปเดตผลลงตาราง analyses
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        total_score: totalScore,
        scores: result.scores,
        suggestions: { ...result.suggestions, summary: result.summary },
        status: 'completed'
      })
      .eq('id', analysisId)

    if (updateError) {
      return Response.json({ error: 'บันทึกผลล้มเหลว: ' + updateError.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      totalScore,
      scores: result.scores,
      suggestions: { ...result.suggestions, summary: result.summary }
    })

  } catch (error) {
    console.error('Analyze error:', error)
    return Response.json({ error: 'เกิดข้อผิดพลาด: ' + error.message }, { status: 500 })
  }
}
