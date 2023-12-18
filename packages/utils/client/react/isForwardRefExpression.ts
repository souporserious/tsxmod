import { Node } from 'ts-morph'

/** Determines if an expression is using React.forwardRef. */
export function isForwardRefExpression(initializer: Node | undefined) {
  if (Node.isCallExpression(initializer)) {
    const expression = initializer.getExpression()

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
