'use client'

import { useState } from 'react'
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
import styles from './ComponentRelations.module.css'

interface ComponentRelationsProps {
  components?: {
    id: string
    name: string
    category: 'gateway' | 'agent' | 'channel' | 'provider' | 'memory' | 'tool' | 'skill' | 'app'
    description: string
  }[]
  relations?: {
    from: string
    to: string
    type: 'depends' | 'uses' | 'extends' | ' Implements'
    label?: string
  }[]
}

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  gateway:  { color: '#22d3ee', bg: 'rgba(34,211,238,0.08)',   border: '#22d3ee' },
  agent:    { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',   border: '#fb923c' },
  channel:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)',  border: '#a78bfa' },
  provider: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',   border: '#fbbf24' },
  memory:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',   border: '#60a5fa' },
  tool:     { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: '#4ade80' },
  skill:    { color: '#f472b6', bg: 'rgba(244,114,182,0.08)', border: '#f472b6' },
  app:      { color: '#e879f9', bg: 'rgba(232,121,249,0.08)',  border: '#e879f9' },
}

const DEFAULT_COMPONENTS = [
  { id: 'gw', name: 'Gateway', category: 'gateway' as const, description: 'WebSocket control plane, session management' },
  { id: 'session', name: 'Session Manager', category: 'gateway' as const, description: 'User session state, authentication' },
  { id: 'channel_mgr', name: 'Channel Manager', category: 'gateway' as const, description: 'Routes messages from 20+ channels' },
  { id: 'plugin_mgr', name: 'Plugin Manager', category: 'gateway' as const, description: 'Dynamic plugin loading/unloading' },
  { id: 'pi_core', name: 'pi-agent-core', category: 'agent' as const, description: 'Core agent runtime, tool orchestration' },
  { id: 'pi_ai', name: 'pi-ai', category: 'agent' as const, description: 'LLM API client, streaming responses' },
  { id: 'pi_coding', name: 'pi-coding-agent', category: 'agent' as const, description: 'Code generation and execution' },
  { id: 'ctx_engine', name: 'Context Engine', category: 'agent' as const, description: 'Context window management, truncation' },
  { id: 'tool_reg', name: 'Tool Registry', category: 'tool' as const, description: 'Registered tools, discovery, execution' },
  { id: 'file_tool', name: 'File System Tool', category: 'tool' as const, description: 'Read/write/search local files' },
  { id: 'web_tool', name: 'Web Search Tool', category: 'tool' as const, description: 'Google/Bing/DDG search' },
  { id: 'http_tool', name: 'HTTP Client Tool', category: 'tool' as const, description: 'REST API calls to external services' },
  { id: 'vector_store', name: 'Vector Store', category: 'memory' as const, description: 'Embedding storage, similarity search' },
  { id: 'session_ctx', name: 'Session Context', category: 'memory' as const, description: 'Current conversation buffer' },
  { id: 'longterm', name: 'Long-term Memory', category: 'memory' as const, description: 'Persistent cross-session storage' },
  { id: 'clawhub', name: 'ClawHub', category: 'skill' as const, description: 'Skill registry, search, install' },
  { id: 'skill_mgr', name: 'Skill Manager', category: 'skill' as const, description: 'Skill lifecycle, version management' },
  { id: 'claude_prv', name: 'Claude Provider', category: 'provider' as const, description: 'Anthropic Claude API integration' },
  { id: 'openai_prv', name: 'OpenAI Provider', category: 'provider' as const, description: 'OpenAI GPT API integration' },
  { id: 'telegram_ch', name: 'Telegram Channel', category: 'channel' as const, description: 'Telegram Bot webhook/polling' },
  { id: 'discord_ch', name: 'Discord Channel', category: 'channel' as const, description: 'Discord Bot gateway connection' },
  { id: 'whatsapp_ch', name: 'WhatsApp Channel', category: 'channel' as const, description: 'WhatsApp Business API' },
  { id: 'macos_app', name: 'macOS App', category: 'app' as const, description: 'Native macOS client, Voice Wake' },
  { id: 'ios_app', name: 'iOS App', category: 'app' as const, description: 'Native iOS client, Talk Mode' },
  { id: 'canvas', name: 'Canvas', category: 'app' as const, description: 'Visual workspace, A2UI system' },
]

