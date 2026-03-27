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