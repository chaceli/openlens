'use client'

import styles from './SequenceDiagram.module.css'

interface SequenceStep {
  from: string
  to: string
  action: string
}

interface SequenceDiagramProps {
  steps: SequenceStep[]
}

export default function SequenceDiagram({ steps }: SequenceDiagramProps) {
  return (
    <div className={styles.container}>
      {steps.map((step, i) => (
        <div key={i} className={styles.step}>
          <div className={styles.participants}>
            <span className={styles.from}>{step.from}</span>
            <span className={styles.arrow}>→</span>
            <span className={styles.to}>{step.to}</span>
          </div>
          <p className={styles.action}>{step.action}</p>
        </div>
      ))}
    </div>
  )
}