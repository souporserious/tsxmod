import type { SourceFile, ts } from 'ts-morph'
import { addComputedTypes } from './addComputedTypes'

/**
 * Get the computed quick info at a position in a source file.
 * Note, this will modify the source file by adding computed types.
 */
export function getComputedQuickInfoAtPosition(
  sourceFile: SourceFile,
  position: number
): ts.QuickInfo | undefined {
  const languageService = sourceFile
    .getProject()
    .getLanguageService().compilerObject
  const node = sourceFile.getDescendantAtPos(position)

  if (!node) {
    return undefined
  }

  addComputedTypes(sourceFile)

  return languageService.getQuickInfoAtPosition(
    sourceFile.getFilePath(),
    node.getStart()
  )
}
