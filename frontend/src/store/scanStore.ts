import { create } from 'zustand'
import api from '../lib/api'
import type { ScanSession, AttackPath, NetworkNode, RemediationScript, KillChainNarrative } from '../types/drishti.types'

interface GraphNode {
  id: string
  position: { x: number; y: number }
  data: {
    label: string
    ip: string
    risk_zone: string
    cvss_max: number
    vuln_count: number
    os?: string
  }
  style: Record<string, string | number>
}

interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  animated: boolean
  style: Record<string, string>
}

interface ScanStore {
  sessionId: string | null
  session: ScanSession | null
  summary: Record<string, number> | null
  graphNodes: GraphNode[]
  graphEdges: GraphEdge[]
  attackPaths: AttackPath[]
  selectedNode: NetworkNode | null
  blastRadiusNodes: Set<string>
  remediation: RemediationScript | null
  killChain: KillChainNarrative | null
  executiveSummary: string | null
  loading: boolean
  remediationLoading: boolean

  startScan: (target: string) => Promise<void>
  startScanDemo: () => Promise<void>
  loadScan: (sessionId: string) => Promise<void>
  loadGraph: (sessionId: string) => Promise<void>
  loadPaths: (sessionId: string) => Promise<void>
  selectNode: (node: NetworkNode | null) => void
  loadBlastRadius: (sessionId: string, nodeId: string) => Promise<void>
  generateRemediation: (sessionId: string, cveId: string, nodeId: string) => Promise<void>
  generateKillChain: (sessionId: string, pathId: string) => Promise<void>
  generateExecutiveSummary: (sessionId: string) => Promise<void>
}

export const useScanStore = create<ScanStore>((set, get) => ({
  sessionId: null,
  session: null,
  summary: null,
  graphNodes: [],
  graphEdges: [],
  attackPaths: [],
  selectedNode: null,
  blastRadiusNodes: new Set(),
  remediation: null,
  killChain: null,
  executiveSummary: null,
  loading: false,
  remediationLoading: false,

  startScan: async (target: string) => {
    set({ loading: true })
    const res = await api.post('/api/v1/scan/start', { target_network: target })
    const { session_id } = res.data
    set({ sessionId: session_id })
    await get().loadScan(session_id)
    await get().loadGraph(session_id)
    await get().loadPaths(session_id)
    set({ loading: false })
  },

  startScanDemo: async () => {
    set({ loading: true })
    const res = await api.get('/api/v1/demo')
    const { session_id } = res.data
    set({ sessionId: session_id })
    await get().loadScan(session_id)
    await get().loadGraph(session_id)
    await get().loadPaths(session_id)
    set({ loading: false })
  },

  loadScan: async (sessionId: string) => {
    const res = await api.get(`/api/v1/scan/${sessionId}`)
    set({ session: res.data.session, summary: res.data.summary })
  },

  loadGraph: async (sessionId: string) => {
    const res = await api.get(`/api/v1/graph/${sessionId}`)
    set({ graphNodes: res.data.nodes, graphEdges: res.data.edges })
  },

  loadPaths: async (sessionId: string) => {
    const res = await api.get(`/api/v1/paths/${sessionId}`)
    set({ attackPaths: res.data.paths })
  },

  selectNode: (node) => {
    set({ selectedNode: node, blastRadiusNodes: new Set(), remediation: null })
  },

  loadBlastRadius: async (sessionId, nodeId) => {
    const res = await api.get(`/api/v1/graph/${sessionId}/blast-radius/${nodeId}`)
    set({ blastRadiusNodes: new Set(res.data.blast_radius) })
  },

  generateRemediation: async (sessionId, cveId, nodeId) => {
    set({ remediationLoading: true, remediation: null })
    const res = await api.post('/api/v1/remediate', {
      session_id: sessionId,
      cve_id: cveId,
      node_id: nodeId,
    })
    set({ remediation: res.data.script, remediationLoading: false })
  },

  generateKillChain: async (sessionId, pathId) => {
    const res = await api.get(`/api/v1/kill-chain/${sessionId}/${pathId}`)
    set({ killChain: res.data.narrative })
  },

  generateExecutiveSummary: async (sessionId) => {
    const res = await api.get(`/api/v1/executive-summary/${sessionId}`)
    set({ executiveSummary: res.data.summary })
  },
}))
