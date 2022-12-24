import { Project, ReferencedSymbol, ts } from 'ts-morph'

/**
 * Find all references for a named import.
 *
 * @example
 * const references = getReferencesForNamedImport(project, 'package', 'Stack')
 */

export function getReferencesForNamedImport(
  project: Project,
  moduleSpecifierValue: string,
  namedImportName: string
) {
  let references: ReferencedSymbol[] = []

  for (const sourceFile of project.getSourceFiles()) {
    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      if (
        importDeclaration.getModuleSpecifierValue() === moduleSpecifierValue
      ) {
        for (const namedImport of importDeclaration.getNamedImports()) {
          if (namedImport.getName() === namedImportName) {
            const identifier = namedImport.getFirstDescendantByKindOrThrow(
              ts.SyntaxKind.Identifier
            )

            references = identifier.findReferences()

            break
          }
        }
      }
    }
  }

  return references
}
