import * as React from 'react'
import type { ComponentProps } from 'react'
import type { editor, IDisposable } from 'monaco-editor'
import type { Monaco } from '@monaco-editor/react'
import MonacoEditor from '@monaco-editor/react'

import { fetchTypes } from '../utils/fetch-types'
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
  occurrencesHighlight: false,
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
  const monacoRef = React.useRef<Monaco | null>(null)
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null)
  const eventDisposables = React.useRef<IDisposable[]>([])
  const decorationsRef = React.useRef([])
  const [isMounting, setIsMounting] = React.useState(true)
  const handleMount = React.useCallback<
    ComponentProps<typeof MonacoEditor>['onMount']
  >((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

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

  /** Dispose events on unmount */
  React.useEffect(() => {
    return () => {
      eventDisposables.current.forEach((disposable) => disposable.dispose())
    }
  }, [])

  /**
   * Fetch types based on editor value.
   * TODO: optimize to only use one ata instance
   */
  React.useEffect(() => {
    fetchTypes(props.value).then((types) => {
      types.forEach((type) => {
        monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
          type.code,
          type.path
        )
      })

      /** Add TSXMOD utility types manually. */
      fetch('tsxmod-utils.d.ts')
        .then((respsone) => respsone.text())
        .then((text) => {
          monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
            text,
            'file:///node_modules/tsxmod/utils/index.d.ts'
          )
        })
    })
  }, [props.value])

  React.useEffect(() => {
    if (isMounting || !decorations) return

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      decorations.map((decoration) => ({
        range: new monacoRef.current.Range(
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
      theme="dark-theme"
      beforeMount={initializeMonaco}
      options={{ ...defaultMonacoOptions, ...props.options }}
      onMount={handleMount}
    />
  )
}
