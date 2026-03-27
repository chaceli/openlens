import { FileNode } from './types'

const GITHUB_API = 'https://api.github.com'

// GitHub token for higher rate limit (5000 req/hr vs 60 req/hr for unauthenticated)
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  }
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  }
  return headers
}

export async function fetchRepository(owner: string, repo: string) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: getHeaders() })
  if (!response.ok) {
    if (response.status === 404) throw new Error('Repository not found')
    if (response.status === 403) throw new Error('GitHub rate limit reached. Add GITHUB_TOKEN to .env.local for higher limits.')
    throw new Error(`Failed to fetch repository: ${response.statusText}`)
  }
  const data = await response.json()
  return {
    owner: data.owner.login,
    repo: data.name,
    description: data.description || '',
    language: data.language || 'Unknown',
    stars: data.stargazers_count,
    forks: data.forks_count,
  }
}

export async function fetchFileTree(owner: string, repo: string, path: string = ''): Promise<FileNode[]> {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, { headers: getHeaders() })
  if (!response.ok) throw new Error('Failed to fetch file tree')

  const contents = await response.json()
  return Array.isArray(contents) ? contents.map((item: any) => ({
    name: item.name,
    type: item.type === 'dir' ? 'directory' : 'file',
    path: item.path,
    children: item.type === 'dir' ? [] : undefined,
  })) : []
}

export async function fetchReadme(owner: string, repo: string): Promise<string> {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, { headers: getHeaders() })
  if (!response.ok) return ''

  const data = await response.json()
  return atob(data.content)
}

export async function fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, { headers: getHeaders() })
  if (!response.ok) throw new Error('Failed to fetch file content')
  const data = await response.json()
  // GitHub API returns base64-encoded content for files
  return atob(data.content)
}

export async function fetchRepositoryFull(owner: string, repo: string) {
  const [repoData, readme] = await Promise.all([
    fetchRepository(owner, repo),
    fetchReadme(owner, repo),
  ])
  return { ...repoData, readme }
}

export async function fetchFileTreeRecursive(owner: string, repo: string, path: string = ''): Promise<FileNode[]> {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, { headers: getHeaders() })
    if (!response.ok) return []

    const contents = await response.json()
    if (!Array.isArray(contents)) return []

    return contents
      .filter((item: any) => !item.name.startsWith('.')) // filter hidden files
      .sort((a: any, b: any) => {
        // Directories first, then files
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      .map((item: any) => ({
        name: item.name,
        type: item.type === 'dir' ? 'directory' as const : 'file' as const,
        path: item.path,
        children: item.type === 'dir' ? [] as FileNode[] : undefined,
      }))
  } catch {
    return []
  }
}