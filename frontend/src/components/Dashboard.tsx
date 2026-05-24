import { useScanStore } from '../store/scanStore'
import AttackPathList from './AttackPathList'

export default function Dashboard() {
  const { session, summary, executiveSummary, generateExecutiveSummary, sessionId } = useScanStore()

  const handleExportReport = () => {
    if (!sessionId) return
    window.open(`/api/v1/report/${sessionId}`, '_blank')
  }

  if (!session || !summary) return null

  const stats = [
    { label: 'Nodes Scanned', value: summary.total_nodes, color: 'text-blue-400' },
    { label: 'Vulnerabilities', value: summary.total_vulnerabilities, color: 'text-yellow-400' },
    { label: 'Critical CVEs', value: summary.critical_vulnerabilities, color: 'text-red-400' },
    { label: 'Internet-Facing', value: summary.internet_facing_nodes, color: 'text-orange-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-dark-700 rounded-lg p-4 border border-dark-600">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Financial Risk */}
      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
        <div className="text-sm text-gray-400">Total Financial Exposure</div>
        <div className="text-3xl font-bold text-red-400 mt-1">
          ${(summary.total_financial_risk_usd as number).toLocaleString()}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Most critical: {session.most_critical_target}
        </div>
        <button
          onClick={handleExportReport}
          className="mt-3 w-full py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded transition-colors font-medium"
        >
          Export Risk Report
        </button>
      </div>

      {/* Executive Summary */}
      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Executive Summary</h3>
          <button
            onClick={() => sessionId && generateExecutiveSummary(sessionId)}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            {executiveSummary ? 'Regenerate' : 'Generate'}
          </button>
        </div>
        {executiveSummary ? (
          <p className="text-gray-300 leading-relaxed">{executiveSummary}</p>
        ) : (
          <p className="text-gray-500 italic">Click Generate to create an AI executive summary</p>
        )}
      </div>

      {/* Attack Paths */}
      <AttackPathList />
    </div>
  )
}
