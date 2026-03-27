import { AIProvider } from '../types'

const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2'

export interface MinimaxConfig {
  apiKey: string
  model?: string
}

export function createMinimaxProvider(config: MinimaxConfig): AIProvider {
  return {
    name: 'minimax',
    async analyze(prompt: string, context: string): Promise<string> {
      const response = await fetch(MINIMAX_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'MiniMax-Text-01',
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
        throw new Error(`Minimax API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    }
  }
}