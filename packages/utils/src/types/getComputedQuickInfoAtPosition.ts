import type { SourceFile } from 'ts-morph'
import { addComputedTypes } from './addComputedTypes'

/**
 * Get the computed quick info at a position in a source file.
 * Note, this will modify the source file by adding computed types.
 */
export function getComputedQuickInfoAtPosition(
  sourceFile: SourceFile,
  position: number
) {
  const languageService = sourceFile
    .getProject()
    .getLanguageService().compilerObject
  const fileName = sourceFile.getBaseName()
  const node = sourceFile.getDescendantAtPos(position)

  if (!node) {
    return undefined
  }

  addComputedTypes(sourceFile)

  return languageService.getQuickInfoAtPosition(fileName, node.getStart())
}
