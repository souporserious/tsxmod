'use client'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { Node } from 'tsxmod/ts-morph'
import { Project } from 'tsxmod/ts-morph'
import { getNodesBetweenOffsets } from 'tsxmod/utils'
import { useEffect, useRef, useState } from 'react'
import { GitHubLink, Logo } from 'components'
import { ASTExplorer } from './ASTExplorer'
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
            value={transformSource}
            onChange={setTransformSource}
          />
        </Section>

        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr' }}>
          <Section title="Input">
            <Editor
              path="source.tsx"
              options={{ scrollBeyondLastLine: false }}
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
              options={{ readOnly: true, scrollBeyondLastLine: false }}
              value={transformedSource}
            />
          </Section>
        </div>

        <Section title="AST">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 'var(--space-1)',
              overflow: 'auto',
            }}
          >
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