const DEFAULT_RELATIONS = [
  { from: 'gw', to: 'session', type: 'uses' as const, label: 'manage sessions' },
  { from: 'gw', to: 'channel_mgr', type: 'uses' as const, label: 'route messages' },
  { from: 'gw', to: 'plugin_mgr', type: 'uses' as const, label: 'load plugins' },
  { from: 'channel_mgr', to: 'telegram_ch', type: 'extends' as const, label: 'implements' },
  { from: 'channel_mgr', to: 'discord_ch', type: 'extends' as const, label: 'implements' },
  { from: 'channel_mgr', to: 'whatsapp_ch', type: 'extends' as const, label: 'implements' },
  { from: 'pi_core', to: 'pi_ai', type: 'uses' as const, label: 'LLM calls' },
  { from: 'pi_core', to: 'ctx_engine', type: 'uses' as const, label: 'context mgmt' },
  { from: 'pi_core', to: 'pi_coding', type: 'uses' as const, label: 'code gen' },
  { from: 'pi_ai', to: 'claude_prv', type: 'uses' as const, label: 'API' },
  { from: 'pi_ai', to: 'openai_prv', type: 'uses' as const, label: 'API' },
  { from: 'pi_core', to: 'tool_reg', type: 'uses' as const, label: 'tool calls' },
  { from: 'tool_reg', to: 'file_tool', type: 'extends' as const, label: 'implements' },
  { from: 'tool_reg', to: 'web_tool', type: 'extends' as const, label: 'implements' },
  { from: 'tool_reg', to: 'http_tool', type: 'extends' as const, label: 'implements' },
  { from: 'pi_core', to: 'vector_store', type: 'uses' as const, label: 'retrieve context' },
  { from: 'pi_core', to: 'session_ctx', type: 'uses' as const, label: 'read/write' },
  { from: 'pi_core', to: 'longterm', type: 'uses' as const, label: 'persist' },
  { from: 'pi_core', to: 'clawhub', type: 'uses' as const, label: 'install skills' },
  { from: 'clawhub', to: 'skill_mgr', type: 'depends' as const, label: 'manages' },
  { from: 'macos_app', to: 'gw', type: 'uses' as const, label: 'WebSocket' },
  { from: 'ios_app', to: 'gw', type: 'uses' as const, label: 'WebSocket' },
  { from: 'canvas', to: 'gw', type: 'uses' as const, label: 'visual events' },
]

// Manual layout positions
const LAYOUT: Record<string, { x: number; y: number }> = {
  gw:            { x: 350, y: 20 },
  session:       { x: 150, y: 80 },
  channel_mgr:   { x: 350, y: 80 },
  plugin_mgr:     { x: 550, y: 80 },
  telegram_ch:   { x: 200, y: 160 },
  discord_ch:     { x: 350, y: 160 },
  whatsapp_ch:   { x: 500, y: 160 },
  pi_core:       { x: 350, y: 260 },
  pi_ai:         { x: 150, y: 340 },
  ctx_engine:    { x: 350, y: 340 },
  pi_coding:     { x: 550, y: 340 },
  claude_prv:    { x: 50, y: 420 },
  openai_prv:    { x: 150, y: 420 },
  tool_reg:      { x: 350, y: 420 },
  file_tool:     { x: 250, y: 500 },
  web_tool:      { x: 350, y: 500 },
  http_tool:     { x: 450, y: 500 },
  vector_store:  { x: 550, y: 420 },
  session_ctx:   { x: 650, y: 420 },
  longterm:      { x: 750, y: 420 },
  clawhub:       { x: 550, y: 260 },
  skill_mgr:     { x: 700, y: 260 },
  macos_app:     { x: 50, y: 20 },
  ios_app:       { x: 150, y: 20 },
  canvas:        { x: 50, y: 180 },
}

const REL_TYPE_STYLE: Record<string, { dash: boolean; color: string }> = {
  uses:     { dash: false, color: '#71717a' },
  depends:  { dash: true,  color: '#f87171' },
  extends:  { dash: false, color: '#22d3ee' },
  Implements: { dash: false, color: '#22d3ee' },
}

