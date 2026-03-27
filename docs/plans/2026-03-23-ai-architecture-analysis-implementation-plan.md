# AI Architecture Analysis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hardcoded OpenClaw mock data with AI-powered analysis that generates real architecture diagrams for any GitHub repository.

**Architecture:** Multi-provider AI layer (Minimax, OpenAI, Anthropic, Gemini, GLM, Kimi) that accepts file tree + README + key source files and returns structured JSON matching the existing `LogicView` and `ScenarioView` type schemas. Exponential backoff retry on failure.

**Tech Stack:** Next.js App Router, TypeScript, react-markdown, react-syntax-highlighter, ReactFlow, mermaid.js, Minimax API (primary)

---

## Task 1: Create AI types and schemas

**Files:**
- Create: `openlens/src/lib/ai/types.ts`

**Step 1: Write the types**

```typescript
// AI Provider interface
export interface AIProvider {
  name: string
  analyze(prompt: string, context: string): Promise<string>
}

// Request/response types
export interface AnalyzeRequest {
  owner: string
  repo: string
  fileTree: string  // stringified file tree overview
  readme: string    // README content
  keyFiles: { path: string; content: string }[]  // key source files
}

export interface AnalysisResult {
  logic: {
    layers: Array<{
      name: string
      description: string
      components: string[]
      color?: string
      icon?: string
      badge?: string
    }>
    componentRelations: {
      components: Array<{
        id: string
        name: string
        category: string
        description: string
      }>
      relations: Array<{
        from: string
        to: string
        type: string
        label?: string
      }>
    }
    dataFlow: Array<{
      id: string
      label: string
      from: string
      to: string
      data: string
      protocol: 'WebSocket' | 'HTTP' | 'RPC' | 'DB' | 'Stream'
      latency?: string
    }>
    config: Array<{
      id: string
      title: string
      icon: string
      config: Array<{
        key: string
        value: string
        description: string
        sensitive?: boolean
      }>
    }>
  }
  scenario: {
    sequenceSteps: Array<{
      from: string
      to: string
      action: string
      type?: 'sync' | 'async' | 'response' | 'note'
    }>
    useCases: Array<{
      id: string
      title: string
      actor: string
      description: string
      preconditions: string[]
      steps: string[]
      postconditions: string[]
      channels?: string[]
      tools?: string[]
      skills?: string[]
    }>
  }
}
```

**Step 2: Create the file**

Run: Create `openlens/src/lib/ai/types.ts` with the content above.

---

## Task 2: Create AI prompt templates

**Files:**
- Create: `openlens/src/lib/ai/prompts.ts`

**Step 1: Write the prompt template**

```typescript
import { AnalysisResult } from './types'

export const SYSTEM_PROMPT = `You are an expert software architect analyzing GitHub repositories.
Analyze the provided repository structure, README, and key source files.
Return ONLY valid JSON matching this exact schema:

{
  "logic": {
    "layers": [
      {
        "name": "string (e.g., 'Presentation Layer', 'Business Logic', 'Data Layer')",
        "description": "string",
        "components": ["component1", "component2"],
        "color": "optional hex color like #22d3ee",
        "icon": "optional icon name",
        "badge": "optional badge text"
      }
    ],
    "componentRelations": {
      "components": [
        {
          "id": "unique-id",
          "name": "Component Name",
          "category": "gateway|agent|channel|provider|memory|tool|skill|app",
          "description": "string"
        }
      ],
      "relations": [
        {
          "from": "component-id",
          "to": "component-id",
          "type": "calls|uses|contains|extends|implements",
          "label": "optional label"
        }
      ]
    },
    "dataFlow": [
      {
        "id": "flow-1",
        "label": "Human readable label",
        "from": "component-name",
        "to": "component-name",
        "data": "what is transmitted",
        "protocol": "WebSocket|HTTP|RPC|DB|Stream",
        "latency": "optional latency indicator"
      }
    ],
    "config": [
      {
        "id": "config-1",
        "title": "Configuration Section Title",
        "icon": "icon-name",
        "config": [
          {
            "key": "config.key.name",
            "value": "value",
            "description": "what this config does",
            "sensitive": false
          }
        ]
      }
    ]
  },
  "scenario": {
    "sequenceSteps": [
      {
        "from": "Actor/Component",
        "to": "Actor/Component",
        "action": "What happens",
        "type": "sync|async|response|note"
      }
    ],
    "useCases": [
      {
        "id": "uc-1",
        "title": "Use Case Title",
        "actor": "Primary actor",
        "description": "One sentence description",
        "preconditions": ["precondition 1"],
        "steps": ["step 1", "step 2"],
        "postconditions": ["postcondition 1"],
        "channels": ["channel1"],
        "tools": ["tool1"],
        "skills": ["skill1"]
      }
    ]
  }
}

Rules:
- Return ONLY the JSON object, no markdown fences, no explanation
- All string values must be properly escaped
- Use reasonable defaults for optional fields
- Infer architecture from file names, imports, and code patterns
- Identify 3-6 major layers
- Identify 5-10 key components and their relationships
- Create 2-4 data flows
- Create 2-3 use cases with real steps
- Create 4-8 sequence steps per use case
- Max context: analyze top 20 files by importance`

export function buildAnalysisPrompt(
  owner: string,
  repo: string,
  fileTree: string,
  readme: string,
  keyFiles: { path: string; content: string }[]
): string {
  const keyFilesSection = keyFiles
    .map(f => `=== ${f.path} ===\n${f.content.slice(0, 3000)}`)
    .join('\n\n')

  return `${SYSTEM_PROMPT}

