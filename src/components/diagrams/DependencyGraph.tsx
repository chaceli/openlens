'use client'

import { useCallback, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import styles from './DependencyGraph.module.css'

interface DependencyNode {
  id: string
  label: string
  type: 'gateway' | 'agent' | 'channels' | 'providers' | 'memory' | 'tools' | 'skills' | 'session' | 'default'
}

interface DependencyGraphProps {
  nodes: DependencyNode[]
  edges: { from: string; to: string }[]
}

const nodeColors: Record<string, string> = {
  gateway: '#22d3ee',
  agent: '#fbbf24',
  default: '#71717a',
}

export default function DependencyGraph({ nodes, edges }: DependencyGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const positionMap: Record<string, { x: number; y: number }> = {
    '1': { x: 250, y: 40 },
    '2': { x: 250, y: 120 },
    '3': { x: 250, y: 200 },
    '4': { x: 80, y: 120 },
    '5': { x: 420, y: 120 },
    '6': { x: 120, y: 280 },
    '7': { x: 250, y: 280 },
    '8': { x: 380, y: 280 },
  }

  const initialNodes: Node[] = nodes.map((node) => {
    const pos = positionMap[node.id] || { x: 250, y: 150 }
    return {
      id: node.id,
      position: pos,
      data: { label: node.label },
      style: {
        background: node.type === 'gateway' ? 'rgba(34, 211, 238, 0.1)' :
                    node.type === 'agent' ? 'rgba(251, 191, 36, 0.1)' :
                    'rgba(255, 255, 255, 0.05)',
        border: `2px solid ${nodeColors[node.type] || nodeColors.default}`,
        borderRadius: '8px',
        padding: '10px 15px',
        color: nodeColors[node.type] || '#fafafa',
        fontSize: '13px',
        fontWeight: 500,
      },
    }
  })

  const initialEdges: Edge[] = edges.map((edge, i) => ({
    id: `e${i}`,
    source: edge.from,
    target: edge.to,
    type: 'smoothstep',
    style: { stroke: '#52525b', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
  }))

  const [rfNodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedNode(node.id === selectedNode ? null : node.id)
  }, [selectedNode])

  return (
    <div className={styles.container}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#27272a" gap={20} />
        <Controls className={styles.controls} />
      </ReactFlow>
      {selectedNode && (
        <div className={styles.tooltip}>
          <strong>{selectedNode}</strong>
          <p>Click another node to explore relationships</p>
        </div>
      )}
    </div>
  )
}