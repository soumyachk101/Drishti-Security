import { useEffect } from 'react'
import { useScanStore } from './store/scanStore'
import AttackGraph from './components/AttackGraph'
import Dashboard from './components/Dashboard'
import FixItPanel from './components/FixItPanel'

export default function App() {
  const { sessionId, loading, startScan, loadScan, loadGraph, loadPaths } = useScanStore()

  useEffect(() => {
    // Load demo data on mount
    const init = async () => {
      await loadScan('demo-001')
      await loadGraph('demo-001')
      await loadPaths('demo-001')
      useScanStore.setState({ sessionId: 'demo-001' })
    }
    init()
  }, [])

  return (
    <div className="h-screen flex flex-col bg-dark-900 text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-dark-800 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-sm">
            B
          </div>
          <div>
            <h1 className="text-lg font-bold">Bhishon Security</h1>
            <p className="text-xs text-gray-500">AI-Powered Network Risk Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sessionId && (
            <span className="text-xs text-gray-400 bg-dark-700 px-2 py-1 rounded">
              Session: {sessionId}
            </span>
          )}
          <button
            onClick={startScan}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            {loading ? 'Scanning...' : 'New Scan'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Graph */}
        <div className="flex-1 relative">
          <AttackGraph />
          {/* Zone Legend */}
          <div className="absolute bottom-4 left-4 bg-dark-800/90 rounded-lg p-3 border border-dark-600 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500" /> Internet-Facing
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-orange-500" /> DMZ
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-yellow-500" /> Internal
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-600" /> Critical
            </div>
          </div>
        </div>

        {/* Right: Dashboard */}
        <div className="w-[480px] bg-dark-800 border-l border-dark-600 overflow-y-auto p-6">
          <Dashboard />
        </div>
      </div>

      {/* Fix-It Panel (slides over) */}
      <FixItPanel />
    </div>
  )
}