export default function ComponentRelations({
  components = DEFAULT_COMPONENTS,
  relations = DEFAULT_RELATIONS,
}: ComponentRelationsProps) {
  const [selected, setSelected] = useState<string | null>(null)

  // Dynamic grid layout for AI-generated components
  const getPosition = (id: string, index: number): { x: number; y: number } => {
    if (LAYOUT[id]) return LAYOUT[id]
    // Grid layout for unknown components: arrange in rows of 4
    const cols = 4
    const col = index % cols
    const row = Math.floor(index / cols)
    const cellW = 180
    const cellH = 100
    const startX = 50
    const startY = 30
    return { x: startX + col * cellW, y: startY + row * cellH }
  }

  const initialNodes: Node[] = components.map((c, i) => {
    const pos = getPosition(c.id, i)
    const style = CATEGORY_STYLES[c.category] || CATEGORY_STYLES.gateway
    return {
      id: c.id,
      position: pos,
      data: { label: c.name },
      style: {
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: '8px',
        padding: '6px 12px',
        color: style.color,
        fontSize: '11px',
        fontWeight: 500,
        cursor: 'pointer',
        minWidth: 80,
        textAlign: 'center' as const,
      },
    }
  })

  const initialEdges: Edge[] = relations.map((r, i) => {
    const relStyle = REL_TYPE_STYLE[r.type] || REL_TYPE_STYLE.uses
    return {
      id: `e${i}`,
      source: r.from,
      target: r.to,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: relStyle.color,
        strokeWidth: 1,
        strokeDasharray: relStyle.dash ? '5,5' : undefined,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: relStyle.color },
      label: r.label,
      labelStyle: { fill: '#52525b', fontSize: 9 },
      labelBgStyle: { fill: 'rgba(9,9,11,0.9)' },
    }
  })

  const [rfNodes, , onNodesChange] = useNodesState(initialNodes)
  const [rfEdges, , onEdgesChange] = useEdgesState(initialEdges)

  const selectedComp = components.find(c => c.id === selected)

  return (
    <div className={styles.container}>
      <div className={styles.graphArea}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => setSelected(node.id === selected ? null : node.id)}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          attributionPosition="bottom-left"
          minZoom={0.3}
          maxZoom={1.2}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background color="#27272a" gap={20} />
          <Controls className={styles.controls} />
        </ReactFlow>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendTitle}>Component Types</div>
        {Object.entries(CATEGORY_STYLES).map(([k, v]) => (
          <div key={k} className={styles.legendItem}>
            <span style={{ color: v.color }}>●</span>
            <span>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
          </div>
        ))}
        <div className={styles.legendDivider} />
        <div className={styles.legendTitle}>Relations</div>
        <div className={styles.legendItem}><span style={{ color: '#71717a' }}>—</span> uses</div>
        <div className={styles.legendItem}><span style={{ color: '#22d3ee' }}>→</span> implements</div>
        <div className={styles.legendItem}><span style={{ color: '#f87171', textDecoration: 'underline' }}>- -</span> depends</div>
      </div>

      {selectedComp && (
        <div className={styles.detail}>
          <div className={styles.detailHeader}>
            <span
              className={styles.detailBadge}
              style={{
                color: CATEGORY_STYLES[selectedComp.category]?.color,
                borderColor: CATEGORY_STYLES[selectedComp.category]?.border,
              }}
            >
              {selectedComp.category}
            </span>
            <h3 className={styles.detailName}>{selectedComp.name}</h3>
          </div>
          <p className={styles.detailDesc}>{selectedComp.description}</p>
          <div className={styles.detailRelations}>
            <div className={styles.detailSub}>Relations</div>
            {relations.filter(r => r.from === selectedComp.id || r.to === selectedComp.id).map((rel, i) => (
              <div key={i} className={styles.relItem}>
                <span className={styles.relDir}>
                  {rel.from === selectedComp.id ? '→' : '←'}
                </span>
                <span className={styles.relOther}>
                  {rel.from === selectedComp.id ? rel.to : rel.from}
                </span>
                <span className={styles.relLabel}>{rel.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
