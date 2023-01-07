import { Node } from 'ts-morph'

/** Finds the closest component declaration to a node. */
export function findClosestComponentDeclaration(node: Node) {
  const componentDeclaration = node.getFirstAncestor((node) => {
    return Node.isFunctionDeclaration(node) || Node.isVariableDeclaration(node)
  })

  if (Node.isFunctionDeclaration(componentDeclaration)) {
    return componentDeclaration
  }

  if (Node.isVariableDeclaration(componentDeclaration)) {
    const variableDeclarationInitializer = componentDeclaration.getInitializer()

    if (
      Node.isArrowFunction(variableDeclarationInitializer) ||
      Node.isFunctionExpression(variableDeclarationInitializer)
    ) {
      return componentDeclaration
    }
  }
}
