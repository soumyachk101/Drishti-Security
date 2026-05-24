import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScanStore } from '../store/scanStore'
import type { AttackPath, KillChainNarrative } from '../types/drishti.types'

export default function AttackPathList() {
  const { attackPaths, sessionId, killChain, generateKillChain } = useScanStore()
  const [expandedPath, setExpandedPath] = useState<string | null>(null)
  const [storyMode, setStoryMode] = useState<Record<string, boolean>>({})

  if (!attackPaths || !attackPaths.length) return null

  const toggleExpand = (pathId: string) => {
    setExpandedPath(expandedPath === pathId ? null : pathId)
  }

  const toggleStory = async (e: React.MouseEvent, path: AttackPath) => {
    e.stopPropagation()
    const newMode = !storyMode[path.id]
    setStoryMode((prev) => ({ ...prev, [path.id]: newMode }))
    if (newMode && sessionId) {
      await generateKillChain(sessionId, path.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Attack Paths</h3>
        <span className="text-xs text-gray-500 bg-dark-700 px-2 py-0.5 rounded border border-dark-600">
          {attackPaths.length} found
        </span>
      </div>

      <div className="space-y-3">
        {attackPaths.map((path, idx) => (
          <div
            key={path.id}
            className="bg-dark-700/80 rounded-lg border border-dark-600 overflow-hidden card-glow"
          >
            {/* Header */}
            <div
              className="p-4 cursor-pointer hover:bg-dark-600/60 transition-colors"
              onClick={() => toggleExpand(path.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-gray-300 font-mono">
                    <span className="text-red-300">{path.steps[0]?.from_node}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-red-300">
                      {path.steps[path.steps.length - 1]?.to_node}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-red-400 font-semibold tabular-nums">
                    ${(path.financial_impact_usd / 1_000_000).toFixed(2)}M
                  </span>
                  <motion.span
                    animate={{ rotate: expandedPath === path.id ? 180 : 0 }}
                    className="text-gray-500 text-xs"
                  >
                    ▼
                  </motion.span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{path.steps.length} hops</span>
                <span className="text-gray-700">•</span>
                <span>Risk Score {path.total_risk_score.toFixed(0)}</span>
              </div>

              <div className="flex gap-1.5 mt-2.5">
                {path.mitre_tactics.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] bg-dark-600 text-gray-400 px-2 py-0.5 rounded-full border border-dark-500/50"
                  >
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
                  transition={{ duration: 0.2 }}
                  className="border-t border-dark-600"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => toggleStory(e, path)}
                          className={`px-3 py-1.5 text-xs rounded-md transition-colors font-medium ${
                            storyMode[path.id]
                              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                              : 'bg-dark-600 text-gray-400 border border-dark-500 hover:bg-dark-500'
                          }`}
                        >
                          {storyMode[path.id] ? 'Technical View' : 'Story Mode'}
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-600">
                        Blast Radius: {path.blast_radius.length} nodes
                      </span>
                    </div>

                    {storyMode[path.id] && killChain ? (
                      <KillChainView narrative={killChain} />
                    ) : (
                      <div className="relative pl-6">
                        {/* Vertical timeline line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-dark-600" />

                        <div className="space-y-3">
                          {path.steps.map((step, i) => (
                            <div key={i} className="relative flex items-start gap-3">
                              <div
                                className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600/20 border-2 border-red-500/40 flex items-center justify-center text-[10px] font-bold text-red-300 z-10"
                              >
                                {i + 1}
                              </div>
                              <div className="pb-1">
                                <div className="text-sm font-medium text-gray-200">
                                  {step.from_node} <span className="text-gray-600 mx-1">→</span> {step.to_node}
                                </div>
                                <div className="text-xs text-gray-400 mt-1 leading-relaxed">
                                  {step.exploit_vector}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-[10px] text-gray-600">
                                    CVSS {step.cvss_score}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

function KillChainView({ narrative }: { narrative: KillChainNarrative }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-purple-400">{narrative.path_title}</h4>

      <div className="relative pl-6">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-dark-600" />

        <div className="space-y-4">
          {narrative.steps.map((step) => (
            <div key={step.step} className="relative">
              <div className="absolute left-[-1.5rem] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500/30 border border-purple-500/50 z-10" />
              <div>
                <div className="text-sm font-medium text-purple-300/90 mb-1.5">
                  Step {step.step}: {step.title}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{step.narrative}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-3.5">
        <div className="text-sm font-medium text-red-400 mb-1.5">The Endgame</div>
        <p className="text-sm text-gray-300 leading-relaxed">{narrative.endgame}</p>
      </div>
    </div>
  )
}
