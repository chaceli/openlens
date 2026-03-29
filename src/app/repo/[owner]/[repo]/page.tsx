import RepoPageClient from '@/components/RepoPageClient'

export function generateStaticParams(): { owner: string; repo: string }[] {
  return [
    { owner: 'openclaw', repo: 'openclaw' },
    { owner: 'facebook', repo: 'react' },
    { owner: 'denoland', repo: 'deno' },
    { owner: 'vercel', repo: 'next.js' },
    { owner: 'microsoft', repo: 'vscode' },
    { owner: 'twbs', repo: 'bootstrap' },
    { owner: 'nodejs', repo: 'node' },
    { owner: 'airbnb', repo: 'javascript' },
  ]
}

export default function RepoPage() {
  return <RepoPageClient />
}
