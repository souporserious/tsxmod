import { Node, SyntaxKind } from 'ts-morph'
import { findClosestComponentDeclaration } from './findClosestComponentDeclaration'
import { findReferencesAsJsxElements } from './findReferencesAsJsxElements'

/** Traces component references to the root component. */
export function findRootComponentReferences(node: Node): Node[] {
  const findReferences = (_node: Node, _allNodes: Node[] = []): Node[] => {
    const closestComponentIdentifier = findClosestComponentDeclaration(
      _node
    )?.getFirstDescendantByKind(SyntaxKind.Identifier)

    if (!closestComponentIdentifier) {
      return _allNodes
    }

    const elementReferences = findReferencesAsJsxElements(
      closestComponentIdentifier
    )

    if (elementReferences.length > 0) {
      return elementReferences.flatMap((reference) =>
        findReferences(reference, _allNodes)
      )
    }

    _allNodes.push(closestComponentIdentifier)

    return _allNodes
  }
  const allReferences = findReferences(node)

  return Array.from(new Set(allReferences))
}
