import { Node, SyntaxKind } from 'ts-morph'

/** Determines if a node is a JSX component. */
export function isJsxComponent(node: Node): boolean {
  let name: string | undefined

  if (
    Node.isFunctionDeclaration(node) ||
    Node.isFunctionExpression(node) ||
    Node.isArrowFunction(node) ||
    Node.isClassDeclaration(node)
  ) {
    if (Node.isFunctionDeclaration(node) || Node.isClassDeclaration(node)) {
      name = node.getName()
    } else if (Node.isFunctionExpression(node) || Node.isArrowFunction(node)) {
      const variableDeclaration = node.getFirstAncestorByKind(
        SyntaxKind.VariableDeclaration
      )
      name = variableDeclaration?.getName()
    }

    return name ? /[A-Z]/.test(name.charAt(0)) : false
  }

  return false
}
