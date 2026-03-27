'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './MermaidSequence.module.css'

interface MermaidSequenceProps {
  steps: {
    from: string
    to: string
    action: string
    type?: 'sync' | 'async' | 'response' | 'note'
  }[]
}

function buildMermaidDiagram(steps: MermaidSequenceProps['steps']): string {
  const lines = ['sequenceDiagram', '    autonumber']

  steps.forEach((step) => {
    if (step.type === 'note') {
      lines.push(`    Note over ${step.from},${step.to}:${step.action}`)
    } else if (step.type === 'response') {
      lines.push(`    ${step.from}-->>${step.to}: ${step.action}`)
    } else if (step.type === 'async') {
      lines.push(`    ${step.from}->>${step.to}: ${step.action}`)
    } else {
      lines.push(`    ${step.from}->>${step.to}: ${step.action}`)
    }
  })

  return lines.join('\n')
}

export default function MermaidSequence({ steps }: MermaidSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [scale, setScale] = useState(1)

  const MIN_SCALE = 0.3
  const MAX_SCALE = 2.5
  const STEP = 0.15

  const zoomIn = () => setScale(s => Math.min(MAX_SCALE, +(s + STEP).toFixed(2)))
  const zoomOut = () => setScale(s => Math.max(MIN_SCALE, +(s - STEP).toFixed(2)))
  const resetZoom = () => setScale(1)

  useEffect(() => {
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#1c1c1e',
            primaryTextColor: '#fafafa',
            primaryBorderColor: '#3f3f46',
            lineColor: '#52525b',
            secondaryColor: '#27272a',
            tertiaryColor: '#1a1a1d',
            noteBkgColor: '#1c1c1e',
            noteTextColor: '#a1a1aa',
            actorBkg: '#27272a',
            actorBorder: '#3f3f46',
            actorTextColor: '#fafafa',
            signalColor: '#a1a1aa',
            signalTextColor: '#a1a1aa',
          },
          flowchart: { htmlLabels: true },
          sequence: {
            diagramMarginX: 20,
            diagramMarginY: 20,
            actorMargin: 80,
            width: 150,
            height: 50,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
          },
        })

        const diagram = buildMermaidDiagram(steps)
        const { svg: rendered } = await mermaid.render(`seq_${Date.now()}`, diagram)
        setSvg(rendered)
        setError('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Mermaid render failed')
      }
    }
    render()
  }, [steps])

  return (
    <div className={styles.container}>
      <div className={styles.diagramWrapper}>
        <div className={styles.toolbar}>
          <button className={styles.zoomBtn} onClick={zoomOut} title="Zoom Out">−</button>
          <button className={styles.zoomLabel} onClick={resetZoom} title="Reset">{Math.round(scale * 100)}%</button>
          <button className={styles.zoomBtn} onClick={zoomIn} title="Zoom In">+</button>
        </div>
        {svg ? (
          <div
            ref={containerRef}
            className={styles.svgContainer}
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.loading}>Rendering sequence diagram...</div>
        )}
      </div>
      <div className={styles.stepList}>
        <div className={styles.stepListHeader}>Flow Steps</div>
        {steps.map((step, i) => (
          <div key={i} className={styles.stepRow}>
            <span className={styles.stepNum}>{i + 1}</span>
            <span className={styles.stepFrom}>{step.from}</span>
            <span className={styles.stepArrow}>
              {step.type === 'async' ? '⇢' : step.type === 'response' ? '⇠' : '⮂'}
            </span>
            <span className={styles.stepTo}>{step.to}</span>
            <span className={styles.stepAction}>{step.action}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
