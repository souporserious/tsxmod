'use client'
import { Project } from 'ts-morph'
import type { Node } from 'ts-morph'
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
              onCursorChange={(position) => {
                const node = sourceFile.getDescendantAtPos(position)
                setSelectedNode(node)
              }}
              onChange={(value) => {
                sourceFile.replaceWithText(value)
                setSourceCode(value)
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
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
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
    <div style={{ padding: level === 0 ? 'var(--space-1)' : undefined }}>
      <div
        ref={ref}
        style={{
          padding: 'var(--space-025)',
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
