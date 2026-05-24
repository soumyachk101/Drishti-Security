import { useScanStore } from '../store/scanStore'
import AttackPathList from './AttackPathList'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const ZONE_COLORS: Record<string, string> = {
  INTERNET_FACING: '#ef4444',
  DMZ: '#f97316',
  INTERNAL: '#eab308',
  CRITICAL: '#7c3aed',
}

export default function Dashboard() {
  const { session, summary, executiveSummary, generateExecutiveSummary, sessionId } = useScanStore()

  const handleExportReport = () => {
    if (!sessionId) return
    window.open(`/api/v1/report/${sessionId}`, '_blank')
  }

  if (!session || !summary) {
    return (
      <div className="p-6 text-center text-gray-500 text-sm">
        <p>No scan data available.</p>
        <p className="text-xs mt-2 text-gray-600">Click "New Scan" to try again.</p>
      </div>
    )
  }

  const stats = [
    { label: 'Nodes Scanned', value: summary.total_nodes.toString(), color: 'text-blue-400', icon: '◎' },
    { label: 'Vulnerabilities', value: summary.total_vulnerabilities.toString(), color: 'text-yellow-400', icon: '◆' },
    { label: 'Critical CVEs', value: summary.critical_vulnerabilities.toString(), color: 'text-red-400', icon: '▲' },
    { label: 'Internet-Facing', value: summary.internet_facing_nodes.toString(), color: 'text-orange-400', icon: '◈' },
  ]

  // Zone distribution for pie chart
  const zoneCounts: Record<string, number> = {}
  for (const node of session.nodes) {
    const zone = node.risk_zone
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1
  }
  const zoneData = Object.entries(zoneCounts).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
    color: ZONE_COLORS[name] || '#6b7280',
  }))

  // Severity distribution
  let criticalCount = 0
  let highCount = 0
  let mediumCount = 0
  let lowCount = 0
  for (const node of session.nodes) {
    for (const v of node.vulnerabilities) {
      if (v.cvss_v3 >= 9) criticalCount++
      else if (v.cvss_v3 >= 7) highCount++
      else if (v.cvss_v3 >= 4) mediumCount++
      else lowCount++
    }
  }
  const severityData = [
    { name: 'Critical', value: criticalCount, color: '#ef4444' },
    { name: 'High', value: highCount, color: '#f97316' },
    { name: 'Medium', value: mediumCount, color: '#eab308' },
    { name: 'Low', value: lowCount, color: '#6b7280' },
  ].filter((d) => d.value > 0)

  return (
    <div className="p-5 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-dark-700/80 rounded-lg p-3.5 border border-dark-600/80 card-glow"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</span>
              <span className="text-xs text-gray-600">{s.icon}</span>
            </div>
            <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      {zoneData.length > 0 && severityData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Risk Distribution
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Zone Pie */}
            <div className="bg-dark-700/80 rounded-lg p-3 border border-dark-600/80">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 text-center">
                By Zone
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={zoneData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {zoneData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#161822',
                      border: '1px solid #2a2d3e',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {zoneData.map((z) => (
                  <div key={z.name} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: z.color }} />
                    {z.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Severity Pie */}
            <div className="bg-dark-700/80 rounded-lg p-3 border border-dark-600/80">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 text-center">
                By Severity
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#161822',
                      border: '1px solid #2a2d3e',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {severityData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Risk */}
      <div className="bg-dark-700/80 rounded-lg p-4 border border-dark-600/80 card-glow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Financial Exposure</div>
            <div className="text-3xl font-bold text-red-400 mt-1 tabular-nums">
              ${(summary.total_financial_risk_usd as number).toLocaleString()}
            </div>
          </div>
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-xl text-red-400">$</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Most critical: <span className="text-gray-300 font-medium">{session.most_critical_target}</span>
        </div>
        <button
          onClick={handleExportReport}
          className="mt-3 w-full py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
        >
          <span>Export Risk Report</span>
          <span className="text-indigo-300 text-xs">↗</span>
        </button>
      </div>

      {/* Executive Summary */}
      <div className="bg-dark-700/80 rounded-lg p-4 border border-dark-600/80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Executive Summary
          </h3>
          <button
            onClick={() => sessionId && generateExecutiveSummary(sessionId)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors font-medium ${
              executiveSummary
                ? 'bg-dark-600 text-gray-400 hover:text-white border border-dark-500'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {executiveSummary ? 'Regenerate' : 'Generate AI Summary'}
          </button>
        </div>
        {executiveSummary ? (
          <p className="text-sm text-gray-300 leading-relaxed">{executiveSummary}</p>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-2">
              AI-powered executive summary ready
            </p>
            <p className="text-xs text-gray-600">
              Translates technical findings into business-impact language for leadership
            </p>
          </div>
        )}
      </div>

      {/* Attack Paths */}
      <AttackPathList />
    </div>
  )
}
