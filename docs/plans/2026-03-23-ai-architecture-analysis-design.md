# AI-Powered Architecture Analysis Layer — Design

## Overview

When a user enters a GitHub repository URL, OpenLens automatically triggers AI analysis on page load. The system queries the configured AI model (supporting Minimax, OpenAI, Anthropic, Gemini, GLM, Kimi) to generate structured architecture data for all views, then renders real, repo-specific diagrams.

## User Choices

- **AI Provider**: Multi-provider (Minimax, OpenAI, Anthropic, Gemini, GLM, Kimi), user selects via env var, Minimax default
- **Trigger**: Full analysis on page load (all views simultaneously)
- **Views**: All views (System Map, Architecture Layers, Component Relations, Data Flow, Sequence Diagrams, Use Cases, Configuration)
- **API Strategy**: Single comprehensive prompt → structured JSON
- **Failure Handling**: Retry with exponential backoff (1s → 2s → 4s, 3 attempts), then show "Analysis unavailable" error state (no mock data fallback)
- **Context**: File tree + README + key files (package.json, tsconfig, main entry point)

## Architecture

### Provider Structure

```
src/lib/ai/
├── index.ts           # Provider registry + main analyzeRepository() function
├── types.ts           # AIProvider interface + AnalysisResult type
├── prompts.ts         # System prompt templates
└── providers/
    ├── minimax.ts     # Minimax API
    ├── openai.ts     # OpenAI API
    ├── anthropic.ts  # Anthropic/Claude API
    ├── gemini.ts      # Google Gemini API
    ├── glm.ts         # Zhipu GLM API
    └── kimi.ts        # Moonshot Kimi API
```

### Unified Provider Interface

```typescript
interface AIProvider {
  name: string
  analyzeArchitecture(request: AnalyzeRequest): Promise<AnalysisResult>
}

interface AnalyzeRequest {
  owner: string
  repo: string
  readme: string
  fileTree: FileNode[]
  keyFiles: { path: string; content: string }[]
}
```

### Analysis Result Schema

The AI returns a single structured JSON:

```json
{
  "systemArchitecture": {
    "channels": ["REST API", "WebSocket", "GraphQL"],
    "providers": ["PostgreSQL", "Redis", "S3"],
    "tools": ["Auth", "Logging", "Validation"]
  },
  "architectureLayers": [
    {
      "name": "Presentation Layer",
      "description": "Handles HTTP requests and UI rendering",
      "components": ["React Router", "Redux Store", "View Components"],
      "badge": "Frontend"
    }
  ],
  "componentRelations": {
    "nodes": [
      { "id": "1", "label": "API Gateway", "type": "gateway" },
      { "id": "2", "label": "Auth Service", "type": "service" }
    ],
    "edges": [
      { "from": "1", "to": "2" }
    ]
  },
  "dataFlow": {
    "nodes": [...],
    "edges": [...]
  },
  "sequenceDiagrams": [
    {
      "title": "User Login Flow",
      "steps": [
        { "from": "User", "to": "Frontend", "action": "Enter credentials", "type": "sync" },
        { "from": "Frontend", "to": "API", "action": "POST /auth/login", "type": "sync" }
      ]
    }
  ],
  "useCases": [
    {
      "name": "User Authentication",
      "description": "User can sign up, login, and logout"
    }
  ],
  "config": {
    "database": "PostgreSQL 14",
    "cache": "Redis 7",
    "deployment": "Docker + Kubernetes"
  }
}
```

## Data Flow

```
User enters repo URL
         ↓
loadData() fetches:
  - fetchRepositoryFull(owner, repo)
  - fetchFileTreeRecursive(owner, repo, '')
  - fetchKeyFiles() → package.json, tsconfig.json, main entry
         ↓
analyzeRepository() [in ai/index.ts]
  → selectProvider() from AI_PROVIDER env
  → buildPrompt(request)
  → provider.analyzeArchitecture(request)
    → Retry 3x with exponential backoff on failure
  → validateResponse(json)
         ↓
[Success] → setRepoData(transformedData)
[Failure after 3 retries] → setAnalysisError(err)
         ↓
UI:
  - Loading phases 1-3: metadata + tree + README (unchanged)
  - Phase 4: "Understanding architecture..." (shows spinner)
  - Phase 5: "Building diagrams..." (shows spinner)
  - If analysisError: show error banner, repo data still usable
```

## Loading States

The existing 5-phase loading skeleton is reused:

| Phase | Label | Description |
|-------|-------|-------------|
| 1 | Fetching repository info... | GitHub API metadata |
| 2 | Analyzing file structure... | File tree from GitHub API |
| 3 | Parsing documentation... | README from GitHub API |
| 4 | Understanding architecture... | AI analysis (NEW - was "Understanding architecture...") |
| 5 | Building diagrams... | Rendering components |

Phase 4 is now functional — it shows real AI analysis progress. A subtle pulsing indicator signals active AI work.

## Error Handling

- **Retry**: Exponential backoff (1s → 2s → 4s), max 3 attempts
- **After 3 failures**: Set `analysisError: string` state, show non-blocking error banner in repo page
- **No mock data fallback**: Never silently fall back to OpenClaw mock data
- **Per-field validation**: If JSON parses but some fields missing, fill missing with empty arrays/objects and log warning

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/lib/ai/index.ts` | Provider registry + `analyzeRepository()` |
| `src/lib/ai/types.ts` | `AIProvider` interface, `AnalyzeRequest`, `AnalysisResult` types |
| `src/lib/ai/prompts.ts` | System prompt templates |
| `src/lib/ai/providers/minimax.ts` | Minimax implementation |
| `src/lib/ai/providers/openai.ts` | OpenAI implementation |
| `src/lib/ai/providers/anthropic.ts` | Anthropic implementation |
| `src/lib/ai/providers/gemini.ts` | Google Gemini implementation |
| `src/lib/ai/providers/glm.ts` | Zhipu GLM implementation |
| `src/lib/ai/providers/kimi.ts` | Moonshot Kimi implementation |

### Modified Files

| File | Change |
|------|--------|
| `src/app/repo/[owner]/[repo]/page.tsx` | Add `analyzeRepository()` call, `analysisError` state, wire AI data into `logic` and `scenario` |
| `src/lib/types.ts` | Update `LogicView` and `ScenarioView` to match AI response schema |
| `.env.example` | Add `AI_PROVIDER=minimax`, `MINIMAX_API_KEY=`, `OPENAI_API_KEY=`, `ANTHROPIC_API_KEY=`, `GEMINI_API_KEY=`, `GLM_API_KEY=`, `KIMI_API_KEY=` |
| `.env.local` | Add `AI_PROVIDER=minimax`, `MINIMAX_API_KEY=<user's key>` |

## Environment Variables

```env
# Which provider to use (default: minimax)
AI_PROVIDER=minimax

# Provider API keys (only the one selected by AI_PROVIDER is needed)
MINIMAX_API_KEY=your_minimax_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here
GLM_API_KEY=your_glm_key_here
KIMI_API_KEY=your_kimi_key_here
```

## Testing Strategy

- Unit test each provider's request/response handling
- Mock API responses for all providers
- Verify JSON parsing handles partial/malformed responses gracefully
- E2E test: enter a known repo, verify diagrams match README structure
