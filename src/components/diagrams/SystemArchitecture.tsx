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
  NodeProps,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import styles from './SystemArchitecture.module.css'

// ─── Node Types ───────────────────────────────────────────────────────────────

interface ArchitectureNodeData {
  label: string
  sublabel?: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  count?: number | string
  description?: string
}

// Gateway — Hub node with left/right/bottom handles for horizontal + vertical routing
function GatewayNode({ data }: NodeProps<ArchitectureNodeData>) {
  return (
    <div className={styles.gatewayNode} style={{
      borderColor: data.borderColor,
      background: data.bgColor,
    }}>
      <Handle type="target" position={Position.Left} className={styles.handle} />
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <div className={styles.nodeIcon}>{data.icon}</div>
      <div className={styles.nodeLabel}>{data.label}</div>
      {data.sublabel && <div className={styles.nodeSublabel}>{data.sublabel}</div>}
      <Handle type="source" position={Position.Right} className={styles.handle} />
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  )
}

// GroupNode — For tool/skill/memory clusters (bottom row)
function GroupNode({ data }: NodeProps<ArchitectureNodeData>) {
  return (
    <div className={styles.groupNode} style={{ borderColor: data.borderColor }}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <div className={styles.groupHeader} style={{ color: data.color }}>
        <span className={styles.groupIcon}>{data.icon}</span>
        <span className={styles.groupLabel}>{data.label}</span>
        {data.count !== undefined && <span className={styles.groupCount}>{data.count}</span>}
      </div>
      <div className={styles.groupChildren}>{data.sublabel}</div>
    </div>
  )
}

// ChannelNode — Left side nodes (channels) with RIGHT source handle
function ChannelNode({ data }: NodeProps<ArchitectureNodeData>) {
  return (
    <div className={styles.channelNode} style={{
      borderColor: data.borderColor,
      background: data.bgColor,
    }}>
      <Handle type="target" position={Position.Left} className={styles.handle} />
      <div className={styles.compIcon}>{data.icon}</div>
      <div className={styles.compLabel}>{data.label}</div>
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  )
}

// ProviderNode — Right side nodes (providers) with LEFT target handle
function ProviderNode({ data }: NodeProps<ArchitectureNodeData>) {
  return (
    <div className={styles.providerNode} style={{
      borderColor: data.borderColor,
      background: data.bgColor,
    }}>
      <Handle type="target" position={Position.Left} className={styles.handle} />
      <div className={styles.compIcon}>{data.icon}</div>
      <div className={styles.compLabel}>{data.label}</div>
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  )
}

// AgentNode — Pi Agent with top/bottom handles
function AgentNode({ data }: NodeProps<ArchitectureNodeData>) {
  return (
    <div className={styles.gatewayNode} style={{
      borderColor: data.borderColor,
      background: data.bgColor,
    }}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <Handle type="target" position={Position.Left} className={styles.handle} />
      <div className={styles.nodeIcon}>{data.icon}</div>
      <div className={styles.nodeLabel}>{data.label}</div>
      {data.sublabel && <div className={styles.nodeSublabel}>{data.sublabel}</div>}
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  )
}

const nodeTypes = {
  gatewayNode: GatewayNode,
  groupNode: GroupNode,
  channelNode: ChannelNode,
  providerNode: ProviderNode,
  agentNode: AgentNode,
}

// ─── Icon / Label Helpers ──────────────────────────────────────────────────────

function getChannelIcon(name: string): string {
  const map: Record<string, string> = {
    WhatsApp: '💬', Telegram: '✈️', Discord: '🎮', Slack: '💼',
    Signal: '🔒', 'iMessage': '🍎', LINE: '💚', Feishu: '📮',
    Teams: '👥', IRC: '💬', Matrix: '🔳', WebChat: '🌍',
  }
  return map[name] || '💬'
}

