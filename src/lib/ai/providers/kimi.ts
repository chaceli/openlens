import { AIProvider } from '../types'

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'

export interface KimiConfig {
  apiKey: string
  model?: string
}

export function createKimiProvider(config: KimiConfig): AIProvider {
  return {
    name: 'kimi',
    async analyze(prompt: string, context: string): Promise<string> {
      const response = await fetch(KIMI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'moonshot-v1-8k',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: context }
          ],
          temperature: 0.3,
          max_tokens: 8000
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Kimi API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    }
  }
}
