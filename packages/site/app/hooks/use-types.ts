import * as React from 'react'
import type { Monaco } from '@monaco-editor/react'
import { setupTypeAcquisition } from '@typescript/ata'
import { Project, ts } from 'tsxmod/ts-morph'
import { effect, signal } from '@preact/signals-core'
import { create } from 'mutative'

/** Type definitions for the current project. */
export const types = signal<{ code: string; path: string }[]>([])

const ata = setupTypeAcquisition({
  projectName: 'tsxmod',
  typescript: ts,
  delegate: {
    receivedFile: (code: string, path: string) => {
      types.value = create(types.value, (draft) => {
        draft.push({ code, path: `file:///${path}` })
      })
    },
  },
})

/** Fetches the types for a string of code based on the import declarations. */
export function useTypes(monaco: Monaco | null, code: string) {
  React.useEffect(() => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('index.ts', code)
    const moduleImportDeclarations = sourceFile.getImportDeclarations()

    moduleImportDeclarations.forEach((moduleImportDeclaration) => {
      const importdeclarationString = moduleImportDeclaration.getText()

      /** Skip TSXMOD imports since they are loaded from the public folder below. */
      if (importdeclarationString.includes('tsxmod')) return

      ata(importdeclarationString)
    })
  }, [code])

  React.useEffect(() => {
    if (monaco === null) return

    /** Add TSXMOD utility types manually. */
    fetch('tsxmod-utils.d.ts')
      .then((respsone) => respsone.text())
      .then((text) => {
        types.value = create(types.value, (draft) => {
          draft.push({
            code: text,
            path: 'file:///node_modules/tsxmod/utils/index.d.ts',
          })
        })
      })

    /** Load types into the editor as they are downloaded. */
    return effect(() => {
      types.value.forEach((type) => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          type.code,
          type.path
        )
      })
    })
  }, [monaco])
}
