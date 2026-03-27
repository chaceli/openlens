import { AIProvider } from '../types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export interface OpenAIConfig {
  apiKey: string
  model?: string
}

export function createOpenAIProvider(config: OpenAIConfig): AIProvider {
  return {
    name: 'openai',
    async analyze(prompt: string, context: string): Promise<string> {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o',
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
        throw new Error(`OpenAI API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    }
  }
}