'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

const EXAMPLE_REPOS = [
  { owner: 'openclaw', repo: 'openclaw', desc: 'Local-first AI agent framework' },
  { owner: 'facebook', repo: 'react', desc: 'The library for web and native UIs' },
  { owner: 'denoland', repo: 'deno', desc: 'A modern runtime for JavaScript' },
]

type ValidationState = {
  isError: boolean
  message: string
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [validation, setValidation] = useState<ValidationState>({ isError: false, message: '' })
  const router = useRouter()

  const handleAnalyze = () => {
    if (!url.trim()) return

    setValidation({ isError: false, message: '' })

    // Check if it's a GitLab or other non-GitHub URL
    if (/gitlab\.com\/([^\/]+)\/([^\/\s]+)/.test(url) || /bitbucket\.org\/([^\/]+)\/([^\/\s]+)/.test(url)) {
      setValidation({ isError: true, message: 'Currently only GitHub is supported' })
      return
    }

    // Parse GitHub URL to owner/repo format
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\s]+)/)
    if (match) {
      const [, owner, repo] = match
      setIsAnalyzing(true)
      // Simulate analysis redirect
      setTimeout(() => {
        router.push(`/repo/${owner}/${repo}`)
      }, 1500)
    } else if (url.includes('://') || url.includes('.')) {
      // Has URL-like structure but not valid GitHub format
      setValidation({ isError: true, message: 'Please enter a valid GitHub repository URL' })
    }
  }

  const handleExample = (owner: string, repo: string) => {
    setIsAnalyzing(true)
    setTimeout(() => {
      router.push(`/repo/${owner}/${repo}`)
    }, 1500)
  }

  return (
    <main className={styles.main}>
      {/* Background Effects */}
      <div className={styles.bgGradient} />
      <div className={styles.bgGrid} />

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <a href="/" className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
              <circle cx="16" cy="16" r="6" fill="currentColor"/>
              <path d="M16 2V8M16 24V30M2 16H8M24 16H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>OpenLens</span>
          </a>
          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#how-it-works" className={styles.navLink}>How it works</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.navLink}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            AI-Powered Architecture Visualization
          </div>

          <h1 className={styles.title}>
            See the architecture,<br/>
            <span className={styles.titleAccent}>understand the code</span>
          </h1>

          <p className={styles.subtitle}>
            Paste any GitHub repository URL. Get interactive diagrams that reveal
            how the code is structured, how modules connect, and how it works.
          </p>

          {/* Input Section */}
          <div className={styles.inputSection}>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <input
                type="text"
                className={`${styles.input} ${validation.isError ? styles.inputError : ''}`}
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  if (validation.isError) {
                    setValidation({ isError: false, message: '' })
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <button
              className={styles.analyzeBtn}
              onClick={handleAnalyze}
              disabled={!url.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <span className={styles.spinner} />
                  Analyzing
                </>
              ) : (
                <>
                  Analyze
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Validation Error Message */}
          {validation.isError && validation.message && (
            <div className={styles.errorMessage}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {validation.message}
            </div>
          )}

          {/* Examples */}
          <div className={styles.examples}>
            <span className={styles.examplesLabel}>Try these examples:</span>
            <div className={styles.exampleLinks}>
              {EXAMPLE_REPOS.map((example) => (
                <button
                  key={`${example.owner}/${example.repo}`}
                  className={styles.exampleLink}
                  onClick={() => handleExample(example.owner, example.repo)}
                  disabled={isAnalyzing}
                >
                  <span className={styles.exampleRepo}>{example.owner}/{example.repo}</span>
                  <span className={styles.exampleDesc}>{example.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className={styles.heroVisual}>
          <div className={styles.diagramCard}>
            <div className={styles.diagramHeader}>
              <div className={styles.diagramDots}>
                <span />
                <span />
                <span />
              </div>
              <span className={styles.diagramTitle}>Architecture Overview</span>
            </div>
            <div className={styles.diagramContent}>
              {/* Simplified architecture diagram preview */}
              <svg viewBox="0 0 400 280" className={styles.diagramSvg}>
                {/* Connection lines */}
                <path d="M200 60 L100 120 M200 60 L300 120 M100 180 L100 120 M200 180 L100 120 M200 180 L300 120 M300 180 L300 120 M100 180 L200 240 M200 180 L300 240 M300 180 L200 240"
                      stroke="var(--border-default)" strokeWidth="1.5" fill="none"/>

                {/* Gateway node */}
                <rect x="150" y="30" width="100" height="50" rx="8" fill="var(--bg-tertiary)" stroke="var(--accent)" strokeWidth="2"/>
                <text x="200" y="52" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="500">Gateway</text>
                <text x="200" y="67" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">WebSocket</text>

                {/* Channel nodes */}
                <rect x="60" y="120" width="80" height="45" rx="6" fill="var(--bg-tertiary)" stroke="var(--border-default)"/>
                <text x="100" y="137" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="500">Channels</text>
                <text x="100" y="150" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8">20+ adapters</text>

                <rect x="260" y="120" width="80" height="45" rx="6" fill="var(--bg-tertiary)" stroke="var(--border-default)"/>
                <text x="300" y="137" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="500">Providers</text>
                <text x="300" y="150" textAnchor="middle" fill="var(--text-tertiary)" fontSize="8">35+ models</text>

                {/* Agent node */}
                <rect x="150" y="180" width="100" height="50" rx="8" fill="var(--accent-muted)" stroke="var(--accent)"/>
                <text x="200" y="197" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="500">Pi Agent</text>
                <text x="200" y="212" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">AI Brain</text>

                {/* Tools/Memory nodes */}
                <rect x="60" y="240" width="70" height="35" rx="6" fill="var(--bg-tertiary)" stroke="var(--border-subtle)"/>
                <text x="95" y="262" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">Tools</text>

                <rect x="165" y="240" width="70" height="35" rx="6" fill="var(--bg-tertiary)" stroke="var(--border-subtle)"/>
                <text x="200" y="262" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">Memory</text>

                <rect x="270" y="240" width="70" height="35" rx="6" fill="var(--bg-tertiary)" stroke="var(--border-subtle)"/>
                <text x="305" y="262" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">Skills</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.featuresContent}>
          <h2 className={styles.sectionTitle}>Three views to understand any project</h2>
          <p className={styles.sectionSubtitle}>Complex architectures, simplified into interactive diagrams</p>

          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  <path d="M12 11v6M9 14h6"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Development View</h3>
              <p className={styles.featureDesc}>Explore the directory structure, module dependencies, and file organization. See how the codebase is organized at a glance.</p>
              <ul className={styles.featureList}>
                <li>Interactive directory tree</li>
                <li>Dependency relationship graph</li>
                <li>File distribution heatmap</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Logic View</h3>
              <p className={styles.featureDesc}>Understand the core modules and their relationships. Visualize the architecture layers and how components interact.</p>
              <ul className={styles.featureList}>
                <li>Architecture hierarchy diagram</li>
                <li>Component relationship map</li>
                <li>Data flow visualization</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Scenario View</h3>
              <p className={styles.featureDesc}>Follow the key workflows through sequence diagrams. Understand how data moves through the system step by step.</p>
              <ul className={styles.featureList}>
                <li>Core workflow sequence diagrams</li>
                <li>Use case diagrams</li>
                <li>Configuration reference</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.howItWorksContent}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <p className={styles.sectionSubtitle}>Three simple steps to understand any codebase</p>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>01</div>
              <div className={styles.stepContent}>
                <h3>Paste a GitHub URL</h3>
                <p>Enter any public GitHub repository URL. No authentication required for public repos.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>02</div>
              <div className={styles.stepContent}>
                <h3>AI analyzes the codebase</h3>
                <p>Our AI reads the source code, understands the structure, and identifies key components and relationships.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>03</div>
              <div className={styles.stepContent}>
                <h3>Explore interactive diagrams</h3>
                <p>Navigate through development, logic, and scenario views. Click nodes to drill down, zoom to see details.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
              <circle cx="16" cy="16" r="6" fill="currentColor"/>
            </svg>
            <span>OpenLens</span>
          </div>
          <p className={styles.footerText}>
            Built to help developers understand open source projects.
          </p>
        </div>
      </footer>
    </main>
  )
}
