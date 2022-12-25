import type { Identifier, SourceFile } from 'ts-morph'

/** Find all references for an identifier in the file it is defined in or another source file. */
export function findReferencesInSourceFile(
  identifier: Identifier,
  sourceFile?: SourceFile
) {
  const references = identifier.findReferencesAsNodes()
  const identifierSourceFile = identifier.getSourceFile()

  return references.filter((reference) => {
    return reference.getSourceFile() === (sourceFile || identifierSourceFile)
  })
}
