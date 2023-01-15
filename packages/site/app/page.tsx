'use client'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { Node } from 'tsxmod/ts-morph'
import { Project } from 'tsxmod/ts-morph'
import { getDescendantAtRange } from 'tsxmod/utils'
import { useEffect, useRef, useState } from 'react'
import { ASTExplorer, Editor, GitHubLink, Logo } from './components'
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
  const [activeNode, setActiveNode] = useState<Node | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
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
              decorations={[
                activeNode &&
                  getRangeFromNode(activeNode, 'line-decoration-active'),
                hoveredNode &&
                  getRangeFromNode(hoveredNode, 'line-decoration-hovered'),
              ].filter(Boolean)}
              onCursorChange={(selection) => {
                const node = getDescendantAtRange(sourceFile, [
                  selection.start.offset,
                  selection.end.offset,
                ])
                setActiveNode(node)
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
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 'var(--space-1)',
              }}
            >
              <ASTExplorer
                node={sourceFile}
                activeNode={activeNode}
                setActiveNode={(node) => {
                  /** Focus the source editor when selecting a node in the AST */
                  const lineAndColumn = node
                    .getSourceFile()
                    .getLineAndColumnAtPos(node.getStart())

                  editorRef.current.focus()
                  editorRef.current.setPosition(
                    new monacoRef.current.Position(
                      lineAndColumn.line,
                      lineAndColumn.column
                    )
                  )

                  setActiveNode(node)
                }}
                setHoveredNode={setHoveredNode}
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

function getRangeFromNode(node: Node, className: string) {
  const sourceFile = node.getSourceFile()
  const start = sourceFile.getLineAndColumnAtPos(node.getStart())
  const end = sourceFile.getLineAndColumnAtPos(node.getEnd())

  return {
    startLineNumber: start.line,
    startColumn: start.column,
    endLineNumber: end.line,
    endColumn: end.column,
    className,
  }
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
