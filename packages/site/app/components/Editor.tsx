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
} as editor.IEditorConstructionOptions

export function Editor({
  onCursorChange,
  onMount,
  ...props
}: {
  onCursorChange?: (selection: {
    start: PositionAndOffset
    end: PositionAndOffset
  }) => any
} & ComponentProps<typeof MonacoEditor>) {
  const monacoRef = React.useRef<Monaco | null>(null)
  const eventDisposables = React.useRef<IDisposable[]>([])
  const handleMount = React.useCallback<
    ComponentProps<typeof MonacoEditor>['onMount']
  >((editor, monaco) => {
    monacoRef.current = monaco

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
          end: { ...endPosition, offset: endOffset },
        })
      })
    )

    onMount?.(editor, monaco)
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
    })
  }, [props.value])

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
