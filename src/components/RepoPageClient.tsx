'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import draculaTheme from 'react-syntax-highlighter/dist/esm/styles/prism/dracula'
import styles from '@/app/repo/[owner]/[repo]/page.module.css'
import DirectoryTree from '@/components/diagrams/DirectoryTree'
import DependencyGraph from '@/components/diagrams/DependencyGraph'
import ArchitectureLayers from '@/components/diagrams/ArchitectureLayers'
import SequenceDiagram from '@/components/diagrams/SequenceDiagram'
import SystemArchitecture from '@/components/diagrams/SystemArchitecture'
import MermaidSequence from '@/components/diagrams/MermaidSequence'
import ArchitectureDoc from '@/components/diagrams/ArchitectureDoc'
import UseCases from '@/components/diagrams/UseCases'
import DataFlow from '@/components/diagrams/DataFlow'
import ComponentRelations from '@/components/diagrams/ComponentRelations'
import ConfigView from '@/components/diagrams/ConfigView'
import { fetchRepositoryFull, fetchFileContent, fetchFileTreeRecursive } from '@/lib/github'
import { AnalysisResult } from '@/lib/ai/types'

type ViewType = 'overview' | 'dev' | 'logic' | 'scenario'
type SubViewType = 'structure' | 'dependencies' | 'distribution' | 'system' | 'architecture' | 'components' | 'dataflow' | 'docs' | 'sequence' | 'usecases' | 'config'

const VIEWS: { id: ViewType; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'dev', label: 'Development View' },
  { id: 'logic', label: 'Logic View' },
  { id: 'scenario', label: 'Scenario View' },
]

const LOADING_PHASES = [
  { id: 'fetching_metadata', label: 'Fetching repository info', icon: '📦' },
  { id: 'fetching_tree', label: 'Analyzing file structure', icon: '🌳' },
  { id: 'fetching_readme', label: 'Parsing documentation', icon: '📄' },
  { id: 'analyzing_code', label: 'Understanding architecture', icon: '🧠', hint: 'AI analysis may take 30-60s' },
  { id: 'generating_diagrams', label: 'Building diagrams', icon: '📊' },
]

