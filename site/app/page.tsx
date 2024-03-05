'use client'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import {
  InMemoryFileSystemHost,
  Node,
  SourceFile,
  TypeFormatFlags,
  ts,
} from 'ts-morph'
import * as tsMorph from 'ts-morph'
import * as utils from '@tsxmod/utils'
import { Project } from 'ts-morph'
import { getDescendantAtRange } from '@tsxmod/utils'
import { useEffect, useRef, useState } from 'react'
import { ASTExplorer, Editor, GitHubLink, Logo } from './components'
import { types } from './hooks/use-types'
import { executeCode } from './utils/execute-code'

import './styles.css'

const files = [
  {
    path: 'App.tsx',
    code: `
import React from 'react'
import { Button } from './Button'
import { Dialog } from './Dialog'

export default function App() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    console.log({ open })
  }, [open])

  return (
    <>
      <Button disabled onClick={() => setOpen(true)} children="Open" />
      <Dialog onClose={() => setOpen(false)} open={open}>
        Hello Dialog
        <Button disabled onClick={() => setOpen(false)} children="Close" />
      </Dialog>
    </>
  )
}
`.trim(),
  },
  {
    path: 'Button.tsx',
    code: `
import React from 'react'

export const Button = (props: {
  /** @deprecated use \`isDisabled\` instead */
  disabled?: boolean
  /** @see {@link https://github.com/souporserious/tsxmod tsxmod} */
  isDisabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) => {
  return (
    <button
      disabled={props.disabled || props.isDisabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}
`.trim(),
  },
  {
    path: 'Dialog.tsx',
    code: `
import React from 'react'
import { Button } from './Button'

export function Dialog(props: {
  /** @deprecated use \`isOpen\` instead */
  open?: boolean
  isOpen?: boolean
  onClose?: () => void
  children: React.ReactNode
}) {
  if (!props.open || !props.isOpen) return null

  return (
    <dialog>
      {props.children}
      <Button onClick={props.onClose}>Close</Button>
    </dialog>
  )
}
`.trim(),
  },
]

const initialTransformSource = `
import { Node, Project } from 'ts-morph'
import { getJsxElements, getTypeDocumentation } from '@tsxmod/utils'

export default function (project: Project) {
  const typeChecker = project.getTypeChecker()
  const appSourceFile = project.getSourceFileOrThrow('App.tsx')

  // Write codemod here
  const elements = getJsxElements(appSourceFile)

  elements.forEach((element) => {
    const node = Node.isJsxElement(element)
      ? element.getOpeningElement()
      : element
    const declaration = typeChecker.getResolvedSignature(node).getDeclaration()
    if (
      Node.isExpression(declaration) ||
      Node.isFunctionDeclaration(declaration)
    ) {
      const typeDoc = getTypeDocumentation(declaration)[0]
      typeDoc.properties.forEach((property) => {
        const deprecatedTag = property.tags.find(
          (tag) => tag.name === 'deprecated'
        )
        if (!deprecatedTag) return

        const newName = deprecatedTag.text.match(/^use \`(\\w+)\`/)?.[1]
        if (!newName) return

        const attribute = node.getAttribute(property.name)
        attribute?.replaceWithText(newName)
      })
    }
  })
}
`.trim()

const project = new Project({ useInMemoryFileSystem: true })

files.forEach((file) => {
  project.createSourceFile(file.path, file.code)
})

export default function Page() {
  const [activePath, setActivePath] = useState(files[0].path)
  const [sourceFile, setSourceFile] = useState(() =>
    project.getSourceFile(activePath)
  )
  const [activeNode, setActiveNode] = useState<Node | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const [transformSource, setTransformSource] = useState(initialTransformSource)
  const [transformedSource, setTransformedSource] = useState('')
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)

  // For some reason onCursorChange below is stale without using a ref
  const sourceFileRef = useRef<SourceFile | null>(null)

  sourceFileRef.current = sourceFile

  useEffect(() => {
    setSourceFile(project.getSourceFile(activePath))
  }, [activePath])

  useEffect(() => {
    executeCode(transformSource, {
      'ts-morph': tsMorph,
      '@tsxmod/utils': utils,
    }).then((transform) => {
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
        transformedProject.getSourceFile(activePath).getFullText()
      )
    })
  }, [activePath, sourceFile, transformSource])

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
            // onCursorChange={(selection) => {
            //   const fileSystem = new InMemoryFileSystemHost()

            //   types.value.forEach((type) => {
            //     fileSystem.writeFileSync(
            //       type.path.replace('file:///', ''),
            //       type.code
            //     )
            //   })

            //   const project = new Project({
            //     fileSystem,
            //     compilerOptions: {
            //       target: ts.ScriptTarget.ESNext,
            //       moduleResolution: ts.ModuleResolutionKind.NodeJs,
            //     },
            //   })
            //   const sourceFile = project.createSourceFile(
            //     'transform.ts',
            //     transformSource
            //   )
            //   const node = getDescendantAtRange(sourceFile, [
            //     selection.start.offset,
            //     selection.end.offset,
            //   ])

            //   console.log(
            //     node
            //       .getType()
            //       .getText(
            //         node,
            //         TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
            //       )
            //   )
            // }}
          />
        </Section>

        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr' }}>
          <Section
            title="Input"
            header={
              <ul
                style={{
                  display: 'flex',
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  overflow: 'auto',
                }}
              >
                {files.map((file) => (
                  <li
                    key={file.path}
                    style={{
                      padding: 'var(--space-05)',
                      cursor: 'pointer',
                      color:
                        file.path === activePath
                          ? 'rgb(116, 146, 255)'
                          : 'rgba(255, 255, 255, 0.5)',
                    }}
                    onClick={() => setActivePath(file.path)}
                  >
                    {file.path}
                  </li>
                ))}
              </ul>
            }
          >
            <Editor
              path={activePath}
              options={{ scrollBeyondLastLine: false }}
              defaultValue={
                files.find((file) => file.path === activePath)?.code
              }
              defaultLanguage="typescript"
              decorations={[
                activeNode &&
                  getRangeFromNode(activeNode, 'line-decoration-active'),
                hoveredNode &&
                  getRangeFromNode(hoveredNode, 'line-decoration-hovered'),
              ].filter(Boolean)}
              onCursorChange={(selection) => {
                const node = getDescendantAtRange(sourceFileRef.current, [
                  selection.start.offset,
                  selection.end.offset,
                ])

                setActiveNode(node)
              }}
              onChange={(value) => {
                setSourceFile(sourceFile.replaceWithText(value) as SourceFile)
              }}
              onMount={(editor, monaco) => {
                files.forEach((file) => {
                  const uri = monaco.Uri.parse(file.path)
                  const model = monaco.editor.getModel(uri)

                  if (model) {
                    monaco.editor.setModelLanguage(model, 'typescript')
                  } else {
                    monaco.editor.createModel(file.code, 'typescript', uri)
                  }
                })

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
                  // Focus the source editor when selecting a node in the AST
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
  header,
  children,
}: {
  title: string
  header?: React.ReactNode
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          alignItems: 'center',
          minHeight: '40px',
          padding: 'var(--space-1)',
          gap: 'var(--space-2)',
        }}
      >
        <h2>{title}</h2> {header}
      </div>
      {children}
    </div>
  )
}
