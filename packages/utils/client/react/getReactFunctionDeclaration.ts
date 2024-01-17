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
  if (isJsxComponent(declaration)) {
    if (Node.isFunctionDeclaration(declaration)) {
      return declaration
    }

    if (Node.isVariableDeclaration(declaration)) {
      const initializer = declaration.getInitializer()

      if (initializer) {
        if (isForwardRefExpression(initializer)) {
          const [initializerDeclaration] = initializer.getArguments()
          if (
            Node.isFunctionDeclaration(initializerDeclaration) ||
            Node.isFunctionExpression(initializerDeclaration) ||
            Node.isArrowFunction(initializerDeclaration)
          ) {
            return initializerDeclaration
          }
        } else if (
          Node.isFunctionDeclaration(initializer) ||
          Node.isFunctionExpression(initializer) ||
          Node.isArrowFunction(initializer)
        ) {
          return initializer
        }
      }
    }
  }

  return null
}
