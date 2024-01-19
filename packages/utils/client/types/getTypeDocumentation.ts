import type {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  TaggedTemplateExpression,
  CallExpression,
  Symbol,
  Type,
  ts,
} from 'ts-morph'
import { Node, SyntaxKind, TypeFormatFlags, TypeChecker } from 'ts-morph'
import { getDefaultValuesFromProperties, getSymbolDescription } from '../index'

/** Analyzes metadata and parameter types from functions, tagged templates, and call expressions. */
export function getTypeDocumentation(
  declaration:
    | ArrowFunction
    | FunctionDeclaration
    | FunctionExpression
    | TaggedTemplateExpression
    | CallExpression
) {
  const signatures = declaration.getType().getCallSignatures()

  if (signatures.length === 0) {
    return null
  }

  // TODO: Handle multiple signatures (overloads)
  const parameters = signatures.at(0)!.getParameters()

  if (parameters.length === 0) {
    return null
  }

  const typeChecker = declaration.getProject().getTypeChecker()
  let parameterTypes: ReturnType<typeof processType>[] = []

  for (const parameter of parameters) {
    const parameterType = processType(parameter, declaration, typeChecker)
    parameterTypes.push(parameterType)
  }

  return parameterTypes
}

/** Processes a signature parameter into a metadata object. */
function processType(
  parameter: Symbol,
  declaration: Node,
  typeChecker: TypeChecker
) {
  const valueDeclaration = parameter.getValueDeclaration()
  const isParameterDeclaration = Node.isParameterDeclaration(valueDeclaration)
  let isObjectBindingPattern = false
  let required = false
  let defaultValue

  if (isParameterDeclaration) {
    isObjectBindingPattern = Node.isObjectBindingPattern(
      valueDeclaration.getNameNode()
    )

    const initializer = valueDeclaration.getInitializer()
    if (initializer) {
      defaultValue = initializer.getText()
    }

    required = valueDeclaration
      ? !valueDeclaration?.hasQuestionToken() && !defaultValue
      : !defaultValue
  }

  const metadata: {
    name: string | null
    description: string | null
    defaultValue: any
    required: boolean
    text: string
    properties?: ReturnType<typeof processTypeProperties> | null
    unionProperties?:
      | ReturnType<typeof processUnionType>['unionProperties']
      | null
  } = {
    defaultValue,
    required,
    name: isObjectBindingPattern ? null : parameter.getName(),
    description: getSymbolDescription(parameter),
    text: parameter
      .getTypeAtLocation(declaration)
      .getText(declaration, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),
    properties: null,
  }

  if (!valueDeclaration) {
    return metadata
  }

  const parameterType = typeChecker.getTypeOfSymbolAtLocation(
    parameter,
    valueDeclaration
  )
  const typeDeclaration = parameterType.getSymbol()?.getDeclarations()?.at(0)
  const isTypeInNodeModules = parameterType
    .getSymbol()
    ?.getValueDeclaration()
    ?.getSourceFile()
    .isInNodeModules()
  const isLocalType = typeDeclaration
    ? declaration.getSourceFile().getFilePath() ===
      typeDeclaration.getSourceFile().getFilePath()
    : true

  if (isTypeInNodeModules || !isLocalType) {
    // If the type is imported from a node module or not in the same file, return
    // the type name and don't process the properties any further.
    if (isParameterDeclaration) {
      const parameterTypeNode = valueDeclaration.getTypeNodeOrThrow()
      metadata.text = parameterTypeNode.getText()
    }

    return metadata
  }

  const firstChild = valueDeclaration.getFirstChild()
  const defaultValues = Node.isObjectBindingPattern(firstChild)
    ? getDefaultValuesFromProperties(firstChild.getElements())
    : {}

  if (!isPrimitiveType(parameterType)) {
    if (parameterType.isUnion()) {
      const { properties, unionProperties } = processUnionType(
        parameterType,
        declaration,
        typeChecker,
        defaultValues
      )
      metadata.properties = properties
      metadata.unionProperties = unionProperties
    } else {
      metadata.properties = processTypeProperties(
        parameterType,
        declaration,
        typeChecker,
        defaultValues
      )
    }
  }

  return metadata
}

export interface PropertyMetadata {
  name: string | null
  description: string | null
  defaultValue: any
  required: boolean
  text: string
  properties: (PropertyMetadata | null)[] | null
  unionProperties?: PropertyMetadata[][]
}

/** Processes union types into an array of property arrays. */
function processUnionType(
  unionType: Type<ts.UnionType>,
  declaration: Node,
  typeChecker: TypeChecker,
  defaultValues: Record<string, any>
) {
  const allUnionTypes = unionType
    .getUnionTypes()
    .map((subType) =>
      processTypeProperties(subType, declaration, typeChecker, defaultValues)
    )
  const { duplicates, filtered } = parseDuplicates(
    allUnionTypes,
    (item) => item.name || item.text
  )

  return {
    properties: duplicates,
    unionProperties: filtered,
  }
}

