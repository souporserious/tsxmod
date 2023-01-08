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
import React from 'react'

export function Button(props: {
    onClick: () => void
    children: React.ReactNode
}) {
    return <button onClick={props.onClick}>{props.children}</button>
}
`.trim()

const initialTransformSource = `
import { Project } from 'ts-morph';

export default function transform(project: Project) {
  const file = project.getSourceFileOrThrow('Button.tsx');
  const declaration = file.getFunctionOrThrow('Button');
  
  declaration.rename('LegacyButton');
}
`.trim()

const sourceFile = project.createSourceFile('Button.tsx', codeString)

const setTheme = (monaco) => {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.Preserve,
    esModuleInterop: true,
  })

  monaco.editor.defineTheme('dark-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#000000',
    },
  })
}

const monacoOptions = {
  automaticLayout: true,
  contextmenu: false,
  formatOnPaste: true,
  formatOnType: true,
  minimap: { enabled: false },
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
        transformedProject.getSourceFile('Button.tsx').getFullText()
      )
    })
  }, [sourceCode, transformSource])

  return (
    <PanelGroup
      direction="vertical"
      className="panel-group"
      style={{ height: '100vh' }}
    >
      <Panel id="editors" className="panel" defaultSize={50}>
        <PanelGroup direction="horizontal" className="panel">
          <Panel id="source" className="panel">
            <MonacoEditor
              width="100%"
              height="100%"
              path="source.tsx"
              language="typescript"
              options={monacoOptions}
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

          <PanelResizeHandle className="resize-handle" />

          <Panel id="output" className="panel">
            <MonacoEditor
              height="100%"
              language="typescript"
              path="transformed-source.tsx"
              options={monacoOptions}
              value={transformedSource}
              theme="dark-theme"
              beforeMount={setTheme}
            />
          </Panel>
        </PanelGroup>
      </Panel>

      <Panel id="ast" className="panel" defaultSize={50}>
        <PanelGroup direction="horizontal" className="panel">
          <Panel id="explorer" className="panel" defaultSize={50}>
            <ASTExplorer
              node={sourceFile}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
            />
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          <Panel id="transform" className="panel">
            <MonacoEditor
              height="100%"
              language="typescript"
              path="transform.ts"
              options={monacoOptions}
              value={transformSource}
              onChange={setTransformSource}
              theme="dark-theme"
              beforeMount={setTheme}
            />
          </Panel>
        </PanelGroup>
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
