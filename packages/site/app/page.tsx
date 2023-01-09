'use client'
import MonacoEditor from '@monaco-editor/react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { Project } from 'ts-morph'
import type { Node } from 'ts-morph'
import { useEffect, useRef, useState } from 'react'
import { initializeMonaco } from '../utils/initialize-monaco'
import { scrollIntoView } from '../utils/scroll'
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
      direction="horizontal"
      className="panel-group"
      style={{ height: '100vh' }}
    >
      <Panel id="transform" className="panel">
        <MonacoEditor
          height="100%"
          language="typescript"
          path="transform.ts"
          options={monacoOptions}
          value={transformSource}
          onChange={setTransformSource}
          theme="dark-theme"
          beforeMount={initializeMonaco}
        />
      </Panel>

      <PanelResizeHandle className="resize-handle" />

      <Panel id="source-group">
        <PanelGroup direction="vertical">
          <Panel id="source" className="panel">
            <MonacoEditor
              width="100%"
              height="100%"
              path="source.tsx"
              language="typescript"
              options={monacoOptions}
              value={sourceCode}
              theme="dark-theme"
              beforeMount={initializeMonaco}
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
              path="output.tsx"
              options={{
                ...monacoOptions,
                readOnly: true,
                scrollBeyondLastLine: false,
              }}
              value={transformedSource}
              theme="dark-theme"
              beforeMount={initializeMonaco}
            />
          </Panel>
        </PanelGroup>
      </Panel>

      <PanelResizeHandle className="resize-handle" />

      <Panel id="explorer" className="panel" defaultSize={15}>
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
      scrollIntoView(ref.current)
    }
  }, [isSelected])

  return (
    <div
      style={{
        padding: level === 0 ? '0.2rem' : undefined,
        overflow: level === 0 ? 'auto' : undefined,
      }}
    >
      <div
        ref={ref}
        style={{
          padding: '0.125rem',
          backgroundColor: isSelected ? '#3178c6' : undefined,
        }}
        onClick={() => setSelectedNode(node)}
      >
        {node.getKindName()}
      </div>
      <ul style={{ paddingLeft: 0, margin: 0 }}>
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
