import { AIProvider } from '../types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export interface AnthropicConfig {
  apiKey: string
  model?: string
}

export function createAnthropicProvider(config: AnthropicConfig): AIProvider {
  return {
    name: 'anthropic',
    async analyze(prompt: string, context: string): Promise<string> {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: config.model || 'claude-opus-4-6',
          messages: [
            { role: 'user', content: `System: ${prompt}\n\n${context}` }
          ],
          temperature: 0.3,
          max_tokens: 8000
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Anthropic API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      return data.content?.[0]?.text || ''
    }
  }
}