import { CallExpression } from 'ts-morph'
import { Node } from 'ts-morph'
import { isForwardRefExpression } from './isForwardRefExpression'

/** Returns a functional component declaration, unwrapping forwardRef if needed. */
export function getFunctionComponentDeclaration(
  declaration: Node
): Node | null {
  if (Node.isVariableDeclaration(declaration)) {
    const name = declaration.getName()
    const initializer = declaration.getInitializer()

    if (/[A-Z]/.test(name.charAt(0))) {
      /**
       * If we're dealing with a 'forwardRef' call we take the first argument of
       * the function since that is the component declaration.
       */
      if (initializer && isForwardRefExpression(initializer)) {
        const callExpression = initializer as CallExpression
        const [declaration] = callExpression.getArguments()

        return declaration
      }

      return declaration
    }
  }

  if (Node.isFunctionDeclaration(declaration)) {
    const name = declaration.getName()

    if (name && /[A-Z]/.test(name.charAt(0))) {
      return declaration
    }
  }

  return null
}
