import { useScanStore } from './store/scanStore'
import LandingPage from './components/LandingPage'
import AttackGraph from './components/AttackGraph'
import Dashboard from './components/Dashboard'
import FixItPanel from './components/FixItPanel'

export default function App() {
  const { sessionId, loading, startScan, startScanDemo } = useScanStore()

  const handleStartScan = async (target: string) => {
    await startScan(target)
  }

  const handleLoadDemo = async () => {
    await startScanDemo()
  }

  // Landing page when no session
  if (!sessionId) {
    return <LandingPage onStartScan={handleStartScan} onLoadDemo={handleLoadDemo} loading={loading} />
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-hero-bg"><div className="text-center"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-muted-foreground text-sm">Scanning your network...</p></div></div>
  }

  return (
    <div className="h-screen flex flex-col bg-dark-950 text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-dark-900 border-b border-dark-600/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-md shadow-red-600/10">
            <span className="font-extrabold text-white text-sm">D</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Drishti</h1>
            <p className="text-[11px] text-gray-500">Network Risk Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-xs text-gray-400 font-mono">{loading ? 'Scanning' : 'Complete'}</span>
          </div>
          {sessionId && (
            <span className="text-[11px] text-gray-500 bg-dark-700 px-2.5 py-1 rounded-md font-mono border border-dark-600">
              {sessionId}
            </span>
          )}
          <button
            onClick={() => useScanStore.setState({ sessionId: null, session: null, graphNodes: [], graphEdges: [], attackPaths: [], executiveSummary: null, killChain: null, remediation: null, selectedNode: null, summary: null })}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg transition-colors"
          >
            New Scan
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Graph */}
        <div className="flex-1 relative bg-dark-950">
          <AttackGraph />
          {/* Zone Legend */}
          <div className="absolute bottom-4 left-4 bg-dark-800/90 backdrop-blur-sm rounded-lg p-3 border border-dark-600/60 text-xs space-y-1.5">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Risk Zones</div>
            {[
              { color: 'bg-red-500', label: 'Internet-Facing' },
              { color: 'bg-orange-500', label: 'DMZ' },
              { color: 'bg-yellow-500', label: 'Internal' },
              { color: 'bg-purple-600', label: 'Critical' },
            ].map((z) => (
              <div key={z.label} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-sm ${z.color}`} />
                <span className="text-gray-400">{z.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Dashboard */}
        <div className="w-[460px] bg-dark-900 border-l border-dark-600/60 overflow-y-auto">
          <Dashboard />
        </div>
      </div>

      {/* Fix-It Panel */}
      <FixItPanel />
    </div>
  )
}
