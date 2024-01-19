import type { Expression } from 'ts-morph'
import { Node } from 'ts-morph'

type ExpressionValue =
  | null
  | boolean
  | number
  | string
  | Record<string, any>
  | ExpressionValue[]

/** Recursively resolves an expression into a literal value. */
export function resolveExpression(
  expression: Expression
): ExpressionValue | ExpressionValue[] {
  if (Node.isNullLiteral(expression)) {
    return null
  }

  if (Node.isFalseLiteral(expression)) {
    return false
  }

  if (Node.isTrueLiteral(expression)) {
    return true
  }

  if (Node.isNumericLiteral(expression)) {
    return expression.getLiteralValue()
  }

  if (Node.isStringLiteral(expression)) {
    return expression.getLiteralText()
  }

  if (Node.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.getLiteralText()
  }

  if (Node.isObjectLiteralExpression(expression)) {
    let object: Record<string, any> = {}

    for (const property of expression.getProperties()) {
      if (Node.isPropertyAssignment(property)) {
        object[property.getName()] = resolveExpression(
          property.getInitializerOrThrow()
        )
      }

      if (Node.isSpreadAssignment(property)) {
        const spreadExpression = property.getExpression()

        Object.assign(object, resolveExpression(spreadExpression))
      }
    }

    return object
  }

  if (Node.isArrayLiteralExpression(expression)) {
    return expression.getElements().map((element) => {
      return resolveExpression(element)
    })
  }

  if (Node.isIdentifier(expression)) {
    let initializer

    for (const node of expression.getDefinitionNodes()) {
      if (Node.isVariableDeclaration(node)) {
        initializer = node.getInitializer()

        if (initializer) {
          return resolveExpression(initializer)
        }
      }
    }
  }

  if (Node.isSpreadElement(expression)) {
    return resolveExpression(expression.getExpression())
  }

  throw new Error(`Unsupported expression: ${expression.getText()}`)
}
