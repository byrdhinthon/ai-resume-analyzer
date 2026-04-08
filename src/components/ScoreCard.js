export default function ScoreCard({ label, score, maxScore }) {
  const percent = (score / maxScore) * 100

  const getBarColor = () => {
    if (percent >= 80) return 'bg-green-500'
    if (percent >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getLevel = () => {
    if (percent >= 80) return 'ดีมาก'
    if (percent >= 60) return 'ดี'
    if (percent >= 40) return 'พอใช้'
    return 'ควรปรับปรุง'
  }

  const getLevelColor = () => {
    if (percent >= 80) return 'text-green-600'
    if (percent >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold">{score}/{maxScore}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <p className={`text-xs font-medium ${getLevelColor()}`}>{getLevel()}</p>
    </div>
  )
}
