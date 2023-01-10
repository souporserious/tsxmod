import * as React from 'react'
import type { ComponentProps } from 'react'
import type { Monaco } from '@monaco-editor/react'
import MonacoEditor from '@monaco-editor/react'

import { fetchTypes } from '../utils/fetch-types'
import { initializeMonaco } from '../utils/initialize-monaco'

export function Editor(props: ComponentProps<typeof MonacoEditor>) {
  const monacoRef = React.useRef<Monaco | null>(null)
  const handleMount = React.useCallback((_, monaco) => {
    monacoRef.current = monaco
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