/** Processes the properties of a type. */
function processTypeProperties(
  type: Type,
  declaration: Node,
  typeChecker: TypeChecker,
  defaultValues: Record<string, any>
): PropertyMetadata[] {
  if (type.isIntersection()) {
    const intersectionTypes = type.getIntersectionTypes()
    return intersectionTypes.flatMap((intersectType) =>
      processTypeProperties(
        intersectType,
        declaration,
        typeChecker,
        defaultValues
      )
    )
  }

  /**
   * Skip primitives, external, and mapped types. Mapped types need to be processed through
   * apparent properties below to determine which properties are actually external.
   * TODO: a mapped type could end up using an external type which needs to be handled
   */
  if (
    isPrimitiveType(type) ||
    (isExternalType(type, declaration) && !isMappedType(type))
  ) {
    /** Return an empty array if in node_modules since we only document external types local to the project. */
    if (isNodeModulesType(type)) {
      return []
    }

    return [
      {
        name: null,
        description: null,
        defaultValue: undefined,
        required: true,
        text: type.getText(
          declaration,
          TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
        ),
        properties: null,
      },
    ]
  }

  let properties = type.getApparentProperties()

  // Check declaration's type arguments if there are no apparent properties
  if (properties.length === 0) {
    const declarationType = declaration.getType()
    properties = declarationType
      .getTypeArguments()
      .flatMap((typeArgument) => typeArgument.getProperties())
  }

  return properties
    .map((property) =>
      processProperty(property, declaration, typeChecker, defaultValues)
    )
    .filter((property): property is NonNullable<typeof property> =>
      Boolean(property)
    )
}

/** Processes a property into a metadata object. */
function processProperty(
  property: Symbol,
  declaration: Node,
  typeChecker: TypeChecker,
  defaultValues: Record<string, any>
) {
  const declarations = property.getDeclarations()

  if (
    declarations.some((declaration) =>
      declaration.getSourceFile().isInNodeModules()
    )
  ) {
    return null
  }

  const primaryDeclaration = declarations.at(0)
  const propertyName = property.getName()
  const propertyType = property.getTypeAtLocation(declaration)
  const defaultValue = defaultValues[propertyName]

  let typeText

  if (
    Node.isParameterDeclaration(primaryDeclaration) ||
    Node.isVariableDeclaration(primaryDeclaration) ||
    Node.isPropertySignature(primaryDeclaration)
  ) {
    const typeNode = primaryDeclaration.getTypeNodeOrThrow()
    typeText = typeNode.getText()
  } else {
    typeText = propertyType.getText(
      declaration,
      TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
    )
  }

  const propertyMetadata: PropertyMetadata = {
    defaultValue,
    name: propertyName,
    description: getSymbolDescription(property),
    required: Node.isPropertySignature(primaryDeclaration)
      ? !primaryDeclaration.hasQuestionToken() && !defaultValue
      : !defaultValue,
    text: typeText,
    properties: null,
  }

  if (propertyType.isObject()) {
    const typeDeclaration = propertyType.getSymbol()?.getDeclarations()?.[0]
    const isLocalType = typeDeclaration
      ? declaration.getSourceFile().getFilePath() ===
        typeDeclaration.getSourceFile().getFilePath()
      : false

    if (isLocalType) {
      const firstChild = primaryDeclaration?.getFirstChild()
      propertyMetadata.properties = processTypeProperties(
        propertyType,
        declaration,
        typeChecker,
        Node.isObjectBindingPattern(firstChild)
          ? getDefaultValuesFromProperties(firstChild.getElements())
          : {}
      )
    }
  }

  return propertyMetadata
}

/**
 * Checks if a type is external to the current source file.
 * TODO: "local" needs to account for public/private, is there a private js doc tag, exported from package.json, index.js, etc.
 */
function isExternalType(type: Type<ts.Type>, declaration: Node) {
  const typeSymbol = type.getSymbol()
  if (!typeSymbol) {
    return false
  }

  const declarations = typeSymbol.getDeclarations()
  if (declarations.length === 0) {
    return false
  }

  const sourceFile = declaration.getSourceFile()
  return declarations.every(
    (declaration) => declaration.getSourceFile() !== sourceFile
  )
}

/** Checks if a type is a mapped type. */
function isMappedType(type: Type<ts.Type>) {
  const typeSymbol = type.getSymbol()
  if (!typeSymbol) {
    return false
  }

  const declarations = typeSymbol.getDeclarations()
  if (declarations.length === 0) {
    return false
  }

  return declarations.every(
    (declaration) => declaration.getKind() === SyntaxKind.MappedType
  )
}

/** Checks if a type is located in node_modules. */
function isNodeModulesType(type: Type<ts.Type>) {
  const typeSymbol = type.getSymbol()
  if (!typeSymbol) {
    return false
  }

  const declarations = typeSymbol.getDeclarations()
  if (declarations.length === 0) {
    return false
  }

  return declarations.every((declaration) =>
    declaration.getSourceFile().isInNodeModules()
  )
}

/** Checks if a type is a primitive type. */
function isPrimitiveType(type: Type<ts.Type>) {
  return (
    type.isBoolean() ||
    type.isBooleanLiteral() ||
    type.isNumber() ||
    type.isNumberLiteral() ||
    type.isString() ||
    type.isStringLiteral() ||
    type.isTemplateLiteral() ||
    type.isUndefined() ||
    type.isNull() ||
    type.isAny() ||
    type.isUnknown() ||
    type.isNever()
  )
}

/** Parses duplicates from an array of arrays. */
function parseDuplicates<Item>(
  arrays: Item[][],
  resolveId: (item: Item) => string
): { duplicates: Item[]; filtered: Item[][] } {
  const itemCounts: Record<string, number> = {}
  const itemReferences: Record<string, Item> = {}
  const duplicates: Item[] = []

  // Count the occurrences of each item and store a reference to the first occurrence
  arrays.flat().forEach((item) => {
    const itemId = resolveId(item)
    if (!itemCounts[itemId]) {
      itemReferences[itemId] = item
    }
    itemCounts[itemId] = (itemCounts[itemId] || 0) + 1
  })

  // Identify duplicates using the stored references
  for (const key in itemCounts) {
    if (itemCounts[key] > 1) {
      duplicates.push(itemReferences[key])
    }
  }

  // Remove duplicates from original arrays
  const filtered = arrays.map((subArray) =>
    subArray.filter((item) => itemCounts[resolveId(item)] === 1)
  )

  return { duplicates, filtered }
}
