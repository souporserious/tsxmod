import { Project, ts } from 'ts-morph'

/**
 * Find all references for a named import.
 *
 * @example
 * const references = findNamedImportReferences(project, 'package', 'Stack')
 */
export function findNamedImportReferences(
  project: Project,
  moduleSpecifierValue: string,
  namedImportName: string
) {
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

            return identifier.findReferencesAsNodes()
          }
        }
      }
    }
  }

  return []
}
