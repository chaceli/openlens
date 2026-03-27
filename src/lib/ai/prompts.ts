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