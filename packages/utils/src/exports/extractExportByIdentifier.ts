import type { SourceFile } from 'ts-morph'
import { Node, ts } from 'ts-morph'

/** Extract a single export and its local dependencies from a source file. */
export function extractExportByIdentifier(
  sourceFile: SourceFile,
  identifier: string
) {
  /** Remove named exports: export { useHover } from 'hooks' */
  sourceFile.getExportDeclarations().forEach((declaration) => {
    declaration.remove()
  })

  /** Collect remaining exports and remove any declarations that don't have references. */
  sourceFile.getExportedDeclarations().forEach((declarations) => {
    declarations.forEach((declaration) => {
      if (Node.isSourceFile(declaration) || Node.isExpression(declaration)) {
        return
      }

      const exportIdentifier = declaration.getFirstDescendantByKind(
        ts.SyntaxKind.Identifier
      )!

      if (exportIdentifier.getText() !== identifier) {
        // TODO: we need a findReferencesInSourceFile() helper
        const references = exportIdentifier.findReferences()

        if (references.length <= 1) {
          declaration.remove()
        }
      }
    })
  })

  /** Finally, fix missing references until we have an equal result. */
  let lastFullText

  while (lastFullText !== sourceFile.getFullText()) {
    lastFullText = sourceFile.getFullText()
    sourceFile.fixUnusedIdentifiers()
  }

  return lastFullText.trim()
}
