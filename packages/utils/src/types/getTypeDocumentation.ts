import type {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  TaggedTemplateExpression,
  CallExpression,
  TypeAliasDeclaration,
  InterfaceDeclaration,
  ClassDeclaration,
  PropertyDeclaration,
  MethodDeclaration,
  ParameterDeclaration,
  SetAccessorDeclaration,
  GetAccessorDeclaration,
  VariableDeclaration,
  Symbol,
  Type,
  ts,
} from 'ts-morph'
import { Node, SyntaxKind, TypeFormatFlags, TypeChecker } from 'ts-morph'
import { getDefaultValuesFromProperties, getSymbolDescription } from '../index'

/** Analyzes metadata from interfaces, type aliases, classes, functions, and variable declarations. */
export function getTypeDocumentation(
  declaration:
    | InterfaceDeclaration
    | TypeAliasDeclaration
    | ClassDeclaration
    | FunctionDeclaration
    | VariableDeclaration
) {
  if (Node.isInterfaceDeclaration(declaration)) {
    return processInterface(declaration)
  }

  if (Node.isTypeAliasDeclaration(declaration)) {
    return processTypeAlias(declaration)
  }

  if (Node.isClassDeclaration(declaration)) {
    return processClass(declaration)
  }

  if (Node.isFunctionDeclaration(declaration)) {
    return processFunctionOrExpression(declaration)
  }

  if (Node.isVariableDeclaration(declaration)) {
    const initializer = declaration.getInitializer()
    if (
      Node.isArrowFunction(initializer) ||
      Node.isFunctionExpression(initializer) ||
      Node.isCallExpression(initializer) ||
      Node.isTaggedTemplateExpression(initializer)
    ) {
      return processFunctionOrExpression(initializer, declaration)
    }
  }

  throw new Error(
    `Unsupported declaration while processing type documentation for: ${declaration.getText()}`
  )
}

/** Processes an interface into a metadata object. */
function processInterface(interfaceDeclaration: InterfaceDeclaration) {
  const typeChecker = interfaceDeclaration.getProject().getTypeChecker()
  const interfaceType = interfaceDeclaration.getType()

  return {
    name: interfaceDeclaration.getName(),
    description: getJsDocDescription(interfaceDeclaration),
    properties: processTypeProperties(
      interfaceType,
      interfaceDeclaration,
      typeChecker
    ),
  }
}

/** Processes a type alias into a metadata object. */
function processTypeAlias(typeAlias: TypeAliasDeclaration) {
  const typeChecker = typeAlias.getProject().getTypeChecker()
  const aliasType = typeAlias.getType()

  return {
    name: typeAlias.getName(),
    description: getJsDocDescription(typeAlias),
    properties: processTypeProperties(aliasType, typeAlias, typeChecker),
  }
}

/** Processes a function declaration into a metadata object. */
function processFunctionOrExpression(
  functionDeclarationOrExpression:
    | FunctionDeclaration
    | ArrowFunction
    | FunctionExpression
    | TaggedTemplateExpression
    | CallExpression,
  variableDeclaration?: VariableDeclaration
) {
  const signatures = functionDeclarationOrExpression
    .getType()
    .getCallSignatures()

  // TODO: add support for multiple signatures (overloads)
  if (signatures.length === 0) {
    return null
  }

  const signature = signatures[0]
  const parameters = signature.getParameters()

  if (parameters.length === 0) {
    return null
  }

  let parameterTypes: ReturnType<typeof processParameterType>[] = []

  for (const parameter of parameters) {
    const parameterType = processParameterType(
      parameter.getValueDeclaration() as ParameterDeclaration,
      functionDeclarationOrExpression
    )
    parameterTypes.push(parameterType)
  }

  return {
    name: variableDeclaration
      ? variableDeclaration.getName()
      : (functionDeclarationOrExpression as FunctionDeclaration).getName(),
    description: getJsDocDescription(
      variableDeclaration || functionDeclarationOrExpression
    ),
    parameters: parameterTypes,
  }
}

