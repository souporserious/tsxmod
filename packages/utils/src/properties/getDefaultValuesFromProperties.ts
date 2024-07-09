import {
  BindingElement,
  Expression,
  MethodSignature,
  Node,
  ParameterDeclaration,
  PropertyAssignment,
  PropertyDeclaration,
  PropertySignature,
  VariableDeclaration,
} from 'ts-morph'

import {
  resolveLiteralExpression,
  isLiteralExpressionValue,
  LiteralExpressionValue,
} from '../expressions'

/** Gets the key for a default value property. */
export function getDefaultValueKey(
  property:
    | BindingElement
    | ParameterDeclaration
    | PropertyDeclaration
    | PropertyAssignment
    | PropertySignature
    | MethodSignature
) {
  if (Node.isBindingElement(property)) {
    const propertyNameNode = property.getPropertyNameNode()

    if (propertyNameNode) {
      return propertyNameNode.getText()
    }
  }

  return property.getName()
}

/** Gets the default value for a single property. */
export function getDefaultValuesFromProperty(
  property:
    | BindingElement
    | ParameterDeclaration
    | PropertyDeclaration
    | PropertyAssignment
    | PropertySignature
    | MethodSignature
): Record<string, LiteralExpressionValue> {
  const defaultValues: Record<string, LiteralExpressionValue> = {}

  if (Node.isSpreadAssignment(property) || Node.isMethodSignature(property)) {
    return defaultValues
  }

  const nameNode = property.getNameNode()

  if (!nameNode) {
    return defaultValues
  }

  const name = getDefaultValueKey(property)
  const kindName = property.getKindName()

  if (!('getInitializer' in property)) {
    throw new Error(
      `[getDefaultValuesFromProperty] Property "${name}" of kind "${kindName}" does not have an initializer, so it cannot have a default value. This declaration should be filtered or file an issue for support.`
    )
  }

  const initializer = property.getInitializer()

  if (initializer) {
    defaultValues[name] = getInitializerValue(initializer)
  } else if (Node.isParameterDeclaration(property)) {
    if (Node.isObjectBindingPattern(nameNode)) {
      nameNode.getElements().forEach((element) => {
        const elementName = element.getName()
        const elementInitializer = element.getInitializer()

        if (elementInitializer) {
          defaultValues[elementName] = getInitializerValue(elementInitializer)
        }
      })
    } else if (Node.isIdentifier(nameNode)) {
      const references = property
        .findReferencesAsNodes()
        .map((reference) => reference.getParentOrThrow())
        .filter((reference) =>
          Node.isVariableDeclaration(reference)
        ) as VariableDeclaration[]

      references.forEach((reference) => {
        const referenceNameNode = reference.getNameNode()

        if (Node.isObjectBindingPattern(referenceNameNode)) {
          referenceNameNode.getElements().forEach((element) => {
            const elementName = element.getName()
            const elementInitializer = element.getInitializer()

            if (elementInitializer) {
              defaultValues[elementName] =
                getInitializerValue(elementInitializer)
            }
          })
        }
      })
    }
  }

  return defaultValues
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
    const propertyDefaults = getDefaultValuesFromProperty(property)
    Object.assign(defaultValues, propertyDefaults)
  })

  return defaultValues
}

/** Gets the value of an initializer expression. */
function getInitializerValue(initializer: Expression) {
  const resolvedValue = resolveLiteralExpression(initializer)

  return isLiteralExpressionValue(resolvedValue)
    ? resolvedValue
    : initializer.getType().getLiteralValue() ?? initializer.getText()
}
