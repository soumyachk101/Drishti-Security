import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScanStore } from '../store/scanStore'

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

  if (!selectedNode) return null

  const handleGenerate = async (cveId: string) => {
    if (!sessionId) return
    await generateRemediation(sessionId, cveId, selectedNode.id)
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
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="fixed right-0 top-0 h-full w-96 bg-dark-800 border-l border-dark-600 z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-dark-800 border-b border-dark-600 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{selectedNode.hostname || selectedNode.id}</h3>
            <div className="text-sm text-gray-400">{selectedNode.id}</div>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Node Info */}
          <div className="space-y-2 text-sm">
            <InfoRow label="OS" value={selectedNode.os || 'Unknown'} />
            <InfoRow label="Risk Zone" value={selectedNode.risk_zone} />
            <InfoRow label="CVSS Max" value={selectedNode.cvss_max.toString()} />
            <InfoRow
              label="Criticality"
              value={`${(selectedNode.asset_criticality * 100).toFixed(0)}%`}
            />
          </div>

          {/* Open Ports */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Open Ports ({selectedNode.open_ports.length})
            </h4>
            <div className="space-y-1">
              {selectedNode.open_ports.map((p) => (
                <div key={p.port} className="flex items-center gap-2 text-sm">
                  <span className="text-blue-400 font-mono">{p.port}</span>
                  <span className="text-gray-300">{p.service}</span>
                  {p.version && (
                    <span className="text-gray-500 text-xs">({p.version})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vulnerabilities */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Vulnerabilities ({selectedNode.vulnerabilities.length})
            </h4>
            <div className="space-y-3">
              {selectedNode.vulnerabilities.map((v) => (
                <div key={v.cve_id} className="bg-dark-700 rounded-lg p-3 border border-dark-600">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono font-medium text-red-400">
                      {v.cve_id}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        v.cvss_v3 >= 9
                          ? 'bg-red-600 text-white'
                          : v.cvss_v3 >= 7
                            ? 'bg-orange-600 text-white'
                            : 'bg-yellow-600 text-black'
                      }`}
                    >
                      CVSS {v.cvss_v3}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{v.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      EPSS: {(v.epss_score * 100).toFixed(0)}%
                    </span>
                    {v.financial_risk_usd && (
                      <span className="text-xs text-red-400">
                        ${v.financial_risk_usd.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleGenerate(v.cve_id)}
                    disabled={remediationLoading}
                    className="mt-2 w-full py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition-colors"
                  >
                    {remediationLoading ? 'Generating...' : 'Generate Fix'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Remediation Script */}
          <AnimatePresence>
            {remediation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-green-400">Remediation Script</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-2 py-1 text-xs bg-dark-600 hover:bg-dark-500 rounded"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-2 py-1 text-xs bg-dark-600 hover:bg-dark-500 rounded"
                    >
                      Download
                    </button>
                  </div>
                </div>
                <pre className="bg-dark-900 rounded p-3 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap border border-dark-600">
                  {remediation.content}
                </pre>
                <p className="text-xs text-yellow-500/80 italic">
                  Review before running in production
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300">{value}</span>
    </div>
  )
}
