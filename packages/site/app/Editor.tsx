import * as React from 'react'
import type { ComponentProps } from 'react'
import type { Monaco } from '@monaco-editor/react'
import MonacoEditor from '@monaco-editor/react'

import { fetchTypes } from '../utils/fetch-types'
import { initializeMonaco } from '../utils/initialize-monaco'

export function Editor({
  onCursorChange,
  ...props
}: { onCursorChange?: (position: number) => any } & ComponentProps<
  typeof MonacoEditor
>) {
  const monacoRef = React.useRef<Monaco | null>(null)
  const handleMount = React.useCallback<
    ComponentProps<typeof MonacoEditor>['onMount']
  >((editor, monaco) => {
    monacoRef.current = monaco

    // TODO cleanup events in unmount
    editor.onDidChangeCursorPosition((event) => {
      const offset = editor.getModel().getOffsetAt(event.position)
      onCursorChange?.(offset)
    })
  }, [])

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
      onMount={handleMount}
    />
  )
}
