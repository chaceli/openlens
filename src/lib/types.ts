export interface Repository {
  owner: string
  repo: string
  description: string
  language: string
  stars: number
  forks: number
  fileTree: FileNode[]
  readme: string
}

export interface FileNode {
  name: string
  type: 'file' | 'directory'
  path: string
  children?: FileNode[]
}

export interface AnalysisResult {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  views: {
    dev: DevView
    logic: LogicView
    scenario: ScenarioView
  }
}

export interface DevView {
  structure: FileNode[]
  dependencies: DependencyGraph
}

export interface DependencyGraph {
  nodes: { id: string; label: string; type: string }[]
  edges: { from: string; to: string }[]
}

export interface LogicView {
  architecture: ArchitectureLayer[]
  components: ComponentRelationship
}

export interface ArchitectureLayer {
  name: string
  description: string
  components: string[]
}

export interface ComponentRelationship {}

export interface ScenarioView {
  sequences: SequenceStep[]
  useCases: UseCase[]
}

export interface SequenceStep {
  from: string
  to: string
  action: string
}

export interface UseCase {
  name: string
  description: string
}