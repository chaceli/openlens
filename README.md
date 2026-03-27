# OpenLens

Visual understanding tool for open source projects. Paste any GitHub repository URL and get interactive architecture diagrams powered by AI that help you understand how the code is structured, how modules connect, and how it works.

## Features

### Development View
- **Interactive Directory Tree**: Explore the complete file structure with expandable folders
- **Dependency Graph**: Visualize how modules and packages depend on each other
- **File Preview**: Click on any file to view its contents with syntax highlighting

### Logic View
- **System Architecture**: AI-generated component relationship map showing how different parts of the codebase interact
- **Architecture Layers**: Hierarchical view of the system's architecture tiers
- **Component Relations**: Interactive graph of all major components and their connections
- **Data Flow**: Understand how data moves through the system

### Scenario View
- **Sequence Diagrams**: AI-generated Mermaid diagrams showing step-by-step workflows
- **Use Cases**: Organized view of the system's key use cases
- **Configuration Reference**: Centralized configuration documentation

### AI-Powered Analysis
- Powered by LLMs (Claude, GPT-4, Gemini, MiniMax, GLM, Kimi)
- Automatically identifies components, relationships, and workflows
- Generates interactive diagrams from source code

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- GitHub account (optional, for higher API rate limits)

### Installation

```bash
git clone <repository-url>
cd openlens
npm install
```

### Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and enter any GitHub repository URL.

### Build

```bash
npm run build
npm start
```

## Configuration

Create a `.env.local` file in the root directory:

```bash
# GitHub Token (optional - for higher API rate limit: 5000/hr vs 60/hr)
# Get from https://github.com/settings/tokens (no scopes needed for public repos)
NEXT_PUBLIC_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AI Provider selection (minimax, openai, anthropic, gemini, glm, kimi)
AI_PROVIDER=minimax

# API Key for your chosen AI provider
MINIMAX_API_KEY=your_minimax_api_key_here
# Or use one of these instead:
# OPENAI_API_KEY=your_openai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
# GEMINI_API_KEY=your_gemini_api_key_here
# GLM_API_KEY=your_glm_api_key_here
# KIMI_API_KEY=your_kimi_api_key_here
```

### AI Provider Setup

| Provider | Description |
|----------|-------------|
| **MiniMax** | Default provider, good balance of cost and quality |
| **Anthropic** | Claude models - excellent for code understanding |
| **OpenAI** | GPT-4 models - strong all-around performance |
| **Google** | Gemini models - good for multimodal analysis |
| **GLM** | Chinese LLM provider |
| **Kimi** | Chinese LLM provider by Moonshot |

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI**: React 19, CSS Modules
- **Diagrams**: [React Flow](https://reactflow.dev/) for interactive graphs
- **Sequence Diagrams**: [Mermaid](https://mermaid.js.org/)
- **API**: GitHub REST API via Octokit
- **AI**: Multi-provider support (Anthropic, OpenAI, Google, MiniMax, GLM, Kimi)

## Project Structure

```
openlens/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── api/
│   │   │   └── analyze/route.ts        # AI analysis API endpoint
│   │   └── repo/[owner]/[repo]/
│   │       ├── page.tsx                # Repository analysis page
│   │       └── page.module.css         # Page styles
│   ├── components/
│   │   ├── diagrams/
│   │   │   ├── ArchitectureLayers.tsx  # Architecture layers view
│   │   │   ├── ComponentRelations.tsx  # Interactive component graph
│   │   │   ├── DataFlow.tsx            # Data flow visualization
│   │   │   ├── DependencyGraph.tsx     # Module dependency graph
│   │   │   ├── DirectoryTree.tsx       # File directory tree
│   │   │   ├── MermaidSequence.tsx     # Mermaid sequence diagrams
│   │   │   ├── SequenceDiagram.tsx     # Sequence diagram wrapper
│   │   │   ├── SystemArchitecture.tsx   # System architecture view
│   │   │   └── UseCases.tsx            # Use case diagrams
│   │   └── ui/
│   │       └── Skeleton.tsx            # Loading skeleton component
│   └── lib/
│       ├── github.ts                    # GitHub API client
│       ├── ai/
│       │   ├── index.ts                 # AI analysis orchestrator
│       │   ├── prompts.ts               # AI prompts/templates
│       │   ├── types.ts                 # TypeScript types for AI
│       │   └── providers/               # AI provider implementations
│       │       ├── anthropic.ts
│       │       ├── openai.ts
│       │       ├── gemini.ts
│       │       ├── minimax.ts
│       │       ├── glm.ts
│       │       └── kimi.ts
│       └── types.ts                     # Shared TypeScript types
├── public/
│   └── favicon.svg
├── .env.example                         # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## API

### POST /api/analyze

Analyzes a GitHub repository and generates architecture diagrams.

**Request Body:**
```json
{
  "owner": "denoland",
  "repo": "deno",
  "fileTree": "📁 src\n  📄 index.ts\n  📄 main.ts",
  "readme": "# Deno\nA modern runtime...",
  "keyFiles": [
    { "path": "package.json", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "logic": {
    "layers": [...],
    "componentRelations": {
      "components": [...],
      "relations": [...]
    },
    "dataFlow": [...],
    "config": {...}
  },
  "scenario": {
    "sequenceSteps": [...],
    "useCases": [...]
  }
}
```

## License

MIT
