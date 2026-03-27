'use client'

import { useState } from 'react'
import styles from './ArchitectureLayers.module.css'

interface Layer {
  name: string
  description: string
  components: string[]
  color?: string
  icon?: string
  badge?: string
}

interface ArchitectureLayersProps {
  layers: Layer[]
}

const LAYER_COLORS: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  gateway:   { border: '#22d3ee', bg: 'rgba(34,211,238,0.06)',  text: '#22d3ee', icon: '🌐' },
  agent:     { border: '#fb923c', bg: 'rgba(251,146,60,0.06)',  text: '#fb923c', icon: '🤖' },
  extension: { border: '#a78bfa', bg: 'rgba(167,139,250,0.06)', text: '#a78bfa', icon: '🔌' },
  channel:   { border: '#a78bfa', bg: 'rgba(167,139,250,0.06)', text: '#a78bfa', icon: '💬' },
  provider:  { border: '#fbbf24', bg: 'rgba(251,191,36,0.06)',  text: '#fbbf24', icon: '🧠' },
  skill:     { border: '#f472b6', bg: 'rgba(244,114,182,0.06)', text: '#f472b6', icon: '⚡' },
  memory:    { border: '#60a5fa', bg: 'rgba(96,165,250,0.06)',  text: '#60a5fa', icon: '🧠' },
  app:       { border: '#4ade80', bg: 'rgba(74,222,128,0.06)',  text: '#4ade80', icon: '📱' },
  tools:     { border: '#4ade80', bg: 'rgba(74,222,128,0.06)',  text: '#4ade80', icon: '🛠️' },
  voice:     { border: '#2dd4bf', bg: 'rgba(45,212,191,0.06)',  text: '#2dd4bf', icon: '🎙️' },
  canvas:    { border: '#e879f9', bg: 'rgba(232,121,249,0.06)', text: '#e879f9', icon: '🎨' },
  default:   { border: '#71717a', bg: 'rgba(113,113,122,0.06)', text: '#71717a', icon: '📦' },
}

function getLayerStyle(name: string) {
  const key = Object.keys(LAYER_COLORS).find(k => name.toLowerCase().includes(k))
  return LAYER_COLORS[key || 'default']
}

function getComponentType(comp: string): { color: string; bg: string } {
  const lower = comp.toLowerCase()
  if (lower.includes('api') || lower.includes('http') || lower.includes('websocket') || lower.includes('rest') || lower.includes('gateway'))
    return { color: '#22d3ee', bg: 'rgba(34,211,238,0.08)' }
  if (lower.includes('ai') || lower.includes('model') || lower.includes('claude') || lower.includes('gpt') || lower.includes('llm') || lower.includes('provider'))
    return { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' }
  if (lower.includes('channel') || lower.includes('telegram') || lower.includes('discord') || lower.includes('slack') || lower.includes('whatsapp') || lower.includes('message'))
    return { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' }
  if (lower.includes('skill') || lower.includes('plugin') || lower.includes('hub') || lower.includes('install'))
    return { color: '#f472b6', bg: 'rgba(244,114,182,0.08)' }
  if (lower.includes('memory') || lower.includes('vector') || lower.includes('context') || lower.includes('storage') || lower.includes('session'))
    return { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' }
  if (lower.includes('file') || lower.includes('exec') || lower.includes('tool') || lower.includes('browser') || lower.includes('system'))
    return { color: '#4ade80', bg: 'rgba(74,222,128,0.08)' }
  if (lower.includes('voice') || lower.includes('audio') || lower.includes('tts') || lower.includes('stt') || lower.includes('wake'))
    return { color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)' }
  if (lower.includes('canvas') || lower.includes('visual') || lower.includes('workspace'))
    return { color: '#e879f9', bg: 'rgba(232,121,249,0.08)' }
  return { color: '#71717a', bg: 'rgba(113,113,122,0.06)' }
}

export default function ArchitectureLayers({ layers }: ArchitectureLayersProps) {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null)
  const [showLegend, setShowLegend] = useState(false)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Architecture Layers</h2>
        <button className={styles.legendToggle} onClick={() => setShowLegend(!showLegend)}>
          {showLegend ? '◉' : '○'} Legend
        </button>
      </div>

      {showLegend && (
        <div className={styles.legend}>
          <div className={styles.legendItem}><span style={{ color: '#22d3ee' }}>●</span> Transport / Gateway</div>
          <div className={styles.legendItem}><span style={{ color: '#fbbf24' }}>●</span> AI / LLM Provider</div>
          <div className={styles.legendItem}><span style={{ color: '#a78bfa' }}>●</span> Channel / Messaging</div>
          <div className={styles.legendItem}><span style={{ color: '#f472b6' }}>●</span> Skills / Plugins</div>
          <div className={styles.legendItem}><span style={{ color: '#60a5fa' }}>●</span> Memory / Session</div>
          <div className={styles.legendItem}><span style={{ color: '#4ade80' }}>●</span> Tools / Execution</div>
          <div className={styles.legendItem}><span style={{ color: '#2dd4bf' }}>●</span> Voice / Audio</div>
          <div className={styles.legendItem}><span style={{ color: '#e879f9' }}>●</span> Canvas / Visual</div>
        </div>
      )}

      <div className={styles.layerStack}>
        {layers.map((layer, i) => {
          const style = getLayerStyle(layer.name)
          const isExpanded = expandedLayer === i
          return (
            <div
              key={i}
              className={styles.layer}
              style={{
                borderColor: style.border,
                background: style.bg,
              }}
            >
              <button
                className={styles.layerHeader}
                onClick={() => setExpandedLayer(isExpanded ? null : i)}
              >
                <div className={styles.layerLeft}>
                  <span className={styles.layerNum} style={{ color: style.text + '60' }}>0{i + 1}</span>
                  <span className={styles.layerIcon}>{style.icon}</span>
                  <div className={styles.layerInfo}>
                    <h3 className={styles.layerName} style={{ color: style.text }}>{layer.name}</h3>
                    <p className={styles.layerDesc}>{layer.description}</p>
                  </div>
                </div>
                <div className={styles.layerRight}>
                  {layer.badge && (
                    <span className={styles.layerBadge} style={{
                      color: style.text,
                      borderColor: style.border + '60',
                      background: 'rgba(0,0,0,0.3)',
                    }}>
                      {layer.badge}
                    </span>
                  )}
                  <span className={styles.expandIcon} style={{ color: style.text }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className={styles.componentGrid}>
                  {layer.components.map((comp, j) => {
                    const compStyle = getComponentType(comp)
                    return (
                      <div
                        key={j}
                        className={styles.component}
                        style={{ borderColor: compStyle.color + '60', background: compStyle.bg }}
                      >
                        <span className={styles.compDot} style={{ color: compStyle.color }}>●</span>
                        <span className={styles.compName}>{comp}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {!isExpanded && (
                <div className={styles.componentPreview}>
                  {layer.components.slice(0, 6).map((comp, j) => {
                    const compStyle = getComponentType(comp)
                    return (
                      <span key={j} className={styles.compChip} style={{
                        color: compStyle.color,
                        borderColor: compStyle.color + '30',
                        background: compStyle.bg,
                      }}>
                        {comp}
                      </span>
                    )
                  })}
                  {layer.components.length > 6 && (
                    <span className={styles.compChip} style={{ color: '#71717a', borderColor: '#3f3f46', background: 'rgba(113,113,122,0.06)' }}>
                      +{layer.components.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
