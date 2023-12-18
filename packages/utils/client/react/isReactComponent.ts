import { Node } from 'ts-morph'
import { isJsxComponent } from '../jsx/isJsxComponent'
import { isReactClassComponent } from './isReactClassComponent'

/** Determines if a node is a React component. */
export function isReactComponent(node: Node): boolean {
  if (Node.isVariableDeclaration(node)) {
    const initializer = node.getInitializer()

    if (
      Node.isFunctionDeclaration(initializer) ||
      Node.isFunctionExpression(initializer) ||
      Node.isArrowFunction(initializer)
    ) {
      return isJsxComponent(initializer)
    }
  }

  if (
    Node.isFunctionDeclaration(node) ||
    Node.isFunctionExpression(node) ||
    Node.isArrowFunction(node)
  ) {
    return isJsxComponent(node)
  }

  if (Node.isClassDeclaration(node)) {
    return isReactClassComponent(node)
  }

  return false
}
