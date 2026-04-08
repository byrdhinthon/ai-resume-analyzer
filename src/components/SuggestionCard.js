export default function SuggestionCard({ label, suggestion, score, maxScore }) {
  const percent = (score / maxScore) * 100

  const getBorderColor = () => {
    if (percent >= 80) return 'border-l-green-500'
    if (percent >= 60) return 'border-l-yellow-500'
    return 'border-l-red-500'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-l-4 ${getBorderColor()} p-4`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm text-gray-800">{label}</h3>
        <span className="text-xs text-gray-500">{score}/{maxScore}</span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{suggestion}</p>
    </div>
  )
}
