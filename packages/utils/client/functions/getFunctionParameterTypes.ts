import type { FunctionDeclaration, Symbol, Type } from 'ts-morph'
import { Node, TypeFormatFlags } from 'ts-morph'

/** Get the parameter types for a function declaration. */
export function getFunctionParameterTypes(declaration: FunctionDeclaration) {
  const types = declaration.getParameters().map((parameter) => {
    const parameterName = parameter.getName()
    const parameterType = parameter.getType()
    const parameterTypeNode = parameter.getTypeNode()
    const kindName = parameterTypeNode?.getKindName()
    const typeText = parameterType.getText(
      declaration,
      TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
    )
    let name: string | null = typeText

    if (kindName === 'TypeReference') {
      name = typeText
    } else if (parameterName.startsWith('__')) {
      name = null
    }

    return {
      name,
      type:
        kindName === 'TypeLiteral' || kindName === 'TypeReference'
          ? parseType(declaration, parameterType)
          : typeText,
    }
  })

  return types.filter(Boolean)
}

function parseType(declaration: Node, type: Type) {
  const apparentProperties = type.getApparentProperties()

  if (apparentProperties.length > 0) {
    return apparentProperties
      .flatMap((property) => getPropertyType(declaration, property))
      .filter(Boolean)
  }

  return type.getApparentType().getText()
}

function getPropertyType(declaration: Node, property: Symbol) {
  const propertyDeclarations = property.getDeclarations()

  return propertyDeclarations.flatMap((propertyDeclaration) => {
    if (
      propertyDeclaration === undefined ||
      propertyDeclaration.getSourceFile().getFilePath().includes('node_modules')
    ) {
      return null
    }

    if (propertyDeclaration) {
      const [comment] = property
        .getDeclarations()
        .filter(Node.isJSDocable)
        .map((declaration) =>
          declaration
            .getJsDocs()
            .map((doc) => doc.getComment())
            .flat()
            .join('\n')
        )

      return {
        name: property.getName(),
        type: property.getTypeAtLocation(declaration).getText(),
        comment: comment ?? null,
      }
    }

    return null
  })
}
