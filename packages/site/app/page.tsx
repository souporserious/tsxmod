'use client'
import MonacoEditor from '@monaco-editor/react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { Project } from 'ts-morph'
import type { Node } from 'ts-morph'
import { useEffect, useRef, useState } from 'react'
import { executeCode } from './execute-code'

import './styles.css'

const project = new Project({ useInMemoryFileSystem: true })

const codeString = `
export function getString(): string {
  return 'Rising crust pizza';
}
`.trim()

const initialTransformSource = `
import { Project } from 'ts-morph';

export default function transform(project: Project) {
  const file = project.getSourceFileOrThrow('test.ts');
  const declaration = file.getFunctionOrThrow('getString');
  
  declaration.rename('getPizzaKind');
}
`.trim()

const sourceFile = project.createSourceFile('test.ts', codeString)

const setTheme = (monaco) => {
  monaco.editor.defineTheme('dark-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#000000',
    },
  })
}

export default function Page() {
  const [selectedNode, setSelectedNode] = useState<Node>(null)
  const [sourceCode, setSourceCode] = useState(() => sourceFile.getFullText())
  const [transformSource, setTransformSource] = useState(initialTransformSource)
  const [transformedSource, setTransformedSource] = useState('')

  useEffect(() => {
    executeCode(transformSource).then((transform) => {
      const transformedProject = new Project({ useInMemoryFileSystem: true })

      // Map the original source files to the new project
      project.getSourceFiles().forEach((sourceFile) => {
        transformedProject.createSourceFile(
          sourceFile.getFilePath(),
          sourceFile.getFullText()
        )
      })

      // Run the transform
      transform(transformedProject)

      setTransformedSource(
        transformedProject.getSourceFile('test.ts').getFullText()
      )
    })
  }, [sourceCode, transformSource])

  return (
    <PanelGroup
      direction="horizontal"
      width={window.innerWidth}
      height={window.innerHeight}
      className="panel-group"
    >
      <Panel id="editors" className="panel">
        <PanelGroup
          direction="vertical"
          width={window.innerWidth / 2}
          height={window.innerHeight}
          className="panel"
        >
          <Panel id="source" className="panel">
            <MonacoEditor
              height="100%"
              language="typescript"
              value={sourceCode}
              theme="dark-theme"
              beforeMount={setTheme}
              onMount={(editor) => {
                editor.onDidChangeCursorPosition((event) => {
                  const offset = editor.getModel().getOffsetAt(event.position)
                  const node = sourceFile.getDescendantAtPos(offset)

                  setSelectedNode(node)
                })
              }}
              onChange={(value) => {
                sourceFile.replaceWithText(value)
                setSourceCode(value)
              }}
            />
          </Panel>
          <Panel id="transform" className="panel">
            <MonacoEditor
              height="100%"
              language="typescript"
              value={transformSource}
              onChange={setTransformSource}
              theme="dark-theme"
              beforeMount={setTheme}
            />
          </Panel>
          <Panel id="output" className="panel">
            <MonacoEditor
              height="100%"
              language="typescript"
              value={transformedSource}
              theme="dark-theme"
              beforeMount={setTheme}
            />
          </Panel>
        </PanelGroup>
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
