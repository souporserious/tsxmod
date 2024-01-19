import { ImportClause, SourceFile } from 'ts-morph'
import { getImportDeclaration } from './getImportDeclaration'

/**
 * Gets an import clause by its module and default import name.
 *
 * @example
 * const importClause = getImportClause(sourceFile, 'react', 'React')
 */

export function getImportClause(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  importClause: string
): ImportClause | undefined {
  const importDeclaration = getImportDeclaration(sourceFile, moduleSpecifier)

  if (!importDeclaration) {
    return
  }

  const importDeclarationClause = importDeclaration.getImportClause()

  if (importDeclarationClause?.getDefaultImport()?.getText() === importClause) {
    return importDeclarationClause
  }
}
