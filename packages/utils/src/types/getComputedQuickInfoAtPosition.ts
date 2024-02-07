import type { SourceFile, ts } from 'ts-morph'
import { addComputedTypes } from './addComputedTypes'

/**
 * Get the computed quick info at a position in a source file. This is similar to `getQuickInfoAtPosition`
 * using the language service, but it will also flatten types. Note, type source files will be modified
 * using `addComputedTypes`.
 */
export function getComputedQuickInfoAtPosition(
  sourceFile: SourceFile,
  position: number
): ts.QuickInfo | undefined {
  const project = sourceFile.getProject()
  const languageService = project.getLanguageService().compilerObject
  const node = sourceFile.getDescendantAtPos(position)

  if (!node) {
    return undefined
  }

  addComputedTypes(sourceFile)

  const externalSourceFiles = new Set(
    node
      .getType()
      .getApparentProperties()
      .flatMap((prop) =>
        prop
          .getDeclarations()
          .flatMap((declaration) => declaration.getSourceFile().getFilePath())
      )
  )

  for (const externalSourceFilePath of externalSourceFiles) {
    addComputedTypes(project.getSourceFileOrThrow(externalSourceFilePath))
  }

  return languageService.getQuickInfoAtPosition(
    sourceFile.getFilePath(),
    node.getStart()
  )
}
