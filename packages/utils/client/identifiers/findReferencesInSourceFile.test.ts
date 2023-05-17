import { Project, SyntaxKind } from 'ts-morph'
import { findReferencesInSourceFile } from './findReferencesInSourceFile'

test('returns identifier references in same file', () => {
  const project = new Project({ useInMemoryFileSystem: true })

  project.createSourceFile('a.tsx', `export const a = 'foo'`)

  project.createSourceFile('b.tsx', `import { a } from './a'; const b = a`)

  const sourceFile = project.createSourceFile(
    'c.tsx',
    `import { a } from './a'; const c = a`
  )
  const identifier = sourceFile.getFirstDescendantByKindOrThrow(
    SyntaxKind.Identifier
  )
  const references = findReferencesInSourceFile(identifier)

  expect(references).toHaveLength(2)
})
