import { wireTmGrammars } from 'monaco-editor-textmate'
import { Registry } from 'monaco-textmate'
import { loadWASM } from 'onigasm'

import defineTheme from './define-theme'
import theme from './theme.json'

export async function initializeMonaco(monaco: typeof import('monaco-editor')) {
  try {
    await loadWASM('/onigasm.wasm')
  } catch {
    // try/catch prevents onigasm from erroring on fast refreshes
  }

  const registry = new Registry({
    // @ts-ignore
    getGrammarDefinition: async (scopeName) => {
      switch (scopeName) {
        case 'source.js':
          return {
            format: 'json',
            content: await (await fetch('/javascript.tmLanguage.json')).text(),
          }
        case 'source.jsx':
          return {
            format: 'json',
            content: await (await fetch('/jsx.tmLanguage.json')).text(),
          }
        case 'source.ts':
          return {
            format: 'json',
            content: await (await fetch('/typescript.tmLanguage.json')).text(),
          }
        case 'source.tsx':
          return {
            format: 'json',
            content: await (await fetch('/tsx.tmLanguage.json')).text(),
          }
        default:
          return null
      }
    },
  })

  const grammars = new Map()

  grammars.set('javascript', 'source.jsx')
  grammars.set('typescript', 'source.tsx')

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.Preserve,
    esModuleInterop: true,
  })

  /* Convert VS Code theme to Monaco theme */
  defineTheme(monaco, theme)

  /* Wire up TextMate grammars */
  await wireTmGrammars(monaco, registry, grammars)
}
