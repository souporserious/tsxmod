import { Node } from 'ts-morph'

/** Finds the closest component declaration starting from a node. */
export function findClosestComponentDeclaration(node: Node) {
  if (Node.isFunctionDeclaration(node) || Node.isVariableDeclaration(node)) {
    return node
  }

  return node.getFirstAncestor((node) => {
    return Node.isFunctionDeclaration(node) || Node.isVariableDeclaration(node)
  })
}
