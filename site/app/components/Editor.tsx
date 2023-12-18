import * as React from 'react'
import type { ComponentProps } from 'react'
import type { editor, IDisposable } from 'monaco-editor'
import type { Monaco } from '@monaco-editor/react'
import MonacoEditor from '@monaco-editor/react'

import { useTypes } from '../hooks/use-types'
import { initializeMonaco } from '../utils/initialize-monaco'

type PositionAndOffset = { column: number; lineNumber: number; offset: number }

const defaultMonacoOptions = {
  automaticLayout: true,
  contextmenu: false,
  formatOnPaste: true,
  formatOnType: true,
  folding: false,
  glyphMargin: false,
  minimap: { enabled: false },
  quickSuggestions: false,
  occurrencesHighlight: 'off',
  selectionHighlight: false,
  codeLens: false,
} as editor.IEditorConstructionOptions

export function Editor({
  decorations,
  onCursorChange,
  onMount,
  ...props
}: {
  decorations?: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
    className: string
  }[]
  onCursorChange?: (selection: {
    start: PositionAndOffset
    end: PositionAndOffset
  }) => any
} & ComponentProps<typeof MonacoEditor>) {
  const eventDisposables = React.useRef<IDisposable[]>([])
  const decorationsRef = React.useRef([])
  const [isMounting, setIsMounting] = React.useState(true)
  const [monaco, setMonaco] = React.useState<Monaco | null>(null)
  const [editor, setEditor] =
    React.useState<editor.IStandaloneCodeEditor | null>(null)
  const handleMount = React.useCallback<
    ComponentProps<typeof MonacoEditor>['onMount']
  >((editor, monaco) => {
    setMonaco(monaco)
    setEditor(editor)

    /** Cursor Selection */
    eventDisposables.current.push(
      editor.onDidChangeCursorSelection((event) => {
        const startPosition = event.selection.getStartPosition()
        const endPosition = event.selection.getEndPosition()
        const startOffset = editor.getModel().getOffsetAt(startPosition)
        const endOffset = editor.getModel().getOffsetAt(endPosition)

        onCursorChange?.({
          start: {
            column: startPosition.column,
            lineNumber: startPosition.lineNumber,
            offset: startOffset,
          },
          end: {
            column: endPosition.column,
            lineNumber: endPosition.lineNumber,
            offset: endOffset,
          },
        })
      })
    )

    onMount?.(editor, monaco)

    setIsMounting(false)
  }, [])

  /** Load types into the editor based on the value */
  useTypes(monaco, props.value)

  /** Dispose events on unmount */
  React.useEffect(() => {
    return () => {
      eventDisposables.current.forEach((disposable) => disposable.dispose())
    }
  }, [])

  React.useEffect(() => {
    if (isMounting || !decorations) return

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      decorations.map((decoration) => ({
        range: new monaco.Range(
          decoration.startLineNumber,
          decoration.startColumn,
          decoration.endLineNumber,
          decoration.endColumn
        ),
        options: {
          className: decoration.className,
        },
      }))
    )
  }, [decorations, isMounting])

  return (
    <MonacoEditor
      {...props}
      height="100%"
      language="typescript"
      theme="vs-dark"
      beforeMount={initializeMonaco}
      options={{ ...defaultMonacoOptions, ...props.options }}
      onMount={handleMount}
    />
  )
}
