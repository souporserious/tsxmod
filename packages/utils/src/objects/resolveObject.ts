import type { ObjectLiteralExpression } from 'ts-morph'
import { Node } from 'ts-morph'
import { resolveLiteralExpression } from '../expressions/resolveLiteralExpression'

/** Resolves an object literal expression to a plain object. */
export function resolveObject(expression: ObjectLiteralExpression) {
  let object: Record<string, any> = {}

  for (const property of expression.getProperties()) {
    if (Node.isPropertyAssignment(property)) {
      object[property.getName()] = resolveLiteralExpression(
        property.getInitializerOrThrow()
      )
    }

    if (Node.isSpreadAssignment(property)) {
      const spreadExpression = property.getExpression()

      Object.assign(object, resolveLiteralExpression(spreadExpression))
    }
  }

  return object
}
