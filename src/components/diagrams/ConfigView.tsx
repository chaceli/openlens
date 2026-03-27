'use client'

import { useState } from 'react'
import styles from './ConfigView.module.css'

interface ConfigSection {
  id: string
  title: string
  icon: string
  config: { key: string; value: string; description: string; sensitive?: boolean }[]
}

interface ConfigViewProps {
  configs?: ConfigSection[]
}

const DEFAULT_CONFIG: ConfigSection[] = [
  {
    id: 'gateway',
    title: 'Gateway',
    icon: '🌐',
    config: [
      { key: 'gateway.bind', value: 'lan', description: 'Bind to LAN (exposes to network) or localhost only' },
      { key: 'gateway.port', value: '18789', description: 'WebSocket control plane port' },
      { key: 'gateway.auth.enabled', value: 'true', description: 'Require password for Control UI access' },
      { key: 'gateway.tailscale.serve', value: 'true', description: 'Use Tailscale for remote access (requires Tailscale auth key)' },
      { key: 'gateway.tailscale.funnel', value: 'false', description: 'Enable public HTTPS via Tailscale Funnel' },
    ],
  },
  {
    id: 'channels',
    title: 'Channels',
    icon: '💬',
    config: [
      { key: 'channels.telegram.enabled', value: 'true', description: 'Enable Telegram Bot integration' },
      { key: 'channels.telegram.bot_token', value: '***REDACTED***', description: 'Telegram Bot API token from @BotFather', sensitive: true },
      { key: 'channels.discord.enabled', value: 'false', description: 'Enable Discord Bot integration' },
      { key: 'channels.discord.token', value: '***REDACTED***', description: 'Discord Bot token from Discord Developer Portal', sensitive: true },
      { key: 'channels.pairing.default_policy', value: 'deny', description: 'Default pairing policy: deny | allow | require_code' },
    ],
  },
  {
    id: 'providers',
    title: 'AI Providers',
    icon: '🧠',
    config: [
      { key: 'providers.openai.api_key', value: '***REDACTED***', description: 'OpenAI API key', sensitive: true },
      { key: 'providers.openai.model', value: 'gpt-4o', description: 'Default OpenAI model' },
      { key: 'providers.anthropic.api_key', value: '***REDACTED***', description: 'Anthropic API key for Claude', sensitive: true },
      { key: 'providers.anthropic.model', value: 'claude-3-5-sonnet-latest', description: 'Default Anthropic model' },
      { key: 'providers.google.api_key', value: '***REDACTED***', description: 'Google AI API key', sensitive: true },
      { key: 'providers.ollama.url', value: 'http://127.0.0.1:11434', description: 'Ollama server URL for local models' },
      { key: 'providers.ollama.model', value: 'llama3', description: 'Default Ollama model' },
    ],
  },
  {
    id: 'memory',
    title: 'Memory',
    icon: '🧠',
    config: [
      { key: 'memory.vector.provider', value: 'chromadb', description: 'Vector store provider: chromadb | pinecone | qdrant' },
      { key: 'memory.vector.embedding_model', value: 'text-embedding-3-small', description: 'Embedding model for vectorization' },
      { key: 'memory.context.window', value: '100k tokens', description: 'Max context window size' },
      { key: 'memory.longterm.enabled', value: 'true', description: 'Enable cross-session memory persistence' },
    ],
  },
  {
    id: 'skills',
    title: 'Skills',
    icon: '⚡',
    config: [
      { key: 'skills.clawhub.enabled', value: 'true', description: 'Enable ClawHub skill registry' },
      { key: 'skills.clawhub.registry_url', value: 'https://clawhub.openclaw.ai', description: 'ClawHub registry URL' },
      { key: 'skills.auto_install', value: 'true', description: 'Automatically install skills when requested' },
      { key: 'skills.update.check_interval', value: '24h', description: 'Check for skill updates interval' },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    icon: '🔒',
    config: [
      { key: 'security.dm.default_policy', value: 'deny', description: 'Block unknown DMs by default' },
      { key: 'security.api_key.storage', value: 'env_only', description: 'Where API keys are stored: env_only | keychain | file' },
      { key: 'security.tailscale.auth_key', value: '***REDACTED***', description: 'Tailscale auth key for Serve/Funnel', sensitive: true },
    ],
  },
]

export default function ConfigView({ configs = DEFAULT_CONFIG }: ConfigViewProps) {
  const [expandedSection, setExpandedSection] = useState<string>(configs[0]?.id || '')
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({})

  function toggleSensitive(key: string) {
    setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Configuration</div>
        {configs.map(section => (
          <button
            key={section.id}
            className={`${styles.sectionBtn} ${expandedSection === section.id ? styles.activeSection : ''}`}
            onClick={() => setExpandedSection(section.id === expandedSection ? '' : section.id)}
          >
            <span>{section.icon}</span>
            <span>{section.title}</span>
            <span className={styles.expandIcon}>{expandedSection === section.id ? '▲' : '▼'}</span>
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {configs.filter(s => s.id === expandedSection).map(section => (
          <div key={section.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>{section.icon}</span>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <span className={styles.sectionCount}>{section.config.length} settings</span>
            </div>

            <div className={styles.configList}>
              {section.config.map((cfg, i) => {
                const isSensitive = cfg.sensitive
                const isHidden = isSensitive && !showSensitive[cfg.key]
                return (
                  <div key={i} className={styles.configItem}>
                    <div className={styles.configKey}>
                      <code>{cfg.key}</code>
                      {isSensitive && (
                        <button
                          className={styles.sensitiveBtn}
                          onClick={() => toggleSensitive(cfg.key)}
                          title={isHidden ? 'Reveal value' : 'Hide value'}
                        >
                          {isHidden ? '👁️ Show' : '🙈 Hide'}
                        </button>
                      )}
                    </div>
                    <div className={styles.configValue}>
                      <code className={isHidden ? styles.redacted : ''}>
                        {isHidden ? '••••••••••••' : cfg.value}
                      </code>
                    </div>
                    <p className={styles.configDesc}>{cfg.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {!expandedSection && (
          <div className={styles.empty}>
            Select a configuration section from the left to view settings.
          </div>
        )}
      </div>
    </div>
  )
}
