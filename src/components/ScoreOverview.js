export default function ScoreOverview({ score }) {
  const getColor = () => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getLevel = () => {
    if (score >= 80) return 'ดีมาก'
    if (score >= 60) return 'ดี'
    if (score >= 40) return 'พอใช้'
    return 'ควรปรับปรุง'
  }

  const getBgColor = () => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className={`rounded-lg border p-8 text-center ${getBgColor()}`}>
      <p className="text-sm text-gray-500 mb-2">คะแนนรวม</p>
      <p className={`text-6xl font-bold ${getColor()}`}>
        {score}<span className="text-2xl text-gray-400">/100</span>
      </p>
      <p className={`text-lg mt-2 font-medium ${getColor()}`}>{getLevel()}</p>
    </div>
  )
}
