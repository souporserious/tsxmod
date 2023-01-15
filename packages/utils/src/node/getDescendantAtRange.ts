import type { Node, SourceFile } from 'ts-morph'
import { SyntaxKind } from 'ts-morph'
import { TreeMode, getChildrenFunction } from './getChildrenFunction'

/**
 * Get a descendant node between a start and end range.
 *
 * @citation
 * Forked from [ts-ast-viewer](https://github.com/dsherret/ts-ast-viewer/blob/main/site/src/compiler/getDescendantAtRange.ts)
 */
export function getDescendantAtRange(
  sourceFile: SourceFile,
  range: [number, number],
  mode: keyof typeof TreeMode = TreeMode.forEachChild
): Node {
  const getChildren = getChildrenFunction(mode)
  let bestMatch: { node: Node; start: number } = {
    node: sourceFile,
    start: sourceFile.getStart(),
  }

  searchDescendants(sourceFile)

  return bestMatch.node

  function searchDescendants(node: Node) {
    for (const child of getChildren(node)) {
      if (child.getKind() !== SyntaxKind.SyntaxList) {
        if (isBeforeRange(child.getEnd())) {
          continue
        }

        const childStart = child.getStart()

        if (isAfterRange(childStart)) {
          return
        }

        const isEndOfFileToken = child.getKind() === SyntaxKind.EndOfFileToken

        if (!isEndOfFileToken && !hasSameStart(child)) {
          bestMatch = { node: child, start: childStart }
        }
      }

      searchDescendants(child)
    }
  }

  function hasSameStart(node: Node) {
    return bestMatch.start === node.getStart() && range[0] === node.getStart()
  }

  function isBeforeRange(position: number) {
    return position < range[0]
  }

  function isAfterRange(nodeEnd: number) {
    return nodeEnd >= range[0] && nodeEnd > range[1]
  }
}
