import type {
  BindingElement,
  ParameterDeclaration,
  PropertyAssignment,
} from 'ts-morph'
import { Node } from 'ts-morph'

/** Gets the default values for a set of properties. */
export function getDefaultValuesFromProperties(
  properties: Array<BindingElement | ParameterDeclaration | PropertyAssignment>
) {
  const defaultValues: Record<string, string | boolean | number | null> = {}

  properties.forEach((property) => {
    if (Node.isSpreadAssignment(property) || !property.getName()) {
      return
    }

    const name = property.getName()
    const initializer = property.getInitializer()

    if (initializer) {
      defaultValues[name] = initializer.getText()
    }
  })

  return defaultValues
}
