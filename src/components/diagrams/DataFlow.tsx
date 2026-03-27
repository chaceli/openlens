'use client'

import { useState, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import styles from './DataFlow.module.css'

interface DataFlowProps {
  flows?: FlowItem[]
}

type FlowItem = {
  id: string
  label: string
  from: string
  to: string
  data: string
  protocol: 'WebSocket' | 'HTTP' | 'RPC' | 'DB' | 'Stream'
  latency?: string
}

const DEFAULT_FLOWS: FlowItem[] = [
  { id: 'f1', label: 'Message In', from: 'User (Telegram)', to: 'Telegram Server', data: 'User message', protocol: 'HTTP', latency: '~50ms' },
  { id: 'f2', label: 'Webhook', from: 'Telegram Server', to: 'Gateway', data: 'POST /webhook/telegram', protocol: 'HTTP', latency: '~20ms' },
  { id: 'f3', label: 'Session Query', from: 'Gateway', to: 'Session Store', data: 'GET session_by_user_id', protocol: 'DB', latency: '~5ms' },
  { id: 'f4', label: 'Route to Agent', from: 'Gateway', to: 'Pi Agent', data: 'socket.emit("message", msg)', protocol: 'WebSocket', latency: '~2ms' },
  { id: 'f5', label: 'Context Fetch', from: 'Pi Agent', to: 'Vector Store', data: 'embedding.search(query)', protocol: 'RPC', latency: '~30ms' },
  { id: 'f6', label: 'AI Request', from: 'Pi Agent', to: 'Claude API', data: 'POST /v1/messages', protocol: 'HTTP', latency: '~500ms' },
  { id: 'f7', label: 'Tool Call', from: 'Pi Agent', to: 'Tool Executor', data: 'tool.search(query)', protocol: 'RPC', latency: '~100ms' },
  { id: 'f8', label: 'Skill Check', from: 'Pi Agent', to: 'ClawHub', data: 'GET /skills?q=flight', protocol: 'HTTP', latency: '~80ms' },
  { id: 'f9', label: 'AI Response', from: 'Claude API', to: 'Pi Agent', data: 'response.text', protocol: 'HTTP', latency: '~500ms' },
  { id: 'f10', label: 'Reply via Bot', from: 'Gateway', to: 'Telegram Server', data: 'POST.send_message()', protocol: 'HTTP', latency: '~50ms' },
  { id: 'f11', label: 'Message to User', from: 'Telegram Server', to: 'User', data: 'Bot reply', protocol: 'HTTP', latency: '~20ms' },
  { id: 'f12', label: 'Save Context', from: 'Pi Agent', to: 'Vector Store', data: 'embedding.add()', protocol: 'DB', latency: '~10ms' },
]

const PROTOCOL_COLORS: Record<string, { color: string; bg: string }> = {
  HTTP:      { color: '#22d3ee', bg: 'rgba(34,211,238,0.08)' },
  WebSocket: { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  RPC:       { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  DB:        { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  Stream:    { color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
}

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  'User (Telegram)': { x: 0, y: 200 },
  'Telegram Server': { x: 180, y: 200 },
  'Gateway': { x: 360, y: 200 },
  'Session Store': { x: 360, y: 60 },
  'Pi Agent': { x: 540, y: 200 },
  'Vector Store': { x: 540, y: 60 },
  'Claude API': { x: 720, y: 120 },
  'Tool Executor': { x: 720, y: 200 },
  'ClawHub': { x: 540, y: 340 },
}

const NODES_DATA = [
  { id: 'User (Telegram)', label: 'User (Telegram)', type: 'user' },
  { id: 'Telegram Server', label: 'Telegram Server', type: 'server' },
  { id: 'Gateway', label: 'Gateway (:18789)', type: 'gateway' },
  { id: 'Session Store', label: 'Session Store', type: 'storage' },
  { id: 'Pi Agent', label: 'Pi Agent', type: 'agent' },
  { id: 'Vector Store', label: 'Vector Store', type: 'storage' },
  { id: 'Claude API', label: 'Claude API', type: 'ai' },
  { id: 'Tool Executor', label: 'Tool Executor', type: 'tool' },
  { id: 'ClawHub', label: 'ClawHub', type: 'skill' },
]

export default function DataFlow({ flows = DEFAULT_FLOWS }: DataFlowProps) {
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null)
  const [filterProtocol, setFilterProtocol] = useState<string | null>(null)

  const flowsData: FlowItem[] = flows ?? DEFAULT_FLOWS

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = NODES_DATA.map(n => {
      const pos = NODE_POSITIONS[n.id] || { x: 300, y: 200 }
      return {
        id: n.id,
        position: pos,
        data: { label: n.label },
        style: {
          background: 'transparent',
          border: 'none',
        },
      }
    })

    const edges: Edge[] = flowsData
      .filter(f => !filterProtocol || f.protocol === filterProtocol)
      .map(flow => {
        const proto = PROTOCOL_COLORS[flow.protocol] || PROTOCOL_COLORS.HTTP
        const isSelected = selectedFlow === flow.id
        return {
          id: flow.id,
          source: flow.from,
          target: flow.to,
          type: 'smoothstep',
          animated: flow.protocol === 'Stream',
          style: {
            stroke: isSelected ? '#22d3ee' : proto.color,
            strokeWidth: isSelected ? 2.5 : 1.5,
            opacity: filterProtocol && flow.protocol !== filterProtocol ? 0.3 : 1,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: proto.color },
          label: isSelected ? `${flow.label} (${flow.latency})` : undefined,
          labelStyle: { fill: proto.color, fontSize: 10 },
          labelBgStyle: { fill: 'rgba(9,9,11,0.9)', rx: 4 },
        }
      })

    return { initialNodes: nodes, initialEdges: edges }
  }, [flowsData, filterProtocol, selectedFlow])

  const [rfNodes, , onNodesChange] = useNodesState(initialNodes)
  const [rfEdges, , onEdgesChange] = useEdgesState(initialEdges)

  const protocols: FlowItem['protocol'][] = [...new Set(flowsData.map(f => f.protocol))]

  const selectedFlowData = flowsData.find(f => f.id === selectedFlow)

  return (
    <div className={styles.container}>
      <div className={styles.flowDiagram}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={(_, edge) => setSelectedFlow(edge.id === selectedFlow ? null : edge.id)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-left"
          minZoom={0.3}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background color="#27272a" gap={20} />
          <Controls className={styles.controls} />

          {/* Custom node labels */}
          {NODES_DATA.map(n => {
            const pos = NODE_POSITIONS[n.id]
            if (!pos) return null
            const style = {
              position: 'absolute' as const,
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none' as const,
            }
            return (
              <div key={n.id} style={style}>
                <div className={`${styles.nodeLabel} ${styles[`node_${n.type}`]}`}>
                  {n.label}
                </div>
              </div>
            )
          })}

          <Panel position="top-right" className={styles.panel}>
            <div className={styles.protocolFilter}>
              <span className={styles.filterLabel}>Filter:</span>
              <button
                className={`${styles.filterBtn} ${!filterProtocol ? styles.activeFilter : ''}`}
                onClick={() => setFilterProtocol(null)}
              >All</button>
              {protocols.map(p => {
                const proto = PROTOCOL_COLORS[p]
                return (
                  <button
                    key={p}
                    className={`${styles.filterBtn} ${filterProtocol === p ? styles.activeFilter : ''}`}
                    style={filterProtocol === p ? { borderColor: proto.color, color: proto.color } : {}}
                    onClick={() => setFilterProtocol(p === filterProtocol ? null : p)}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendTitle}>Protocols</div>
        {Object.entries(PROTOCOL_COLORS).filter(([k]) => protocols.includes(k as FlowItem['protocol'])).map(([k, v]) => (
          <div key={k} className={styles.legendItem}>
            <span style={{ color: v.color }}>●</span>
            <span>{k}</span>
          </div>
        ))}
        <div className={styles.legendDivider} />
        <div className={styles.legendTitle}>Node Types</div>
        <div className={styles.legendItem}><span className={styles.dotUser}>●</span> User</div>
        <div className={styles.legendItem}><span className={styles.dotServer}>●</span> Server</div>
        <div className={styles.legendItem}><span className={styles.dotGateway}>●</span> Gateway</div>
        <div className={styles.legendItem}><span className={styles.dotAgent}>●</span> Agent</div>
        <div className={styles.legendItem}><span className={styles.dotStorage}>●</span> Storage</div>
      </div>

      {selectedFlowData && (
        <div className={styles.flowDetail}>
          <div className={styles.flowDetailHeader}>
            <span className={styles.flowLabel}>{selectedFlowData.label}</span>
            <button className={styles.closeBtn} onClick={() => setSelectedFlow(null)}>×</button>
          </div>
          <div className={styles.flowDetailBody}>
            <div className={styles.flowRow}>
              <span className={styles.flowKey}>From</span>
              <span className={styles.flowVal}>{selectedFlowData.from}</span>
            </div>
            <div className={styles.flowRow}>
              <span className={styles.flowKey}>To</span>
              <span className={styles.flowVal}>{selectedFlowData.to}</span>
            </div>
            <div className={styles.flowRow}>
              <span className={styles.flowKey}>Data</span>
              <span className={styles.flowVal} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{selectedFlowData.data}</span>
            </div>
            <div className={styles.flowRow}>
              <span className={styles.flowKey}>Protocol</span>
              <span className={styles.flowVal} style={{ color: PROTOCOL_COLORS[selectedFlowData.protocol]?.color }}>{selectedFlowData.protocol}</span>
            </div>
            {selectedFlowData.latency && (
              <div className={styles.flowRow}>
                <span className={styles.flowKey}>Latency</span>
                <span className={styles.flowVal} style={{ color: '#4ade80' }}>{selectedFlowData.latency}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
