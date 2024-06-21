import type { Expression } from 'ts-morph'
import { Node } from 'ts-morph'

import { resolveObjectLiteralExpression } from './resolveObjectLiteralExpression'

export type LiteralExpressionValue =
  | null
  | boolean
  | number
  | string
  | Record<string, any>
  | LiteralExpressionValue[]

const EMPTY_LITERAL_EXPRESSION_VALUE = Symbol('EMPTY_LITERAL_EXPRESSION_VALUE')

/** Recursively resolves an expression into a literal value. */
export function resolveLiteralExpression(
  expression: Expression
): LiteralExpressionValue | LiteralExpressionValue[] | Symbol {
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

  if (
    Node.isStringLiteral(expression) ||
    Node.isNoSubstitutionTemplateLiteral(expression)
  ) {
    return expression.getLiteralText()
  }

  if (Node.isObjectLiteralExpression(expression)) {
    return resolveObjectLiteralExpression(expression)
  }

  if (Node.isArrayLiteralExpression(expression)) {
    return expression.getElements().map((element) => {
      return resolveLiteralExpression(element)
    })
  }

  if (Node.isIdentifier(expression)) {
    let initializer

    for (const node of expression.getDefinitionNodes()) {
      if (Node.isVariableDeclaration(node)) {
        initializer = node.getInitializer()

        if (initializer) {
          return resolveLiteralExpression(initializer)
        }
      }
    }
  }

  if (Node.isSpreadElement(expression) || Node.isAsExpression(expression)) {
    return resolveLiteralExpression(expression.getExpression())
  }

  return EMPTY_LITERAL_EXPRESSION_VALUE
}

/** Determines when a value was resolved in `resolveLiteralExpression`. */
export function isLiteralExpressionValue(
  value: ReturnType<typeof resolveLiteralExpression>
): value is LiteralExpressionValue | LiteralExpressionValue[] {
  return value !== EMPTY_LITERAL_EXPRESSION_VALUE
}
