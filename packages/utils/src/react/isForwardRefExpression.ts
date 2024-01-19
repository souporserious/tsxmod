import type { CallExpression } from 'ts-morph'
import { Node } from 'ts-morph'

/** Determines if an expression is using React.forwardRef. */
export function isForwardRefExpression(node: Node): node is CallExpression {
  if (Node.isCallExpression(node)) {
    const expression = node.getExpression()

    /**
     * forwardRef(() => <Component />)
     */
    if (
      Node.isIdentifier(expression) &&
      expression.getText() === 'forwardRef'
    ) {
      return true
    }

    /**
     * React.forwardRef(() => <Component />)
     */
    if (
      Node.isPropertyAccessExpression(expression) &&
      expression.getText() === 'React.forwardRef'
    ) {
      return true
    }
  }

  return false
}
