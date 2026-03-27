'use client'

import { useState } from 'react'
import styles from './DirectoryTree.module.css'

interface FileNode {
  name: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

interface DirectoryTreeProps {
  data: FileNode
  onFileClick?: (path: string) => void
}

export default function DirectoryTree({ data, onFileClick }: DirectoryTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const renderNode = (node: FileNode, path: string = '', depth: number = 0) => {
    const fullPath = path ? `${path}/${node.name}` : node.name
    const isDir = node.type === 'directory'
    const isExpanded = expanded[fullPath]

    return (
      <div key={fullPath} className={styles.node} style={{ paddingLeft: depth * 16 }}>
        {isDir ? (
          <button className={styles.folderBtn} onClick={() => toggle(fullPath)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isExpanded ?
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2zM3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> :
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              }
            </svg>
            <span className={styles.name}>{node.name}</span>
          </button>
        ) : (
          <button className={styles.fileBtn} onClick={() => onFileClick?.(fullPath)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className={styles.name}>{node.name}</span>
          </button>
        )}
        {isDir && isExpanded && node.children?.map(child => renderNode(child, fullPath, depth + 1))}
      </div>
    )
  }

  return <div className={styles.tree}>{renderNode(data)}</div>
}