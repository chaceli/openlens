import { AIProvider } from '../types'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface GeminiConfig {
  apiKey: string
  model?: string
}

export function createGeminiProvider(config: GeminiConfig): AIProvider {
  return {
    name: 'gemini',
    async analyze(prompt: string, context: string): Promise<string> {
      const model = config.model || 'gemini-2.0-flash'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `System: ${prompt}\n\n${context}` }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8000
          }
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Gemini API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }
  }
}