function getModifier(
  node:
    | SetAccessorDeclaration
    | GetAccessorDeclaration
    | FunctionDeclaration
    | MethodDeclaration
) {
  if (Node.isSetAccessorDeclaration(node)) {
    return 'setter'
  }

  if (Node.isGetAccessorDeclaration(node)) {
    return 'getter'
  }

  if (node.isAsync()) {
    return 'async'
  }

  if (node.isGenerator()) {
    return 'generator'
  }

  return null
}

function getVisibility(
  node:
    | MethodDeclaration
    | SetAccessorDeclaration
    | GetAccessorDeclaration
    | PropertyDeclaration
) {
  if (node.hasModifier(SyntaxKind.PrivateKeyword)) {
    return 'private'
  }

  if (node.hasModifier(SyntaxKind.ProtectedKeyword)) {
    return 'protected'
  }

  if (node.hasModifier(SyntaxKind.PublicKeyword)) {
    return 'public'
  }

  return null
}

function getScope(
  node:
    | MethodDeclaration
    | SetAccessorDeclaration
    | GetAccessorDeclaration
    | PropertyDeclaration
) {
  if (node.isAbstract()) {
    return 'abstract'
  }

  if (node.isStatic()) {
    return 'static'
  }

  return null
}

function getJsDocDescription(node: Node): string | null {
  if (Node.isJSDocable(node)) {
    const docs = node.getJsDocs()
    const content = docs.map((doc) => doc.getInnerText()).join('\n')
    if (content.length > 0) {
      return content
    }
  }
  return null
}

/** Processes a class into a metadata object. */
function processClass(classDeclaration: ClassDeclaration) {
  const classMetadata: any = {
    name: classDeclaration.getName(),
    description: getJsDocDescription(classDeclaration),
    constructor: null,
    accessors: [],
    methods: [],
    properties: [],
  }

  // TODO: add support for multiple constructors
  const constructor = classDeclaration.getConstructors()[0]

  if (constructor) {
    classMetadata.constructor = {
      name: 'constructor',
      description: getJsDocDescription(constructor),
      parameters: constructor
        .getParameters()
        .map((parameter) => processParameterType(parameter, constructor)),
    }
  }

  classDeclaration.getMembers().forEach((member) => {
    if (
      Node.isGetAccessorDeclaration(member) ||
      Node.isSetAccessorDeclaration(member)
    ) {
      if (!member.hasModifier(SyntaxKind.PrivateKeyword)) {
        classMetadata.accessors.push(processClassAccessor(member))
      }
    } else if (Node.isMethodDeclaration(member)) {
      if (!member.hasModifier(SyntaxKind.PrivateKeyword)) {
        classMetadata.methods.push(processClassMethod(member))
      }
    } else if (Node.isPropertyDeclaration(member)) {
      if (!member.hasModifier(SyntaxKind.PrivateKeyword)) {
        classMetadata.properties.push(processPropertyDeclaration(member))
      }
    }
  })

  return classMetadata
}

/** Processes an accessor (getter or setter) into a metadata object. */
function processClassAccessor(
  accessor: GetAccessorDeclaration | SetAccessorDeclaration
) {
  const isSetter = Node.isSetAccessorDeclaration(accessor)
  const parameters = isSetter
    ? accessor
        .getParameters()
        .map((parameter) => processParameterType(parameter, accessor))
    : []
  const returnType = accessor
    .getType()
    .getText(accessor, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope)

  return {
    ...(isSetter ? { parameters } : {}),
    returnType,
    name: accessor.getName(),
    description: getSymbolDescription(accessor.getSymbolOrThrow()),
    modifier: getModifier(accessor),
    scope: getScope(accessor),
    visibility: getVisibility(accessor),
    text: accessor
      .getType()
      .getText(accessor, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),
  }
}

