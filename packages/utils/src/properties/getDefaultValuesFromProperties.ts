import type {
  BindingElement,
  MethodSignature,
  ParameterDeclaration,
  PropertyAssignment,
  PropertyDeclaration,
  PropertySignature,
} from 'ts-morph'
import { Node } from 'ts-morph'

import {
  resolveLiteralExpression,
  isLiteralExpressionValue,
  type LiteralExpressionValue,
} from '../expressions'

export function getDefaultValueKey(
  property:
    | BindingElement
    | ParameterDeclaration
    | PropertyDeclaration
    | PropertyAssignment
    | PropertySignature
    | MethodSignature
) {
  return Node.isBindingElement(property)
    ? property.getPropertyNameNode()?.getText() || property.getName()
    : property.getName()
}

/** Gets the default values for a set of properties. */
export function getDefaultValuesFromProperties(
  properties: Array<
    | BindingElement
    | ParameterDeclaration
    | PropertyDeclaration
    | PropertyAssignment
    | PropertySignature
    | MethodSignature
  >
) {
  const defaultValues: Record<string, LiteralExpressionValue> = {}

  properties.forEach((property) => {
    if (
      Node.isSpreadAssignment(property) ||
      Node.isMethodSignature(property) ||
      !property.getNameNode()
    ) {
      return
    }

    const name = getDefaultValueKey(property)
    const kindName = property.getKindName()

    if (!('getInitializer' in property)) {
      throw new Error(
        `[getDefaultValuesFromProperties] Property "${name}" of kind "${kindName}" does not have an initializer, so it cannot have a default value. This declaration should be filtered or file an issue for support.`
      )
    }

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