// Mock data for OpenClaw
const MOCK_DATA = {
  overview: {
    name: 'openclaw',
    description: 'Local-first AI agent framework with 20+ message channel integrations and 35+ AI model providers. Supports multi-agent workspaces with sandbox isolation.',
    stats: {
      stars: '26.2k',
      forks: '2.1k',
      language: 'TypeScript',
      lastUpdated: '2 days ago'
    }
  },
  dev: {
    structure: {
      title: 'Directory Structure',
      content: `openclaw/
├── apps/           # Mobile & desktop applications
├── extensions/    # Plugins (channels, providers, memory, tools)
├── packages/       # Core packages (clawdbot, moltbot)
├── skills/         # 52 built-in skills
├── src/            # Main source code (42 modules)
│   ├── gateway/    # WebSocket gateway
│   ├── agents/     # Agent runtime
│   ├── channels/   # Channel implementations
│   ├── plugins/    # Plugin system
│   └── ...
└── ui/             # UI components`,
      fileTree: {
        name: 'openclaw',
        type: 'directory' as const,
        children: [
          { name: 'apps', type: 'directory' as const, children: [{ name: 'README.md', type: 'file' as const }] },
          { name: 'extensions', type: 'directory' as const, children: [{ name: 'README.md', type: 'file' as const }] },
          { name: 'packages', type: 'directory' as const, children: [{ name: 'README.md', type: 'file' as const }] },
          { name: 'skills', type: 'directory' as const, children: [{ name: 'README.md', type: 'file' as const }] },
          {
            name: 'src',
            type: 'directory' as const,
            children: [
              { name: 'gateway', type: 'directory' as const, children: [{ name: 'index.ts', type: 'file' as const }] },
              { name: 'agents', type: 'directory' as const, children: [{ name: 'index.ts', type: 'file' as const }] },
              { name: 'channels', type: 'directory' as const, children: [{ name: 'index.ts', type: 'file' as const }] },
              { name: 'plugins', type: 'directory' as const, children: [{ name: 'index.ts', type: 'file' as const }] },
            ]
          },
          { name: 'ui', type: 'directory' as const, children: [{ name: 'README.md', type: 'file' as const }] },
          { name: 'package.json', type: 'file' as const },
        ]
      }
    },
    dependencies: {
      title: 'Module Dependencies',
      nodes: [
        { id: '1', label: 'Gateway', type: 'gateway' },
        { id: '2', label: 'Session', type: 'session' },
        { id: '3', label: 'Pi Agent', type: 'agent' },
        { id: '4', label: 'Channels', type: 'channels' },
        { id: '5', label: 'Providers', type: 'providers' },
        { id: '6', label: 'Memory', type: 'memory' },
        { id: '7', label: 'Tools', type: 'tools' },
        { id: '8', label: 'Skills', type: 'skills' },
      ],
      edges: [
        { from: '1', to: '2' },
        { from: '2', to: '3' },
        { from: '3', to: '4' },
        { from: '3', to: '5' },
        { from: '3', to: '6' },
        { from: '3', to: '7' },
        { from: '7', to: '8' },
        { from: '4', to: '1' },
        { from: '5', to: '3' },
      ]
    }
  },
  logic: {
    systemArch: {
      title: 'System Architecture',
      channels: ['WhatsApp', 'Telegram', 'Discord', 'Slack', 'Signal', 'iMessage', 'LINE', 'Feishu', 'Teams', 'IRC', 'Matrix', 'WebChat'],
      providers: ['OpenAI', 'Claude', 'Gemini', 'Groq', 'Ollama', 'DeepSeek', 'Mistral', 'Llama', 'Qwen', 'LocalAI', 'Azure OpenAI', 'Anthropic'],
      tools: ['File System', 'Web Search', 'Code Exec', 'Browser', 'Calculator', 'HTTP Client'],
      skills: ['ClawHub Registry', 'Auto Install', 'Skill Manager'],
    },
    architecture: {
      title: 'Architecture Layers',
      layers: [
        {
          name: 'Gateway Layer',
          description: 'WebSocket API · Session Management · Channel Routing · Plugin Manager',
          components: [
            'WebSocket Server (:18789)', 'Session Manager', 'Channel Manager',
            'Plugin Manager', 'Cron Scheduler', 'Webhook Handler',
            'Presence System', 'Control UI', 'Tailscale Serve'
          ],
          badge: 'Core',
        },
        {
          name: 'Agent Layer',
          description: 'AI Brain · Tool Execution · Context Engine · RPC Runtime',
          components: [
            'pi-agent-core', 'pi-ai', 'pi-coding-agent',
            'Context Engine', 'Tool Streaming', 'Block Streaming',
            'Main Chat', 'Group Isolation', 'Queue Mode'
          ],
          badge: 'AI Brain',
        },
        {
          name: 'Extension Layer',
          description: '30+ Channels · 35+ Providers · Memory Systems · Tool Extensions',
          components: [
            'WhatsApp', 'Telegram', 'Discord', 'Slack', 'Signal',
            'OpenAI', 'Claude', 'Gemini', 'Groq', 'Ollama',
            'Vector Memory', 'Session Context', 'Long-term Memory'
          ],
          badge: '30+ · 35+',
        },
        {
          name: 'Skill Platform',
          description: 'ClawHub Registry · Auto-install · Skill Manager',
          components: [
            'ClawHub Registry', 'Skill Installer', 'Skill Manager',
            '52 Built-in Skills', 'Dynamic Discovery', 'Auto Update'
          ],
          badge: '52+ Skills',
        },
        {
          name: 'Application Layer',
          description: 'macOS · iOS · Android · CLI · Canvas Visual Workspace',
          components: [
            'macOS App', 'iOS App', 'Android App',
            'Voice Wake (macOS/iOS)', 'Talk Mode (Android)',
            'Canvas Workspace', 'A2UI System (push/reset/eval)'
          ],
          badge: '4 Platforms',
        },
      ]
    }
  },
  scenario: {
    sequence: {
      title: 'Message Flow — User sends a Telegram message',
      steps: [
        { from: 'User', to: 'Telegram', action: 'Sends message: "Book a flight to Tokyo"', type: 'sync' },
        { from: 'Telegram', to: 'Gateway', action: 'POST inbound webhook to Gateway /webhook/telegram', type: 'sync' },
        { from: 'Gateway', to: 'Session', action: 'Lookup or create session for user', type: 'sync' },
        { from: 'Session', to: 'Pi Agent', action: 'Forward message + session context', type: 'sync' },
        { from: 'Pi Agent', to: 'Memory', action: 'Retrieve conversation history from Vector Store', type: 'async' },
        { from: 'Pi Agent', to: 'Tools', action: 'Execute web_search tool: "flights to Tokyo"', type: 'sync' },
        { from: 'Pi Agent', to: 'Providers', action: 'Call Claude API for flight analysis', type: 'async' },
        { from: 'Pi Agent', to: 'Skills', action: 'Check ClawHub for flight booking skill', type: 'async' },
        { from: 'Pi Agent', to: 'Session', action: 'Return structured response + tool calls', type: 'response' },
        { from: 'Gateway', to: 'Telegram', action: 'Send reply via Telegram Bot API', type: 'sync' },
        { from: 'User', to: 'User', action: 'Receives flight options with booking links', type: 'note' },
      ]
    }
  }
}

