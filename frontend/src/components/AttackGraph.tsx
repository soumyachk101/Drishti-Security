import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useScanStore } from '../store/scanStore'

const ZONE_COLORS: Record<string, string> = {
  INTERNET_FACING: '#ef4444',
  DMZ: '#f97316',
  INTERNAL: '#eab308',
  CRITICAL: '#7c3aed',
}

export default function AttackGraph() {
  const {
    graphNodes,
    graphEdges,
    blastRadiusNodes,
    session,
    selectNode,
    loadBlastRadius,
  } = useScanStore()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const styledNodes: any[] = (graphNodes || []).map((n) => ({
      ...n,
      className: blastRadiusNodes.has(n.id) ? 'blast-pulse' : '',
      style: {
        ...n.style,
        border: blastRadiusNodes.has(n.id)
          ? '3px solid #ff0000'
          : '1px solid rgba(255,255,255,0.2)',
      },
    }))
    setNodes(styledNodes)
  }, [graphNodes, blastRadiusNodes, setNodes])

  useEffect(() => {
    const styledEdges: any[] = (graphEdges || []).map((e) => ({
      ...e,
      type: 'smoothstep',
    }))
    setEdges(styledEdges)
  }, [graphEdges, setEdges])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      if (!session) return
      const match = session.nodes.find((n) => n.id === node.id)
      if (match) {
        selectNode(match)
        loadBlastRadius(session.id, node.id)
      }
    },
    [session, selectNode, loadBlastRadius],
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={20} color="#1f2937" />
        <Controls />
        <MiniMap
          nodeColor={(n: any) => ZONE_COLORS[n.data?.risk_zone as string] || '#6b7280'}
          maskColor="rgba(0,0,0,0.7)"
        />
      </ReactFlow>
    </div>
  )
}
