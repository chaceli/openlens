import { AIProvider } from '../types'

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

export interface GlmConfig {
  apiKey: string
  model?: string
}

export function createGlmProvider(config: GlmConfig): AIProvider {
  return {
    name: 'glm',
    async analyze(prompt: string, context: string): Promise<string> {
      const response = await fetch(GLM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'glm-4',
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
        throw new Error(`GLM API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    }
  }
}
