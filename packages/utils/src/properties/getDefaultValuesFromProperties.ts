import {
  BindingElement,
  MethodSignature,
  Node,
  ParameterDeclaration,
  PropertyAssignment,
  PropertyDeclaration,
  PropertySignature,
  type Expression,
} from 'ts-morph'

import {
  resolveLiteralExpression,
  isLiteralExpressionValue,
  LiteralExpressionValue,
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
      defaultValues[name] = getInitializerValue(initializer)
    } else if (Node.isParameterDeclaration(property)) {
      const bindingPattern = property.getNameNode()

      if (Node.isObjectBindingPattern(bindingPattern)) {
        bindingPattern.getElements().forEach((element) => {
          const elementName = element.getName()
          const elementInitializer = element.getInitializer()

          if (elementInitializer) {
            defaultValues[elementName] = getInitializerValue(elementInitializer)
          }
        })
      }
    }
  })

  return defaultValues
}

function getInitializerValue(initializer: Expression) {
  const resolvedValue = resolveLiteralExpression(initializer)

  return isLiteralExpressionValue(resolvedValue)
    ? resolvedValue
    : initializer.getType().getLiteralValue() ?? initializer.getText()
}
