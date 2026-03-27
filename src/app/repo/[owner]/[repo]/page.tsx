import RepoPageClient from '@/components/RepoPageClient'

export function generateStaticParams(): { owner: string; repo: string }[] {
  return [{ owner: 'openclaw', repo: 'openclaw' }]
}

export default function RepoPage() {
  return <RepoPageClient />
}
