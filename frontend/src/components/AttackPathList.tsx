import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScanStore } from '../store/scanStore'
import type { AttackPath, KillChainNarrative } from '../types/bhishon.types'

export default function AttackPathList() {
  const { attackPaths, sessionId, killChain, generateKillChain } = useScanStore()
  const [expandedPath, setExpandedPath] = useState<string | null>(null)
  const [storyMode, setStoryMode] = useState<Record<string, boolean>>({})

  if (!attackPaths.length) return null

  const toggleExpand = (pathId: string) => {
    setExpandedPath(expandedPath === pathId ? null : pathId)
  }

  const toggleStory = async (path: AttackPath) => {
    const newMode = !storyMode[path.id]
    setStoryMode((prev) => ({ ...prev, [path.id]: newMode }))
    if (newMode && sessionId) {
      await generateKillChain(sessionId, path.id)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Attack Paths ({attackPaths.length})</h3>
      {attackPaths.map((path, idx) => (
        <div key={path.id} className="bg-dark-700 rounded-lg border border-dark-600 overflow-hidden">
          {/* Header */}
          <div
            className="p-4 cursor-pointer hover:bg-dark-600 transition-colors"
            onClick={() => toggleExpand(path.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                  #{idx + 1}
                </span>
                <span className="font-medium">
                  {path.steps[0]?.from_node} → {path.steps[path.steps.length - 1]?.to_node}
                </span>
                <span className="text-gray-400 text-sm">{path.steps.length} hops</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-red-400 font-bold">
                  ${path.financial_impact_usd.toLocaleString()}
                </span>
                <span className="text-sm text-gray-400">Risk: {path.total_risk_score}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {path.mitre_tactics.map((t) => (
                <span key={t} className="text-xs bg-dark-600 text-gray-300 px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Expanded Detail */}
          <AnimatePresence>
            {expandedPath === path.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-dark-600"
              >
                <div className="p-4">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => toggleStory(path)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        storyMode[path.id]
                          ? 'bg-purple-600 text-white'
                          : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                      }`}
                    >
                      {storyMode[path.id] ? 'Technical View' : 'Story Mode'}
                    </button>
                  </div>

                  {storyMode[path.id] && killChain ? (
                    <KillChainView narrative={killChain} />
                  ) : (
                    <div className="space-y-3">
                      {path.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {i + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {step.from_node} → {step.to_node}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {step.exploit_vector}
                            </div>
                            <div className="text-xs text-gray-500">CVSS: {step.cvss_score}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function KillChainView({ narrative }: { narrative: KillChainNarrative }) {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-purple-400">{narrative.path_title}</h4>
      {narrative.steps.map((step) => (
        <div key={step.step} className="bg-dark-800 rounded p-3">
          <div className="text-sm font-medium text-purple-300 mb-1">
            Step {step.step}: {step.title}
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{step.narrative}</p>
        </div>
      ))}
      <div className="bg-red-900/30 border border-red-800 rounded p-3">
        <div className="text-sm font-medium text-red-400 mb-1">The Endgame</div>
        <p className="text-sm text-gray-300">{narrative.endgame}</p>
      </div>
    </div>
  )
}
