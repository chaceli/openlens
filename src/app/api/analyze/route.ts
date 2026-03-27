import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepository } from '@/lib/ai'
import { AnalyzeRequest } from '@/lib/ai/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AnalyzeRequest
    const { owner, repo, fileTree, readme, keyFiles } = body

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 })
    }

    const result = await analyzeRepository({
      owner,
      repo,
      fileTree: fileTree || '',
      readme: readme || '',
      keyFiles: keyFiles || []
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
