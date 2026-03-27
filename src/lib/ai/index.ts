import { AIProvider, AnalyzeRequest, AnalysisResult } from './types'
import { createMinimaxProvider } from './providers/minimax'
import { createOpenAIProvider } from './providers/openai'
import { createAnthropicProvider } from './providers/anthropic'
import { createGeminiProvider } from './providers/gemini'
import { createGlmProvider } from './providers/glm'
import { createKimiProvider } from './providers/kimi'
import { buildAnalysisPrompt } from './prompts'

function getProvider(): AIProvider | null {
  const provider = process.env.AI_PROVIDER || 'minimax'
  const apiKey = process.env.MINIMAX_API_KEY ||
                  process.env.OPENAI_API_KEY ||
                  process.env.ANTHROPIC_API_KEY ||
                  process.env.GEMINI_API_KEY ||
                  process.env.GLM_API_KEY ||
                  process.env.KIMI_API_KEY

  if (!apiKey) return null

  switch (provider) {
    case 'minimax':
      return createMinimaxProvider({ apiKey })
    case 'openai':
      return createOpenAIProvider({ apiKey })
    case 'anthropic':
      return createAnthropicProvider({ apiKey })
    case 'gemini':
      return createGeminiProvider({ apiKey })
    case 'glm':
      return createGlmProvider({ apiKey })
    case 'kimi':
      return createKimiProvider({ apiKey })
    default:
      return createMinimaxProvider({ apiKey })
  }
}

function parseAnalysisResult(text: string): AnalysisResult {
  let jsonStr = text.trim()
  // Remove markdown fences if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').trim()
  }
  const parsed = JSON.parse(jsonStr)
  return parsed as AnalysisResult
}

export async function analyzeRepository(
  request: AnalyzeRequest,
  signal?: AbortSignal
): Promise<AnalysisResult> {
  const provider = getProvider()
  if (!provider) {
    throw new Error('No AI provider configured. Set AI_PROVIDER and corresponding API key in .env.local')
  }

  const prompt = buildAnalysisPrompt(
    request.owner,
    request.repo,
    request.fileTree,
    request.readme,
    request.keyFiles
  )

  // Exponential backoff retry: 1s → 2s → 4s
  const delays = [1000, 2000, 4000]
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const text = await provider.analyze(prompt, '')
      const result = parseAnalysisResult(text)
      return result
    } catch (err) {
      lastError = err as Error

      if (signal?.aborted) {
        throw new Error('Analysis cancelled')
      }

      if (attempt < delays.length) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]))
        continue
      }
    }
  }

  throw lastError || new Error('Analysis failed after all retries')
}
