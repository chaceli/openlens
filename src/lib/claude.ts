const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

interface AnalyzeCodeRequest {
  owner: string
  repo: string
  fileTree: any[]
  readme: string
  codeSnippets?: { path: string; content: string }[]
}

export async function analyzeCodeWithClaude(request: AnalyzeCodeRequest): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const prompt = `You are analyzing the GitHub repository ${request.owner}/${request.repo}.

README:
${request.readme.slice(0, 2000)}

File Structure:
${JSON.stringify(request.fileTree.slice(0, 100), null, 2)}

Based on this information, provide a brief architectural overview (2-3 sentences) of this project.`

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`)

  const data = await response.json()
  return data.content[0].text
}