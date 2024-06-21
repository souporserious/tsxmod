import type {
  BindingElement,
  ParameterDeclaration,
  PropertyAssignment,
} from 'ts-morph'
import { Node } from 'ts-morph'

import {
  resolveLiteralExpression,
  isLiteralExpressionValue,
  type LiteralExpressionValue,
} from '../expressions'

/** Gets the default values for a set of properties. */
export function getDefaultValuesFromProperties(
  properties: Array<BindingElement | ParameterDeclaration | PropertyAssignment>
) {
  const defaultValues: Record<string, LiteralExpressionValue> = {}

  properties.forEach((property) => {
    if (Node.isSpreadAssignment(property) || !property.getNameNode()) {
      return
    }

    const name = Node.isBindingElement(property)
      ? property.getPropertyNameNode()?.getText() || property.getName()
      : property.getName()
    const initializer = property.getInitializer()

    if (initializer) {
      const resolvedValue = resolveLiteralExpression(initializer)

      defaultValues[name] = isLiteralExpressionValue(resolvedValue)
        ? resolvedValue
        : initializer.getType().getLiteralValue() ?? initializer.getText()
    }
  })

  return defaultValues
}
