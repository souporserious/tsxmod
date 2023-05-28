import type { PropertySignature } from 'ts-morph'
import { Node, TypeFormatFlags } from 'ts-morph'
import { getDefaultValuesFromProperties } from '../properties'

/** Gets the prop types for a component declaration. */
export function getPropTypes(declaration: Node) {
  const signatures = declaration.getType().getCallSignatures()

  if (signatures.length === 0) {
    return null
  }

  const [propsSignature] = signatures
  const [props] = propsSignature.getParameters()

  if (props) {
    const valueDeclaration = props.getValueDeclaration()

    if (!valueDeclaration) {
      return null
    }

    const propsType = declaration
      .getProject()
      .getTypeChecker()
      .getTypeOfSymbolAtLocation(props, valueDeclaration)
    const firstChild = valueDeclaration.getFirstChild()
    let defaultValues: ReturnType<typeof getDefaultValuesFromProperties> = {}

    if (Node.isObjectBindingPattern(firstChild)) {
      defaultValues = getDefaultValuesFromProperties(firstChild.getElements())
    }

    return propsType
      .getApparentProperties()
      .map((prop) => {
        const declarations = prop.getDeclarations()
        const propDeclaration = declarations[0] as PropertySignature

        if (
          (propDeclaration || declaration)
            .getSourceFile()
            .getFilePath()
            .includes('node_modules')
        ) {
          return null
        }

        const propName = prop.getName()
        const propType = prop.getTypeAtLocation(declaration)
        const description = prop
          .getDeclarations()
          .filter(Node.isJSDocable)
          .map((declaration) =>
            declaration
              .getJsDocs()
              .map((doc) => doc.getComment())
              .flat()
          )
          .join('\n')
        const defaultValue = defaultValues[propName]

        return {
          name: propName,
          required: !propDeclaration?.hasQuestionToken() && !defaultValue,
          description: description || null,
          type: propType.getText(
            declaration,
            TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
          ),
          defaultValue,
        }
      })
      .filter(Boolean)
  }

  return null
}