const SUB_TABS: Record<ViewType, { id: SubViewType; label: string }[]> = {
  overview: [],
  dev: [
    { id: 'structure', label: 'Structure' },
    { id: 'dependencies', label: 'Dependencies' },
    { id: 'distribution', label: 'Distribution' },
  ],
  logic: [
    { id: 'system', label: 'System Map' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'components', label: 'Components' },
    { id: 'dataflow', label: 'Data Flow' },
    { id: 'docs', label: 'Architecture Docs' },
  ],
  scenario: [
    { id: 'sequence', label: 'Sequence' },
    { id: 'usecases', label: 'Use Cases' },
    { id: 'config', label: 'Configuration' },
  ],
}

export default function RepoPage() {
  const params = useParams() ?? {}
  const owner = (params.owner as string) ?? ''
  const repo = (params.repo as string) ?? ''

  const [activeView, setActiveView] = useState<ViewType>('overview')
  const [activeSubTab, setActiveSubTab] = useState<SubViewType>('structure')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingPhase, setLoadingPhase] = useState(0)
  const [repoData, setRepoData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResult | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const viewNavRef = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)
        setAiAnalysis(null) // Clear AI analysis when changing repos
        setAiError(null)
        const data = await fetchRepositoryFull(owner, repo)
        // Fetch real file tree from GitHub API
        const fileTree = await fetchFileTreeRecursive(owner, repo, '')
        // Transform API data to match expected structure
        const transformedData = {
          overview: {
            name: data.repo,
            description: data.description,
            stats: {
              stars: data.stars > 999 ? `${(data.stars / 1000).toFixed(1)}k` : String(data.stars),
              forks: data.forks > 999 ? `${(data.forks / 1000).toFixed(1)}k` : String(data.forks),
              language: data.language,
              lastUpdated: 'recently'
            }
          },
          dev: {
            structure: {
              title: 'Directory Structure',
              fileTree: fileTree,
            },
            dependencies: MOCK_DATA.dev.dependencies,
          },
          logic: MOCK_DATA.logic,
          scenario: MOCK_DATA.scenario,
          readme: data.readme,
        }
        setRepoData(transformedData)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repository')
        setIsLoading(false)
      }
    }
    loadData()
  }, [owner, repo])

  useEffect(() => {
    if (!repoData || !repoData.dev?.structure?.fileTree) return

    async function runAIAnalysis() {
      try {
        setAiError(null)
        setAiAnalysis(null) // Clear old analysis when starting new one
        // Build file tree string (top 50 items, max depth 3)
        const flattenTree = (nodes: any[], depth = 0): string[] => {
          if (depth > 3) return []
          return nodes.slice(0, 50).flatMap(node => {
            const prefix = '  '.repeat(depth)
            const line = `${prefix}${node.type === 'dir' ? '📁 ' : '📄 '}${node.name}`
            const children = node.children ? flattenTree(node.children, depth + 1) : []
            return [line, ...children]
          })
        }
        const treeStr = flattenTree(repoData.dev.structure.fileTree).join('\n')

        // Key files to fetch: package.json, tsconfig.json, README.md, and main entry points
        const keyFilePaths = ['package.json', 'tsconfig.json', 'README.md', 'src/index.ts', 'src/main.ts', 'src/App.tsx', 'src/index.js', 'index.js', 'main.js']
        const keyFiles = await Promise.all(
          keyFilePaths.map(async (path) => {
            try {
              const content = await fetchFileContent(owner, repo, path)
              return { path, content }
            } catch {
              return null
            }
          })
        ).then(results => results.filter(Boolean) as { path: string; content: string }[])

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner,
            repo,
            fileTree: treeStr,
            readme: repoData.readme || '',
            keyFiles
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Analysis failed')
        }

        const result = await response.json() as AnalysisResult
        setAiAnalysis(result)
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'AI analysis failed')
      }
    }

    runAIAnalysis()
  }, [repoData, owner, repo])

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingPhase(prev => Math.min(prev + 1, LOADING_PHASES.length - 1))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view)
    const tabs = SUB_TABS[view]
    if (tabs && tabs.length > 0) {
      setActiveSubTab(tabs[0].id)
    }
  }, [])

  const handleViewKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let newIndex = index
    const viewCount = VIEWS.length

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      newIndex = (index + 1) % viewCount
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      newIndex = (index - 1 + viewCount) % viewCount
    }

    if (newIndex !== index) {
      const nextButton = viewNavRef.current[newIndex]
      if (nextButton) {
        nextButton.focus()
        handleViewChange(VIEWS[newIndex].id)
      }
    }
  }, [handleViewChange])

  const handleFileClick = useCallback(async (path: string) => {
    // If clicking the repo root README, use the already-fetched readme
    if (path.toLowerCase() === 'readme.md' || path.toLowerCase() === `${repo.toLowerCase()}/readme.md`) {
      if (repoData?.readme) {
        setSelectedFile({ path, content: repoData.readme })
        return
      }
    }
    try {
      setFileLoading(true)
      const content = await fetchFileContent(owner, repo, path)
      setSelectedFile({ path, content })
    } catch {
      setSelectedFile({ path, content: '# File not found\n\nCould not load this file.' })
    } finally {
      setFileLoading(false)
    }
  }, [owner, repo, repoData])

  const renderContent = () => {
    if (isLoading) {
      const phase = LOADING_PHASES[loadingPhase]
      const progress = ((loadingPhase + 1) / LOADING_PHASES.length) * 100
      return (
        <div className={styles.loadingState}>
          <div className={styles.loadingAnimation}>
            <div className={styles.loadingOrb}>
              <div className={styles.orbCore} />
              <div className={styles.orbRing} />
              <div className={styles.orbRing2} />
            </div>
            <div className={styles.loadingIcon}>{phase.icon}</div>
          </div>
          <p className={styles.loadingTitle}>Analyzing <span className={styles.repoNameHighlight}>{owner}/{repo}</span></p>
          <div className={styles.loadingSteps}>
            {LOADING_PHASES.map((p, i) => (
              <div key={p.id} className={`${styles.loadingStep} ${i <= loadingPhase ? styles.stepActive : ''} ${i < loadingPhase ? styles.stepDone : ''}`}>
                <div className={styles.stepDot}>
                  {i < loadingPhase ? '✓' : i === loadingPhase ? '●' : '○'}
                </div>
                <span className={styles.stepLabel}>{p.label}</span>
                {p.hint && i === loadingPhase && <span className={styles.stepHint}>{p.hint}</span>}
              </div>
            ))}
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )
    }

    // Use real data when available, otherwise fall back to mock
    const displayData = repoData || MOCK_DATA

    switch (activeView) {
      case 'overview':
        return (
          <div className={styles.overviewContent}>
            <div className={styles.repoHeader}>
              <h1 className={styles.repoName}>{displayData.overview.name}</h1>
              <div className={styles.repoStats}>
                <span className={styles.stat}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {displayData.overview.stats.stars}
                </span>
                <span className={styles.stat}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="18" r="3"/>
                    <circle cx="6" cy="6" r="3"/>
                    <circle cx="18" cy="6" r="3"/>
                    <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/>
                    <path d="M12 12v3"/>
                  </svg>
                  {displayData.overview.stats.forks}
                </span>
                <span className={styles.statBadge}>{displayData.overview.stats.language}</span>
                <span className={styles.statText}>Updated {displayData.overview.stats.lastUpdated}</span>
              </div>
            </div>
            <p className={styles.repoDescription}>{displayData.overview.description}</p>

            <div className={styles.overviewDiagrams}>
              <div className={styles.miniDiagramCard}>
                <h3>Quick Architecture</h3>
                {aiAnalysis?.logic?.componentRelations ? (
                  <ComponentRelations
                    components={aiAnalysis.logic.componentRelations.components as any}
                    relations={aiAnalysis.logic.componentRelations.relations as any}
                  />
                ) : aiError ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '280px',
                    gap: '12px',
                    color: 'var(--text-muted)',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', opacity: 0.5 }}>⚠️</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>AI analysis unavailable</div>
                    <div style={{ fontSize: '12px', opacity: 0.7, maxWidth: '280px' }}>
                      Configure AI provider in .env.local to enable architecture analysis
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '280px',
                    gap: '12px',
                    color: 'var(--text-muted)'
                  }}>
                    <div style={{ fontSize: '32px', animation: 'pulse 1.5s ease-in-out infinite' }}>🧠</div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>Analyzing architecture...</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>AI is understanding the codebase structure</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'dev':
        return (
          <div className={styles.devContent}>
            {activeSubTab === 'structure' && (
              <div className={styles.structureView}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ flex: selectedFile ? '0 0 320px' : '1', transition: 'flex 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h2>{displayData.dev.structure.title}</h2>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {displayData.dev.structure.fileTree.length} items
                      </span>
                    </div>
                    <DirectoryTree
                      data={{ name: repo, type: 'directory' as const, children: displayData.dev.structure.fileTree }}
                      onFileClick={handleFileClick}
                    />
                  </div>
                  {selectedFile && (
                    <div style={{
                      flex: 1,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      overflow: 'auto',
                      maxHeight: '70vh',
                      position: 'sticky',
                      top: 0,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'var(--bg-tertiary)',
                        position: 'sticky',
                        top: 0,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {selectedFile.path.split('/').pop()}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                      <div style={{ padding: '20px 24px', overflow: 'auto' }}>
                        {fileLoading ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '16px', height: '16px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            Loading file...
                          </div>
                        ) : (
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
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '12px',
                                    color: '#22d3ee',
                                    background: 'rgba(34, 211, 238, 0.08)',
                                    border: '1px solid rgba(34, 211, 238, 0.15)',
                                    borderRadius: '4px',
                                    padding: '1px 5px',
                                  }} {...props}>
                                    {children}
                                  </code>
                                )
                              },
                              h1: ({ children }) => <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{children}</h1>,
                              h2: ({ children }) => <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>{children}</h2>,
                              h3: ({ children }) => <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px' }}>{children}</h3>,
                              p: ({ children }) => <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '8px' }}>{children}</p>,
                              li: ({ children }) => <li style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginLeft: '16px', marginBottom: '4px' }}>{children}</li>,
                              pre: ({ children }) => <pre style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px 16px', overflow: 'auto', margin: '12px 0' }}>{children}</pre>,
                              table: ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', margin: '8px 0' }}>{children}</table>,
                              th: ({ children }) => <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>{children}</th>,
                              td: ({ children }) => <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{children}</td>,
                              a: ({ href, children }) => <a href={href} style={{ color: 'var(--accent)', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">{children}</a>,
                              blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '12px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '12px 0' }}>{children}</blockquote>,
                            }}
                          >
                            {selectedFile.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeSubTab === 'dependencies' && (
              <div className={styles.dependenciesView}>
                <h2>{displayData.dev.dependencies.title}</h2>
                <DependencyGraph
                  nodes={displayData.dev.dependencies.nodes}
                  edges={displayData.dev.dependencies.edges}
                />
              </div>
            )}
          </div>
        )

      case 'logic':
        return (
          <div className={styles.logicContent}>
            {activeSubTab === 'system' && !aiAnalysis && !aiError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                AI is analyzing the architecture...
              </div>
            )}
            {activeSubTab === 'system' && aiError && (
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--error)', fontSize: '13px', marginBottom: '16px' }}>
                <strong>AI Analysis failed:</strong> {aiError}
                <br /><small>Showing structure view. Configure AI provider in .env.local for full analysis.</small>
              </div>
            )}
            {activeSubTab === 'system' && (
              <div className={styles.architectureView}>
                <h2>System Architecture</h2>
                {aiAnalysis?.logic?.componentRelations ? (
                  <ComponentRelations
                    components={aiAnalysis.logic.componentRelations.components as any}
                    relations={aiAnalysis.logic.componentRelations.relations as any}
                  />
                ) : aiError ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '320px',
                    gap: '16px',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '48px', opacity: 0.5 }}>⚠️</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>AI analysis unavailable</div>
                    <div style={{ fontSize: '13px', opacity: 0.7, maxWidth: '300px' }}>
                      Configure AI provider in .env.local to enable architecture analysis
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '320px',
                    gap: '16px',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: '48px', animation: 'pulse 1.5s ease-in-out infinite' }}>🧠</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Analyzing architecture...</div>
                    <div style={{ fontSize: '13px', opacity: 0.7, maxWidth: '300px', textAlign: 'center' }}>
                      AI is understanding the codebase structure, components, and relationships
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '8px' }}>
                      This may take 30-60 seconds
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeSubTab === 'architecture' && (
              <div className={styles.architectureView}>
                <h2>Architecture Layers</h2>
                {aiAnalysis?.logic?.layers ? (
                  <ArchitectureLayers layers={aiAnalysis.logic.layers} />
                ) : aiError ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '14px' }}>AI analysis unavailable</div>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '14px' }}>Analyzing architecture layers...</div>
                  </div>
                )}
              </div>
            )}
            {activeSubTab === 'components' && (
              <div className={styles.architectureView}>
                <h2>Component Relations</h2>
                {aiAnalysis?.logic?.componentRelations ? (
                  <ComponentRelations components={aiAnalysis.logic.componentRelations.components as any} relations={aiAnalysis.logic.componentRelations.relations as any} />
                ) : aiError ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '14px' }}>AI analysis unavailable</div>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '14px' }}>Analyzing components...</div>
                  </div>
                )}
              </div>
            )}
            {activeSubTab === 'dataflow' && (
              <div className={styles.architectureView}>
                <h2>Data Flow</h2>
                <DataFlow flows={aiAnalysis?.logic?.dataFlow} />
              </div>
            )}
            {activeSubTab === 'docs' && (
              <div className={styles.architectureView}>
                <h2>Architecture Documentation</h2>
                <ArchitectureDoc content={displayData.readme} />
              </div>
            )}
          </div>
        )

      case 'scenario':
        return (
          <div className={styles.scenarioContent}>
            {activeSubTab === 'sequence' && !aiAnalysis && !aiError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                AI is analyzing scenarios...
              </div>
            )}
            {activeSubTab === 'sequence' && (
              <div className={styles.sequenceView}>
                <h2>{aiAnalysis?.scenario?.sequenceSteps ? displayData.scenario.sequence.title : 'Sequence Diagram'}</h2>
                {aiAnalysis?.scenario?.sequenceSteps ? (
                  <MermaidSequence steps={aiAnalysis.scenario.sequenceSteps} />
                ) : aiError ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '14px' }}>AI analysis unavailable</div>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '14px' }}>Analyzing sequence...</div>
                  </div>
                )}
              </div>
            )}
            {activeSubTab === 'usecases' && (
              <div className={styles.architectureView}>
                <h2>Use Cases</h2>
                <UseCases useCases={aiAnalysis?.scenario?.useCases} />
              </div>
            )}
            {activeSubTab === 'config' && (
              <div className={styles.architectureView}>
                <h2>Configuration</h2>
                <ConfigView configs={aiAnalysis?.logic?.config} />
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const tabs = SUB_TABS[activeView]

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <a href="/" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </a>
          <div className={styles.repoIdentifier}>
            <span className={styles.repoOwner}>{owner}</span>
            <span className={styles.repoSeparator}>/</span>
            <span className={styles.repoRepo}>{repo}</span>
          </div>
        </div>

        <nav className={styles.viewNav}>
          <button
            ref={(el) => { viewNavRef.current[0] = el }}
            className={`${styles.viewBtn} ${activeView === 'overview' ? styles.active : ''}`}
            onClick={() => handleViewChange('overview')}
            onKeyDown={(e) => handleViewKeyDown(e, 0)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            Overview
          </button>
          <button
            ref={(el) => { viewNavRef.current[1] = el }}
            className={`${styles.viewBtn} ${activeView === 'dev' ? styles.active : ''}`}
            onClick={() => handleViewChange('dev')}
            onKeyDown={(e) => handleViewKeyDown(e, 1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            Development View
          </button>
          <button
            ref={(el) => { viewNavRef.current[2] = el }}
            className={`${styles.viewBtn} ${activeView === 'logic' ? styles.active : ''}`}
            onClick={() => handleViewChange('logic')}
            onKeyDown={(e) => handleViewKeyDown(e, 2)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <circle cx="15.5" cy="8.5" r="1.5"/>
              <circle cx="8.5" cy="15.5" r="1.5"/>
              <circle cx="15.5" cy="15.5" r="1.5"/>
            </svg>
            Logic View
          </button>
          <button
            ref={(el) => { viewNavRef.current[3] = el }}
            className={`${styles.viewBtn} ${activeView === 'scenario' ? styles.active : ''}`}
            onClick={() => handleViewChange('scenario')}
            onKeyDown={(e) => handleViewKeyDown(e, 3)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Scenario View
          </button>
        </nav>

        {tabs.length > 0 && (
          <div className={styles.subTabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.subTab} ${activeSubTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveSubTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className={styles.sidebarFooter}>
          <button className={styles.exportBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.content}>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
