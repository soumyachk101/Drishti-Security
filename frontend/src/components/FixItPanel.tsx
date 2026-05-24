import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScanStore } from '../store/scanStore'

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-900/40', text: 'text-red-300', border: 'border-red-500' },
  high: { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-500' },
  medium: { bg: 'bg-yellow-900/40', text: 'text-yellow-300', border: 'border-yellow-500' },
  low: { bg: 'bg-gray-800', text: 'text-gray-300', border: 'border-gray-600' },
}

function getSeverity(cvss: number) {
  if (cvss >= 9) return 'critical'
  if (cvss >= 7) return 'high'
  if (cvss >= 4) return 'medium'
  return 'low'
}

export default function FixItPanel() {
  const {
    selectedNode,
    sessionId,
    remediation,
    remediationLoading,
    generateRemediation,
    selectNode,
  } = useScanStore()
  const [copied, setCopied] = useState(false)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)

  if (!selectedNode) return null

  const handleGenerate = async (cveId: string) => {
    if (!sessionId) return
    setGeneratingFor(cveId)
    await generateRemediation(sessionId, cveId, selectedNode.id)
    setGeneratingFor(null)
  }

  const handleCopy = () => {
    if (remediation) {
      navigator.clipboard.writeText(remediation.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!remediation) return
    const ext = remediation.language === 'yaml' ? 'yml' : 'sh'
    const blob = new Blob([remediation.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fix-${remediation.cve_id || 'script'}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="fixed right-0 top-0 h-full w-96 bg-dark-800 border-l border-dark-600/80 z-50 overflow-y-auto shadow-2xl shadow-black/40"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-800/95 backdrop-blur-sm border-b border-dark-600/60">
          <div className="px-5 py-4 flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">
                {selectedNode.hostname || selectedNode.id}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 font-mono">{selectedNode.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                  selectedNode.risk_zone === 'CRITICAL'
                    ? 'bg-purple-900/50 text-purple-300 border border-purple-600/30'
                    : selectedNode.risk_zone === 'INTERNET_FACING'
                      ? 'bg-red-900/50 text-red-300 border border-red-600/30'
                      : 'bg-dark-600 text-gray-400 border border-dark-500'
                }`}>
                  {selectedNode.risk_zone.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button
              onClick={() => selectNode(null)}
              className="flex-shrink-0 w-7 h-7 rounded-md bg-dark-700 hover:bg-dark-600 border border-dark-600 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Node Info */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="OS" value={selectedNode.os || 'Unknown'} />
            <InfoCard
              label="CVSS Max"
              value={selectedNode.cvss_max.toFixed(1)}
              highlight
            />
            <InfoCard
              label="Criticality"
              value={`${(selectedNode.asset_criticality * 100).toFixed(0)}%`}
            />
            <InfoCard
              label="Open Ports"
              value={selectedNode.open_ports.length.toString()}
            />
          </div>

          {/* Open Ports */}
          {selectedNode.open_ports.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2.5">
                Open Ports
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(selectedNode.open_ports || []).map((p) => (
                  <div
                    key={p.port}
                    className="flex items-center gap-1.5 bg-dark-700 border border-dark-600 rounded-md px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-blue-400 font-mono font-medium">{p.port}</span>
                    <span className="text-gray-300">{p.service}</span>
                    {p.version && (
                      <span className="text-gray-600 ml-0.5">{p.version}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vulnerabilities */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2.5">
              Vulnerabilities ({selectedNode.vulnerabilities.length})
            </h4>
            <div className="space-y-2.5">
              {(selectedNode.vulnerabilities || []).map((v) => {
                const severity = getSeverity(v.cvss_v3)
                const sev = SEVERITY_CONFIG[severity]
                const isGenerating = generatingFor === v.cve_id

                return (
                  <div
                    key={v.cve_id}
                    className={`bg-dark-700 rounded-lg border-l-2 ${sev.border} p-3.5 border border-dark-600 border-l-2`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-mono font-medium text-red-400">
                        {v.cve_id}
                      </span>
                      <div className={`text-[11px] font-bold px-2 py-0.5 rounded ${sev.bg} ${sev.text}`}>
                        {v.cvss_v3}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">
                      {v.description}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-gray-500">
                        EPSS {(v.epss_score * 100).toFixed(0)}%
                      </span>
                      {v.financial_risk_usd && (
                        <span className="text-[11px] text-red-400/80">
                          ${v.financial_risk_usd.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleGenerate(v.cve_id)}
                      disabled={remediationLoading}
                      className="w-full py-2 text-xs font-medium bg-green-600/90 hover:bg-green-600 disabled:bg-dark-600 disabled:text-gray-500 rounded-md transition-all flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating Fix...
                        </>
                      ) : (
                        'Generate Fix'
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Remediation Script */}
          <AnimatePresence>
            {remediation && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Remediation Script
                  </h4>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 text-[11px] bg-dark-600 hover:bg-dark-500 border border-dark-500 rounded transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-2.5 py-1 text-[11px] bg-dark-600 hover:bg-dark-500 border border-dark-500 rounded transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
                <pre className="code-block bg-dark-950 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap border border-dark-600 max-h-[400px] overflow-y-auto">
                  {remediation.content}
                </pre>
                <p className="text-[11px] text-yellow-500/70 italic flex items-center gap-1.5">
                  <span>⚠</span> Review before running in production
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state hint */}
          {!remediation && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-600">
                Click "Generate Fix" on a vulnerability above to get AI-powered remediation
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-dark-700 rounded-lg p-3 border border-dark-600">
      <div className={`text-lg font-bold ${highlight ? 'text-red-400' : 'text-gray-200'}`}>
        {value}
      </div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
