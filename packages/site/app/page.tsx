'use client'
import type { Dispatch, SetStateAction } from 'react'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { Node } from 'ts-morph'
import { Project } from 'ts-morph'
import { getNodesBetweenOffsets } from '@tsxmod/utils'
import { useEffect, useRef, useState } from 'react'
import { GitHubLink, Logo } from 'components'
import { scrollIntoView } from '../utils/scroll'
import { Editor } from './Editor'
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
  folding: false,
  glyphMargin: false,
  minimap: { enabled: false },
} as editor.IEditorConstructionOptions

export default function Page() {
  const [activeNodes, setActiveNodes] = useState<Node[]>([])
  const [sourceCode, setSourceCode] = useState(() => sourceFile.getFullText())
  const [transformSource, setTransformSource] = useState(initialTransformSource)
  const [transformedSource, setTransformedSource] = useState('')
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)

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

  // Focus the editor when the selected node changed from the AST explorer
  useEffect(() => {
    if (
      activeNodes.length === 0 ||
      monacoRef.current === null ||
      editorRef.current === null ||
      editorRef.current.hasTextFocus()
    ) {
      return
    }

    const firstNode = activeNodes[0]
    const lineAndColumn = firstNode
      .getSourceFile()
      .getLineAndColumnAtPos(firstNode.getStart())

    editorRef.current.focus()
    editorRef.current.setPosition(
      new monacoRef.current.Position(lineAndColumn.line, lineAndColumn.column)
    )
  }, [activeNodes])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        height: '100vh',
      }}
    >
      <div style={{ display: 'flex', padding: 'var(--space-1)' }}>
        <Logo />
        <div style={{ flex: 1 }} />
        <GitHubLink />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 4fr 2fr' }}>
        <Section title="Transform">
          <Editor
            path="transform.ts"
            options={monacoOptions}
            value={transformSource}
            onChange={setTransformSource}
          />
        </Section>

        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr' }}>
          <Section title="Input">
            <Editor
              path="source.tsx"
              options={monacoOptions}
              value={sourceCode}
              onCursorChange={(selection) => {
                const nodes = getNodesBetweenOffsets(
                  sourceFile,
                  selection.start.offset,
                  selection.end.offset
                )
                setActiveNodes(nodes)
              }}
              onChange={(value) => {
                sourceFile.replaceWithText(value)
                setSourceCode(value)
              }}
              onMount={(editor, monaco) => {
                editorRef.current = editor
                monacoRef.current = monaco
              }}
            />
          </Section>

          <Section title="Output">
            <Editor
              path="output.tsx"
              options={{
                ...monacoOptions,
                readOnly: true,
                scrollBeyondLastLine: false,
              }}
              value={transformedSource}
            />
          </Section>
        </div>

        <Section title="AST Explorer">
          <div style={{ overflow: 'auto' }}>
            <ASTExplorer
              node={sourceFile}
              activeNodes={activeNodes}
              setActiveNodes={setActiveNodes}
            />
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        overflow: 'auto',
        border: '0.5px solid #0c1535',
      }}
    >
      <div style={{ padding: 'var(--space-1)' }}>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function ASTExplorer({
  node,
  activeNodes,
  setActiveNodes,
  level = 0,
}: {
  node: Node
  activeNodes?: Node[]
  setActiveNodes?: Dispatch<SetStateAction<Node[]>>
  level?: number
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const isSelected = activeNodes?.includes(node) ?? false

  useEffect(() => {
    if (isSelected) {
      scrollIntoView(ref.current)
    }
  }, [isSelected])

  return (
    <div style={{ padding: level === 0 ? 'var(--space-1)' : undefined }}>
      <button
        ref={ref}
        style={{
          appearance: 'none',
          padding: 'var(--space-025)',
          border: 'none',
          color: '#fff',
          backgroundColor: isSelected ? '#3178c6' : 'transparent',
        }}
        onClick={() => {
          setActiveNodes?.([node])
        }}
      >
        {node.getKindName()}
      </button>
      <ul style={{ paddingLeft: 0, margin: 0 }}>
        {node.getChildren().map((child, index) => {
          return (
            <li key={index} style={{ listStyle: 'none', paddingLeft: 8 }}>
              <ASTExplorer
                node={child}
                activeNodes={activeNodes}
                setActiveNodes={setActiveNodes}
                level={level + 1}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
