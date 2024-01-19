import type {
  VariableDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunction,
  ClassDeclaration,
} from 'ts-morph'
import { Node, SyntaxKind } from 'ts-morph'

/** Determines if a node is a JSX component. */
export function isJsxComponent(
  node: Node
): node is
  | VariableDeclaration
  | FunctionDeclaration
  | FunctionExpression
  | ArrowFunction
  | ClassDeclaration {
  let name: string | undefined

  if (
    Node.isVariableDeclaration(node) ||
    Node.isFunctionDeclaration(node) ||
    Node.isClassDeclaration(node)
  ) {
    name = node.getName()
  } else if (Node.isFunctionExpression(node) || Node.isArrowFunction(node)) {
    const variableDeclaration = node.getFirstAncestorByKind(
      SyntaxKind.VariableDeclaration
    )
    name = variableDeclaration?.getName()
  }

  return name ? /[A-Z]/.test(name.charAt(0)) : false
}