function getProviderIcon(name: string): string {
  const map: Record<string, string> = {
    OpenAI: '🤖', Claude: '🧠', Gemini: '✨', Groq: '⚡',
    Ollama: '🦙', DeepSeek: '🔮', Mistral: '🌊', Llama: '🦁',
    Qwen: '🌟', LocalAI: '🏠', 'Azure OpenAI': '☁️', Anthropic: '🧬',
  }
  return map[name] || '🤖'
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface SystemArchitectureProps {
  data?: {
    channels?: string[]
    providers?: string[]
    tools?: string[]
    skills?: string[]
  }
}

const DEFAULT_CHANNELS = [
  'WhatsApp', 'Telegram', 'Discord', 'Slack',
  'Signal', 'iMessage', 'LINE', 'Feishu',
  'Teams', 'IRC', 'Matrix', 'WebChat',
]

const DEFAULT_PROVIDERS = [
  'OpenAI', 'Claude', 'Gemini', 'Groq',
  'Ollama', 'DeepSeek', 'Mistral', 'Llama',
  'Qwen', 'LocalAI', 'Azure OpenAI', 'Anthropic',
]

const DEFAULT_TOOLS = ['File System', 'Web Search', 'Code Exec', 'Browser', 'Calculator', 'HTTP Client']
const DEFAULT_SKILLS = ['ClawHub Registry', 'Auto Install', 'Skill Manager']
const DEFAULT_MEMORY = ['Vector Store', 'Session Context', 'Long-term Memory']

// ─── Layout Constants ──────────────────────────────────────────────────────────
// Canvas: 1300 x 750
// Layout:  Channels(LEFT) → Gateway(CENTER) → Providers(RIGHT)
//                               ↓
//                         Pi Agent
//                               ↓
//         Tools · Skills · Memory · Canvas · Voice

const CENTER_X = 640
const GATEWAY_Y = 220
const CHANNEL_START_Y = 60
const PROVIDER_START_Y = 380
const AGENT_Y = 580
const BOTTOM_Y = 700

export default function SystemArchitecture({ data }: SystemArchitectureProps) {
  const channels = data?.channels || DEFAULT_CHANNELS
  const providers = data?.providers || DEFAULT_PROVIDERS
  const tools = data?.tools || DEFAULT_TOOLS
  const skills = data?.skills || DEFAULT_SKILLS
  const memory = DEFAULT_MEMORY

  const [showLabels, setShowLabels] = useState(true)

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // ── Gateway (center hub) ────────────────────────────────────────────
    nodes.push({
      id: 'gateway',
      type: 'gatewayNode',
      position: { x: CENTER_X, y: GATEWAY_Y },
      data: {
        label: 'Gateway',
        sublabel: 'WebSocket Control Plane · :18789',
        icon: '🌐',
        color: '#22d3ee',
        bgColor: 'rgba(34, 211, 238, 0.08)',
        borderColor: '#22d3ee',
        description: 'Central Hub — Routes messages, manages sessions, handles auth',
      },
    })

    // ── Channels (left zone, spread horizontally in 3 rows) ──────────
    // 4 columns, 3 rows — channel nodes are small pills
    const chCols = 4
    const chRows = Math.ceil(channels.length / chCols)
    const chNodeW = 120
    const chNodeH = 52
    const chSpacingX = 145
    const chSpacingY = 68
    const chStartX = 30
    const chStartY = 50

    channels.forEach((ch, i) => {
      const col = i % chCols
      const row = Math.floor(i / chCols)
      const x = chStartX + col * chSpacingX
      const y = chStartY + row * chSpacingY

      nodes.push({
        id: `ch_${i}`,
        type: 'channelNode',
        position: { x, y },
        data: {
          label: ch,
          icon: getChannelIcon(ch),
          color: '#a78bfa',
          bgColor: 'rgba(167, 139, 250, 0.08)',
          borderColor: '#a78bfa',
        },
      })

      edges.push({
        id: `e_ch_${i}`,
        source: `ch_${i}`,
        target: 'gateway',
        type: 'smoothstep',
        style: { stroke: '#a78bfa', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' },
        label: showLabels ? 'inbound' : undefined,
        labelStyle: { fill: '#71717a', fontSize: 9 },
        labelBgStyle: { fill: 'rgba(9,9,11,0.85)', rx: 4 },
        animated: false,
      })
    })

    // ── Providers (right zone, spread horizontally in 3 rows) ─────────
    const provCols = 4
    const provRows = Math.ceil(providers.length / provCols)
    const provNodeW = 120
    const provSpacingX = 145
    const provSpacingY = 68
    const provStartX = 900
    const provStartY = 50

    providers.forEach((pr, i) => {
      const col = i % provCols
      const row = Math.floor(i / provCols)
      const x = provStartX + col * provSpacingX
      const y = provStartY + row * provSpacingY

      nodes.push({
        id: `prov_${i}`,
        type: 'providerNode',
        position: { x, y },
        data: {
          label: pr,
          icon: getProviderIcon(pr),
          color: '#fbbf24',
          bgColor: 'rgba(251, 191, 36, 0.06)',
          borderColor: '#fbbf24',
        },
      })

      edges.push({
        id: `e_gw_prov_${i}`,
        source: 'gateway',
        target: `prov_${i}`,
        type: 'smoothstep',
        style: { stroke: '#fbbf24', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' },
        label: showLabels ? 'AI req' : undefined,
        labelStyle: { fill: '#71717a', fontSize: 9 },
        labelBgStyle: { fill: 'rgba(9,9,11,0.85)', rx: 4 },
        animated: true,
      })
    })

    // ── Pi Agent (below gateway) ───────────────────────────────────────
    nodes.push({
      id: 'agent',
      type: 'agentNode',
      position: { x: CENTER_X, y: AGENT_Y },
      data: {
        label: 'Pi Agent',
        sublabel: 'AI Brain · Tool Execution · Context Engine',
        icon: '🤖',
        color: '#fb923c',
        bgColor: 'rgba(251, 146, 60, 0.08)',
        borderColor: '#fb923c',
      },
    })

    edges.push({
      id: 'e_gw_agent',
      source: 'gateway',
      target: 'agent',
      type: 'smoothstep',
      style: { stroke: '#fb923c', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#fb923c' },
      label: showLabels ? 'route to agent' : undefined,
      labelStyle: { fill: '#71717a', fontSize: 10 },
      labelBgStyle: { fill: 'rgba(9,9,11,0.85)', rx: 4 },
    })

    // ── Bottom row: Tools · Skills · Memory · Canvas · Voice ──────────
    const bottomNodes = [
      {
        id: 'tools', label: 'Tools', sublabel: tools.slice(0, 4).join(' · ') + (tools.length > 4 ? ` +${tools.length - 4}` : ''),
        icon: '🛠️', color: '#4ade80', borderColor: '#4ade80', count: tools.length,
      },
      {
        id: 'skills', label: 'Skills', sublabel: skills.join(' · '),
        icon: '⚡', color: '#f472b6', borderColor: '#f472b6', count: '52+',
      },
      {
        id: 'memory', label: 'Memory', sublabel: memory.join(' · '),
        icon: '🧠', color: '#60a5fa', borderColor: '#60a5fa', count: memory.length,
      },
      {
        id: 'canvas', label: 'Canvas', sublabel: 'Visual Workspace · A2UI System',
        icon: '🎨', color: '#e879f9', borderColor: '#e879f9',
      },
      {
        id: 'voice', label: 'Voice', sublabel: 'Voice Wake · Talk Mode · ElevenLabs',
        icon: '🎙️', color: '#2dd4bf', borderColor: '#2dd4bf',
      },
    ]

    const bottomStartX = 120
    const bottomSpacingX = 220

    bottomNodes.forEach((n, i) => {
      nodes.push({
        id: n.id,
        type: 'groupNode',
        position: { x: bottomStartX + i * bottomSpacingX, y: BOTTOM_Y },
        data: { ...n },
      })

      edges.push({
        id: `e_agent_${n.id}`,
        source: 'agent',
        target: n.id,
        type: 'smoothstep',
        style: { stroke: n.borderColor, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: n.borderColor },
        label: showLabels
          ? (n.id === 'tools' ? 'execute' : n.id === 'skills' ? 'install/use' : n.id === 'memory' ? 'read/write' : n.id === 'canvas' ? 'visual out' : 'TTS/STT')
          : undefined,
        labelStyle: { fill: '#71717a', fontSize: 9 },
        labelBgStyle: { fill: 'rgba(9,9,11,0.85)', rx: 4 },
      })
    })

    return { initialNodes: nodes, initialEdges: edges }
  }, [channels, providers, tools, skills, showLabels])

  const [rfNodes, , onNodesChange] = useNodesState(initialNodes)
  const [rfEdges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className={styles.container}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        attributionPosition="bottom-left"
        minZoom={0.4}
        maxZoom={1.5}
      >
        <Background color="#27272a" gap={20} />
        <Controls className={styles.controls} />
        <Panel position="top-right" className={styles.panel}>
          <button
            className={styles.toggleBtn}
            onClick={() => setShowLabels(!showLabels)}
          >
            {showLabels ? '◉ Labels ON' : '○ Labels OFF'}
          </button>
        </Panel>
        <Panel position="bottom-left" className={styles.legend}>
          <div className={styles.legendTitle}>Legend</div>
          <div className={styles.legendItem}><span style={{ color: '#22d3ee' }}>●</span> Gateway</div>
          <div className={styles.legendItem}><span style={{ color: '#a78bfa' }}>●</span> Channels</div>
          <div className={styles.legendItem}><span style={{ color: '#fbbf24' }}>●</span> AI Providers</div>
          <div className={styles.legendItem}><span style={{ color: '#fb923c' }}>●</span> Pi Agent</div>
          <div className={styles.legendItem}><span style={{ color: '#4ade80' }}>●</span> Tools</div>
          <div className={styles.legendItem}><span style={{ color: '#f472b6' }}>●</span> Skills</div>
          <div className={styles.legendItem}><span style={{ color: '#60a5fa' }}>●</span> Memory</div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