=== REPOSITORY ===
${owner}/${repo}

=== FILE TREE (top-level) ===
${fileTree}

=== README ===
${readme.slice(0, 5000)}

=== KEY SOURCE FILES ===
${keyFilesSection}

Return JSON now:`
}
```

---

## Task 3: Create Minimax provider

**Files:**
- Create: `openlens/src/lib/ai/providers/minimax.ts`

**Step 1: Write the Minimax provider**

```typescript
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
```

---

## Task 4: Create OpenAI provider

**Files:**
- Create: `openlens/src/lib/ai/providers/openai.ts`

**Step 1: Write the OpenAI provider**

```typescript
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
```

---

## Task 5: Create Anthropic provider

**Files:**
- Create: `openlens/src/lib/ai/providers/anthropic.ts`

**Step 1: Write the Anthropic provider**

```typescript
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
```

---

## Task 6: Create Gemini, GLM, Kimi providers

**Files:**
- Create: `openlens/src/lib/ai/providers/gemini.ts`
- Create: `openlens/src/lib/ai/providers/glm.ts`
- Create: `openlens/src/lib/ai/providers/kimi.ts`

**Step 1: Write each provider** (same pattern as above)

Gemini:
```typescript
// API URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
// Auth: API key in query param ?key=
// Body: { contents: [{ parts: [{ text: prompt + "\n\n" + context }] }] }
```

GLM:
```typescript
// API URL: https://open.bigmodel.cn/api/paas/v4/chat/completions
// Auth: Bearer token
// Body: { model: "glm-4", messages: [...] }
```

Kimi:
```typescript
// API URL: https://api.moonshot.cn/v1/chat/completions
// Auth: Bearer token
// Body: { model: "moonshot-v1-8k", messages: [...] }
```

---

## Task 7: Create AI registry with retry logic

**Files:**
- Create: `openlens/src/lib/ai/index.ts`

**Step 1: Write the AI registry with exponential backoff**

```typescript
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
```

---

## Task 8: Wire AI analysis into repo page

**Files:**
- Modify: `openlens/src/app/repo/[owner]/[repo]/page.tsx`

**Step 1: Update imports**

Add after existing imports:
```typescript
import { analyzeRepository } from '@/lib/ai'
import { AnalysisResult } from '@/lib/ai/types'
```

**Step 2: Add loading state for AI**

In the component, add:
```typescript
const [aiAnalysis, setAiAnalysis] = useState<AnalysisResult | null>(null)
const [aiError, setAiError] = useState<string | null>(null)
```

**Step 3: Add AI analysis fetch**

After file tree and readme are loaded, add:
```typescript
useEffect(() => {
  if (!repoData || !fileTree) return

  async function runAIAnalysis() {
    try {
      setAiError(null)
      // Build file tree string (top 50 items)
      const treeStr = fileTree
        .slice(0, 50)
        .map(n => '  '.repeat(n.path.split('/').length - 1) + (n.type === 'dir' ? '📁 ' : '📄 ') + n.name)
        .join('\n')

      // Key files: package.json, tsconfig.json, main entry points
      const keyFilePaths = ['package.json', 'tsconfig.json', 'README.md', 'src/index.ts', 'src/main.ts', 'src/App.tsx']
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

      const result = await analyzeRepository({
        owner,
        repo,
        fileTree: treeStr,
        readme: repoData.readme || '',
        keyFiles
      })

      setAiAnalysis(result)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis failed')
    }
  }

  runAIAnalysis()
}, [repoData, fileTree, owner, repo])
```

**Step 4: Pass AI data to views**

In the `activeView === 'logic'` section, replace `MOCK_DATA.logic` with `aiAnalysis?.logic`.

In the `activeView === 'scenario'` section, replace `MOCK_DATA.scenario` with `aiAnalysis?.scenario`.

**Step 5: Add loading/error states for AI**

In the logic view loading:
```typescript
{isLoading && <div className={styles.loading}>Loading architecture analysis...</div>}
```

In the scenario view loading:
```typescript
{isLoading && <div className={styles.loading}>Loading scenarios...</div>}
```

Add error display:
```typescript
{aiError && (
  <div className={styles.errorBanner}>
    AI Analysis failed: {aiError}
    <small>Showing structure only. Configure AI provider for full analysis.</small>
  </div>
)}
```

---

## Task 9: Update environment files

**Files:**
- Modify: `openlens/.env.example`
- Create: `openlens/.env.local` (if doesn't exist)

**Step 1: Update .env.example**

Add:
```
# AI Provider (minimax, openai, anthropic, gemini, glm, kimi)
AI_PROVIDER=minimax

# API Keys (only one needed based on AI_PROVIDER)
MINIMAX_API_KEY=your_minimax_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
# GEMINI_API_KEY=your_gemini_api_key_here
# GLM_API_KEY=your_glm_api_key_here
# KIMI_API_KEY=your_kimi_api_key_here
```

**Step 2: Create .env.local**

```bash
AI_PROVIDER=minimax
MINIMAX_API_KEY=
```

---

## Task 10: Build and test

**Step 1: Run build**

Run: `cd openlens && npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 2: Start dev server**

Run: `cd openlens && npm run dev`

**Step 3: Navigate to a repo**

Open: `http://localhost:3000/repo/facebook/react`

**Step 4: Verify**
- Structure tab: Should show real React repo file tree
- Logic tab: Should show AI-generated architecture layers (or loading state)
- Scenario tab: Should show AI-generated scenarios (or loading state)
- If AI fails: Should show error banner but not crash
