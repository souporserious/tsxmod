import {
  Node,
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
} from 'ts-morph'
import { isJsxComponent } from '../jsx/isJsxComponent'
import { isForwardRefExpression } from './isForwardRefExpression'

/** Returns a functional component declaration, unwrapping forwardRef if needed. */
export function getReactFunctionDeclaration(
  declaration: Node
): ArrowFunction | FunctionDeclaration | FunctionExpression | null {
  if (Node.isFunctionDeclaration(declaration)) {
    if (isJsxComponent(declaration)) {
      return declaration
    }
  }

  if (Node.isVariableDeclaration(declaration)) {
    const initializer = declaration.getInitializer()

    if (isForwardRefExpression(initializer)) {
      const [declaration] = initializer.getArguments()
      if (
        Node.isFunctionDeclaration(declaration) ||
        Node.isFunctionExpression(declaration) ||
        Node.isArrowFunction(declaration)
      ) {
        return declaration
      }
    } else if (
      Node.isFunctionDeclaration(initializer) ||
      Node.isFunctionExpression(initializer) ||
      Node.isArrowFunction(initializer)
    ) {
      if (isJsxComponent(initializer)) {
        return initializer
      }
    }
  }

  return null
}
