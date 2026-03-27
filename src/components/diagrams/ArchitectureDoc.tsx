'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import draculaTheme from 'react-syntax-highlighter/dist/esm/styles/prism/dracula'
import styles from './ArchitectureDoc.module.css'

interface ArchDocProps {
  // Free-form markdown content — used for repo README or generated docs
  content?: string
}

export default function ArchitectureDoc({ content }: ArchDocProps) {
  const [activeTab, setActiveTab] = useState<string>('docs')

  const tabs = [
    { id: 'docs', label: '📄 Docs' },
  ]

  // If content is provided (e.g. repo README), show it directly
  if (content) {
    return (
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Documentation</div>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.content}>
          <div className={styles.docContent} style={{ padding: '28px 32px' }}>
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const inline = !match
                  return !inline ? (
                    <SyntaxHighlighter
                      style={draculaTheme}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        margin: '12px 0',
                        fontSize: '12px',
                      }}
                      codeTagProps={{ style: { fontFamily: 'var(--font-mono)' } }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={styles.inlineCode} {...props}>
                      {children}
                    </code>
                  )
                },
                table({ children }) {
                  return (
                    <table className={styles.table}>
                      {children}
                    </table>
                  )
                },
                th({ children }) {
                  return <th className={styles.th}>{children}</th>
                },
                td({ children }) {
                  return <td className={styles.td}>{children}</td>
                },
                h2({ children }) {
                  return <h2 className={styles.heading2}>{children}</h2>
                },
                h3({ children }) {
                  return <h3 className={styles.heading3}>{children}</h3>
                },
                p({ children }) {
                  return <p className={styles.para}>{children}</p>
                },
                li({ children }) {
                  return <li className={styles.li}>{children}</li>
                },
                blockquote({ children }) {
                  return <blockquote className={styles.codeBlock}>{children}</blockquote>
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    )
  }

  // No content — show placeholder notice
  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Architecture Docs</div>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        <div className={styles.docContent} style={{ padding: '28px 32px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Architecture analysis coming soon
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Deep architecture understanding requires AI-powered code analysis.<br/>
                This feature will automatically generate architecture docs from the codebase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