/** Processes a method declaration into a metadata object. */
function processClassMethod(method: MethodDeclaration) {
  const signatures = method.getType().getCallSignatures()
  // TODO: add support for multiple signatures
  const signature = signatures.at(0)!
  const parameters = signature
    .getParameters()
    .map((parameter) =>
      processParameterType(
        parameter.getValueDeclaration() as ParameterDeclaration,
        method
      )
    )
  const returnType = signature
    .getReturnType()
    .getText(method, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope)

  return {
    parameters,
    returnType,
    name: method.getName(),
    description: getSymbolDescription(method.getSymbolOrThrow()),
    modifier: getModifier(method),
    scope: getScope(method),
    visibility: getVisibility(method),
    text: method
      .getType()
      .getText(method, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),
  }
}

/** Processes a property declaration into a metadata object. */
function processPropertyDeclaration(property: PropertyDeclaration) {
  return {
    name: property.getName(),
    description: getSymbolDescription(property.getSymbolOrThrow()),
    scope: getScope(property),
    visibility: getVisibility(property),
    isReadonly: property.isReadonly(),
    text: property
      .getType()
      .getText(property, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),
  }
}

/** Processes a signature parameter into a metadata object. */
function processParameterType(
  parameterDeclaration: ParameterDeclaration,
  enclosingNode: Node
) {
  const typeChecker = enclosingNode.getProject().getTypeChecker()
  const parameterType = parameterDeclaration.getType()
  const defaultValue = parameterDeclaration.getInitializer()?.getText()
  const isObjectBindingPattern = Node.isObjectBindingPattern(
    parameterDeclaration.getNameNode()
  )
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
    name: isObjectBindingPattern ? null : parameterDeclaration.getName(),
    description: getSymbolDescription(parameterDeclaration.getSymbolOrThrow()),
    required: !parameterDeclaration.hasQuestionToken() && !defaultValue,
    text: parameterType.getText(
      enclosingNode,
      TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
    ),
    properties: null,
  }

  const typeDeclaration = parameterType.getSymbol()?.getDeclarations()?.at(0)
  const isTypeInNodeModules = parameterType
    .getSymbol()
    ?.getValueDeclaration()
    ?.getSourceFile()
    .isInNodeModules()
  const isLocalType = typeDeclaration
    ? enclosingNode.getSourceFile().getFilePath() ===
      typeDeclaration.getSourceFile().getFilePath()
    : true

  if (isTypeInNodeModules || !isLocalType) {
    // If the type is imported from a node module or not in the same file, return
    // the type name and don't process the properties any further.
    const parameterTypeNode = parameterDeclaration.getTypeNodeOrThrow()
    metadata.text = parameterTypeNode.getText()
    return metadata
  }

  const firstChild = parameterDeclaration.getFirstChild()
  const defaultValues = Node.isObjectBindingPattern(firstChild)
    ? getDefaultValuesFromProperties(firstChild.getElements())
    : {}

  if (!isPrimitiveType(parameterType)) {
    if (parameterType.isUnion()) {
      const { properties, unionProperties } = processUnionType(
        parameterType,
        enclosingNode,
        typeChecker,
        defaultValues
      )
      metadata.properties = properties
      metadata.unionProperties = unionProperties
    } else {
      metadata.properties = processTypeProperties(
        parameterType,
        enclosingNode,
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
  defaultValues: Record<string, any> = {}
): PropertyMetadata[] {
  // Handle intersection types by recursively processing each type in the intersection
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
    const typeArguments = getTypeArgumentsIncludingIntersections(
      declaration.getType()
    )
    properties = typeArguments.flatMap((typeArgument) =>
      typeArgument.getProperties()
    )
  }

  return properties
    .map((property) =>
      processProperty(property, declaration, typeChecker, defaultValues)
    )
    .filter((property): property is NonNullable<typeof property> =>
      Boolean(property)
    )
}

/** Retrieves type arguments including intersection types. */
function getTypeArgumentsIncludingIntersections(type: Type): Type[] {
  if (type.isIntersection()) {
    return type
      .getIntersectionTypes()
      .flatMap(getTypeArgumentsIncludingIntersections)
  }
  return type.getTypeArguments()
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
