import type {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
} from 'ts-morph'
import { Node, SyntaxKind } from 'ts-morph'

/** Determines if a function node is a JSX component. */
export function isJsxComponent(
  node: ArrowFunction | FunctionDeclaration | FunctionExpression
): boolean {
  // Check if the function name (if present) starts with a capital letter
  let name: string | undefined

  if (Node.isFunctionDeclaration(node)) {
    name = node.getName()
  } else if (Node.isFunctionExpression(node) || Node.isArrowFunction(node)) {
    // For arrow functions, check the variable name they are assigned to, if any
    const variableDeclaration = node.getFirstAncestorByKind(
      SyntaxKind.VariableDeclaration
    )
    name = variableDeclaration?.getName()
  }

  if (!name || name[0] !== name[0].toUpperCase()) {
    return false
  }

  const returnType = node.getReturnType()

  if (returnType.getText().includes('JSX.Element')) {
    return true
  }

  const jsxElement = node.getFirstDescendantByKind(SyntaxKind.JsxElement)

  return !jsxElement && returnType.getCallSignatures().length === 0
}
