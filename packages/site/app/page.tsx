'use client'
import MonacoEditor from '@monaco-editor/react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { Project } from 'ts-morph'
import type { Node } from 'ts-morph'
import { useEffect, useRef, useState } from 'react'

import './styles.css'

const project = new Project({ useInMemoryFileSystem: true })

const codeString = `
function sayHello(name: string) {
  console.log(\`Hello \${name}\`)
}

sayHello('World')
`.trim()

const sourceFile = project.createSourceFile('test.ts', codeString)

export default function Page() {
  const [selectedNode, setSelectedNode] = useState<Node>(null)

  return (
    <PanelGroup
      direction="horizontal"
      width={window.innerWidth}
      height={window.innerHeight}
      className="panel-group"
    >
      <Panel id="editor" className="panel">
        <MonacoEditor
          height="100%"
          language="typescript"
          value={sourceFile.getFullText()}
          theme="dark-theme"
          beforeMount={(monaco) => {
            monaco.editor.defineTheme('dark-theme', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#000000',
              },
            })
          }}
          onMount={(editor) => {
            editor.onDidChangeCursorPosition((event) => {
              const offset = editor.getModel().getOffsetAt(event.position)
              const node = sourceFile.getDescendantAtPos(offset)

              setSelectedNode(node)
            })
          }}
        />
        <PanelResizeHandle className="resize-handle" />
      </Panel>
      <Panel id="explorer" className="panel">
        <ASTExplorer
          node={sourceFile}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
        />
      </Panel>
    </PanelGroup>
  )
}

function ASTExplorer({
  node,
  selectedNode,
  setSelectedNode,
  level = 0,
}: {
  node: Node
  selectedNode?: Node
  setSelectedNode?: (node: Node) => void
  level?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isSelected = node === selectedNode

  useEffect(() => {
    if (isSelected) {
      ref.current.scrollIntoView()
    }
  }, [isSelected])

  return (
    <div
      style={{
        padding: level === 0 ? '1rem' : undefined,
        overflow: level === 0 ? 'auto' : undefined,
      }}
    >
      <div
        ref={ref}
        style={{
          padding: '0.25rem',
          backgroundColor: isSelected ? '#3178c6' : undefined,
        }}
        onClick={() => setSelectedNode(node)}
      >
        {node.getKindName()}
      </div>
      <ul style={{ margin: 0 }}>
        {node.getChildren().map((child, index) => {
          return (
            <li key={index} style={{ listStyle: 'none', paddingLeft: 8 }}>
              <ASTExplorer
                node={child}
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
                level={level + 1}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
