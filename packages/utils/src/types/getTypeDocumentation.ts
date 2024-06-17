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
  PropertySignature,
  Symbol,
  Type,
  ts,
} from 'ts-morph'
import { Node, SyntaxKind, TypeFormatFlags } from 'ts-morph'
import {
  getDefaultValuesFromProperties,
  getJsDocMetadata,
  getSymbolDescription,
} from '../index'

export interface InterfaceMetadata {
  name: string
  properties: PropertyMetadata[]
  description?: string
  tags?: { tagName: string; text?: string }[]
}

export interface TypeAliasMetadata {
  name: string
  properties: PropertyMetadata[]
  description?: string
  tags?: { tagName: string; text?: string }[]
}

export interface ClassMetadata {
  name?: string
  constructor?: {
    name: string
    parameters?: ParameterMetadata[]
    description?: string
    tags?: { tagName: string; text?: string }[]
  }
  accessors?: ClassAccessorMetadata[]
  methods?: ClassMethodMetadata[]
  properties?: Omit<PropertyMetadata, 'required'>[]
  description?: string
  tags?: { tagName: string; text?: string }[]
}

export interface ClassAccessorMetadata {
  name: string
  description?: string
  tags?: { tagName: string; text?: string }[]
  modifier?: string
  scope?: string
  visibility?: string
  type: string
  returnType: string
  parameters?: ParameterMetadata[]
}

export interface ClassMethodMetadata {
  name: string
  description?: string
  tags?: { tagName: string; text?: string }[]
  modifier?: string
  scope?: string
  visibility?: string
  type: string
  returnType: string
  parameters: ParameterMetadata[]
}

export interface FunctionMetadata {
  name?: string
  parameters: ParameterMetadata[]
  type: string
  returnType: string
  description?: string
  tags?: { tagName: string; text?: string }[]
}

interface BasePropertyMetadata {
  name?: string
  description?: string
  tags?: { tagName: string; text?: string }[]
  defaultValue?: any
  required: boolean
  type: string
  properties?: PropertyMetadata[]
  unionProperties?: PropertyMetadata[][]
  parameters?: ParameterMetadata[]
  returnType?: string
}

export type PropertyMetadata =
  | (BasePropertyMetadata & {
      properties?: PropertyMetadata[]
      unionProperties?: PropertyMetadata[][]
    })
  | (BasePropertyMetadata & {
      parameters?: {
        name?: string
        description?: string
        type: string
      }[]
      returnType?: string
    })

export interface ParameterMetadata {
  name?: string
  description?: string
  defaultValue?: any
  required: boolean
  type: string
  properties?: PropertyMetadata[]
  unionProperties?: PropertyMetadata[][]
}

export type PropertyFilter = (property: PropertySignature) => boolean

/** Analyzes metadata from interfaces, type aliases, classes, functions, and variable declarations. */
export function getTypeDocumentation(
  declaration: InterfaceDeclaration,
  propertyFilter?: PropertyFilter
): InterfaceMetadata
export function getTypeDocumentation(
  declaration: TypeAliasDeclaration,
  propertyFilter?: PropertyFilter
): TypeAliasMetadata
export function getTypeDocumentation(
  declaration: InterfaceDeclaration | TypeAliasDeclaration,
  propertyFilter?: PropertyFilter
): InterfaceMetadata | TypeAliasMetadata
export function getTypeDocumentation(
  declaration: ClassDeclaration,
  propertyFilter?: PropertyFilter
): ClassMetadata
export function getTypeDocumentation(
  declaration: FunctionDeclaration,
  propertyFilter?: PropertyFilter
): FunctionMetadata
export function getTypeDocumentation(
  declaration: VariableDeclaration,
  propertyFilter?: PropertyFilter
): FunctionMetadata
export function getTypeDocumentation(
  declaration: FunctionDeclaration | VariableDeclaration,
  propertyFilter?: PropertyFilter
): FunctionMetadata
export function getTypeDocumentation(
  declaration:
    | InterfaceDeclaration
    | TypeAliasDeclaration
    | ClassDeclaration
    | FunctionDeclaration
    | VariableDeclaration,
  propertyFilter?: PropertyFilter
): InterfaceMetadata | TypeAliasMetadata | ClassMetadata | FunctionMetadata {
  if (Node.isInterfaceDeclaration(declaration)) {
    return processInterface(declaration, propertyFilter)
  }

  if (Node.isTypeAliasDeclaration(declaration)) {
    return processTypeAlias(declaration, propertyFilter)
  }

  if (Node.isClassDeclaration(declaration)) {
    return processClass(declaration, propertyFilter)
  }

  if (Node.isFunctionDeclaration(declaration)) {
    return processFunctionOrExpression(declaration, propertyFilter)
  }

  if (Node.isVariableDeclaration(declaration)) {
    const initializer = declaration.getInitializer()
    if (
      Node.isArrowFunction(initializer) ||
      Node.isFunctionExpression(initializer) ||
      Node.isCallExpression(initializer) ||
      Node.isTaggedTemplateExpression(initializer)
    ) {
      return processFunctionOrExpression(
        initializer,
        propertyFilter,
        declaration
      )
    }

    if (initializer) {
      throw new Error(
        `Unsupported declaration while processing type documentation for variable declaration with initializer: (kind: ${initializer.getKindName()}) ${initializer.getText()}`
      )
    }
  }

  throw new Error(
    `Unsupported declaration while processing type documentation for: (kind: ${declaration.getKindName()}) ${declaration.getText()}`
  )
}

/** Processes an interface into a metadata object. */
function processInterface(
  interfaceDeclaration: InterfaceDeclaration,
  propertyFilter?: PropertyFilter
): InterfaceMetadata {
  const interfaceType = interfaceDeclaration.getType()

  return {
    name: interfaceDeclaration.getName(),
    properties: processTypeProperties(
      interfaceType,
      interfaceDeclaration,
      propertyFilter
    ),
    ...getJsDocMetadata(interfaceDeclaration),
  }
}

/** Processes a type alias into a metadata object. */
function processTypeAlias(
  typeAlias: TypeAliasDeclaration,
  propertyFilter?: PropertyFilter
): TypeAliasMetadata {
  const aliasType = typeAlias.getType()

  return {
    name: typeAlias.getName(),
    properties: processTypeProperties(aliasType, typeAlias, propertyFilter),
    ...getJsDocMetadata(typeAlias),
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
  propertyFilter?: PropertyFilter,
  variableDeclaration?: VariableDeclaration
): FunctionMetadata {
  const signatures = functionDeclarationOrExpression
    .getType()
    .getCallSignatures()

  // TODO: add support for multiple signatures (overloads)
  if (signatures.length === 0) {
    throw new Error(
      `No signatures found for function declaration or expression: ${functionDeclarationOrExpression.getText()}`
    )
  }

  const signature = signatures.at(0)!
  const parameters = signature.getParameters()
  let parameterTypes: ReturnType<typeof processParameterType>[] = []

  for (const parameter of parameters) {
    const parameterType = processParameterType(
      parameter.getValueDeclaration() as ParameterDeclaration,
      functionDeclarationOrExpression,
      propertyFilter
    )
    parameterTypes.push(parameterType)
  }

  return {
    name: variableDeclaration
      ? variableDeclaration.getName()
      : (functionDeclarationOrExpression as FunctionDeclaration).getName(),
    parameters: parameterTypes,
    type: functionDeclarationOrExpression
      .getType()
      .getText(
        functionDeclarationOrExpression,
        TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
      ),
    returnType: signature
      .getReturnType()
      .getText(
        functionDeclarationOrExpression,
        TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
      ),
    ...getJsDocMetadata(variableDeclaration || functionDeclarationOrExpression),
  }
}

/** Processes a function type into a metadata object. */
function processFunctionType(
  type: Type,
  propertyFilter?: PropertyFilter
): FunctionMetadata {
  const signatures = type.getCallSignatures()
  const signature = signatures.at(0)!
  const symbol = type.getSymbol()
  const declaration = getSymbolDeclaration(symbol)
  const parameters = signature.getParameters()
  let parameterTypes: ReturnType<typeof processParameterType>[] = []

  for (const parameter of parameters) {
    // TODO: function type parameter types need to be processed differently since they don't have default values, required, etc.
    const parameterType = processParameterType(
      parameter.getValueDeclaration() as ParameterDeclaration,
      declaration,
      propertyFilter
    )
    parameterTypes.push(parameterType)
  }

  return {
    parameters: parameterTypes,
    type: type.getText(
      declaration,
      TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
    ),
    returnType: signature
      .getReturnType()
      .getText(declaration, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),
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
}

/** Processes a class into a metadata object. */
function processClass(
  classDeclaration: ClassDeclaration,
  propertyFilter?: PropertyFilter
): ClassMetadata {
  const classMetadata: {
    name?: string
    constructor?: {
      name: string
      parameters?: ReturnType<typeof processParameterType>[]
      description?: string
      tags?: { tagName: string; text?: string }[]
    }
    accessors?: ReturnType<typeof processClassAccessor>[]
    methods?: ReturnType<typeof processClassMethod>[]
    properties?: ReturnType<typeof processClassPropertyDeclaration>[]
    description?: string
    tags?: { tagName: string; text?: string }[]
  } = {
    name: classDeclaration.getName(),
    ...getJsDocMetadata(classDeclaration),
  }

  // TODO: add support for multiple constructors
  const constructor = classDeclaration.getConstructors()[0]

  if (constructor) {
    classMetadata.constructor = {
      name: 'constructor',
      parameters: constructor
        .getParameters()
        .map((parameter) =>
          processParameterType(parameter, constructor, propertyFilter)
        ),
      ...getJsDocMetadata(constructor),
    }
  }

  classDeclaration.getMembers().forEach((member) => {
    if (
      Node.isGetAccessorDeclaration(member) ||
      Node.isSetAccessorDeclaration(member)
    ) {
      if (!member.hasModifier(SyntaxKind.PrivateKeyword)) {
        if (!classMetadata.accessors) {
          classMetadata.accessors = []
        }
        classMetadata.accessors.push(
          processClassAccessor(member, propertyFilter)
        )
      }
    } else if (Node.isMethodDeclaration(member)) {
      if (!member.hasModifier(SyntaxKind.PrivateKeyword)) {
        if (!classMetadata.methods) {
          classMetadata.methods = []
        }
        classMetadata.methods.push(processClassMethod(member, propertyFilter))
      }
    } else if (Node.isPropertyDeclaration(member)) {
      if (!member.hasModifier(SyntaxKind.PrivateKeyword)) {
        if (!classMetadata.properties) {
          classMetadata.properties = []
        }
        classMetadata.properties.push(processClassPropertyDeclaration(member))
      }
    }
  })

  return classMetadata
}

/** Processes an accessor (getter or setter) into a metadata object. */
function processClassAccessor(
  accessor: GetAccessorDeclaration | SetAccessorDeclaration,
  propertyFilter?: PropertyFilter
): ClassAccessorMetadata {
  const isSetter = Node.isSetAccessorDeclaration(accessor)
  const parameters = isSetter
    ? accessor
        .getParameters()
        .map((parameter) =>
          processParameterType(parameter, accessor, propertyFilter)
        )
    : []
  const returnType = accessor
    .getType()
    .getText(accessor, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope)

  return {
    ...(isSetter ? { parameters } : {}),
    returnType,
    name: accessor.getName(),
    modifier: getModifier(accessor),
    scope: getScope(accessor),
    visibility: getVisibility(accessor),
    type: accessor
      .getType()
      .getText(accessor, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),
    ...getJsDocMetadata(accessor),
  }
}

/** Processes a method declaration into a metadata object. */
function processClassMethod(
  method: MethodDeclaration,
  propertyFilter?: PropertyFilter
): ClassMethodMetadata {
  const signatures = method.getType().getCallSignatures()
  // TODO: add support for multiple signatures
  const signature = signatures.at(0)!
  const parameters = signature
    .getParameters()
    .map((parameter) =>
      processParameterType(
        parameter.getValueDeclaration() as ParameterDeclaration,
        method,
        propertyFilter
      )
    )

  return {
    parameters,
    name: method.getName(),
    modifier: getModifier(method),
    scope: getScope(method),
    visibility: getVisibility(method),
    type: method
      .getType()
      .getText(method, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),
    returnType: signature
      .getReturnType()
      .getText(method, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),
    ...getJsDocMetadata(method),
  }
}

/** Processes a class property declaration into a metadata object. */
function processClassPropertyDeclaration(property: PropertyDeclaration) {
  return {
    name: property.getName(),
    scope: getScope(property),
    visibility: getVisibility(property),
    isReadonly: property.isReadonly(),
    type: property
      .getType()
      .getText(property, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),
    ...getJsDocMetadata(property),
  }
}

/** Processes a signature parameter into a metadata object. */
function processParameterType(
  parameterDeclaration: ParameterDeclaration,
  enclosingNode?: Node,
  propertyFilter?: PropertyFilter
): ParameterMetadata {
  const parameterType = parameterDeclaration.getType()
  const defaultValue = parameterDeclaration.getInitializer()?.getText()
  const isObjectBindingPattern = Node.isObjectBindingPattern(
    parameterDeclaration.getNameNode()
  )
  const metadata: {
    name?: string
    description?: string
    defaultValue?: any
    required: boolean
    type: string
    properties?: ReturnType<typeof processTypeProperties>
    unionProperties?: ReturnType<typeof processUnionType>['unionProperties']
  } = {
    defaultValue,
    name: isObjectBindingPattern ? undefined : parameterDeclaration.getName(),
    required: !parameterDeclaration.hasQuestionToken() && !defaultValue,
    type: parameterType.getText(
      enclosingNode,
      TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
    ),
    ...getJsDocMetadata(parameterDeclaration),
  }

  if (!metadata.description) {
    metadata.description = getSymbolDescription(
      parameterDeclaration.getSymbolOrThrow()
    )
  }

  const typeSymbol = parameterType.getSymbol()
  const typeDeclaration = typeSymbol?.getDeclarations()?.at(0)
  const isTypeInNodeModules = typeSymbol
    ?.getValueDeclaration()
    ?.getSourceFile()
    .isInNodeModules()
  // TODO: local types need to account if they are exported from the file since they will be linked to the type
  const isLocalType =
    enclosingNode && typeDeclaration
      ? enclosingNode.getSourceFile().getFilePath() ===
        typeDeclaration.getSourceFile().getFilePath()
      : true

  // If the type is imported from a node module or not in the same file, return
  // the type name and don't process the properties any further.
  if (
    !isPrimitiveType(parameterType) &&
    (isTypeInNodeModules || !isLocalType)
  ) {
    const parameterTypeNode = parameterDeclaration.getTypeNodeOrThrow()
    metadata.type = parameterTypeNode.getText()
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
        defaultValues,
        propertyFilter
      )
      metadata.properties = properties
      metadata.unionProperties = unionProperties
    } else {
      metadata.properties = processTypeProperties(
        parameterType,
        enclosingNode,
        propertyFilter,
        defaultValues
      )
    }
  }

  return metadata
}

/** Processes union types into an array of property arrays. */
function processUnionType(
  unionType: Type<ts.UnionType>,
  enclosingNode?: Node,
  defaultValues?: Record<string, any>,
  propertyFilter?: PropertyFilter
) {
  const allUnionTypes = unionType
    .getUnionTypes()
    .map((subType) =>
      processTypeProperties(
        subType,
        enclosingNode,
        propertyFilter,
        defaultValues
      )
    )
  const { duplicates, filtered } = parseDuplicates(
    allUnionTypes,
    (item) => item.name || item.type
  )

  return {
    properties: duplicates,
    unionProperties: filtered,
  }
}

/** Processes the properties of a type. */
function processTypeProperties(
  type: Type,
  enclosingNode?: Node,
  propertyFilter?: PropertyFilter,
  defaultValues: Record<string, any> = {}
): PropertyMetadata[] {
  // Handle intersection types by recursively processing each type in the intersection
  if (type.isIntersection()) {
    const intersectionTypes = type.getIntersectionTypes()

    return intersectionTypes.flatMap((intersectType) =>
      processTypeProperties(
        intersectType,
        enclosingNode,
        propertyFilter,
        defaultValues
      )
    )
  }

  const typeMetadata = getTypeMetadata(type, enclosingNode)

  /** If no property filter is provided, short-circuit for types in node_modules. */
  if (!propertyFilter && typeMetadata.isInNodeModules) {
    return []
  }

  /**
   * Skip primitives to avoid processing poperties and methods of their prototype.
   * Skip external types local to the project since they should be processed on their own and linked.
   */
  if (
    isPrimitiveType(type) ||
    (typeMetadata.isExternal && !typeMetadata.isInNodeModules)
  ) {
    const symbol = type.getSymbol()

    return [
      {
        required: symbol ? !symbol.isOptional() : true,
        type: type.getText(
          enclosingNode,
          TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
        ),
      },
    ]
  }

  let properties = type.getApparentProperties()

  // Check declaration's type arguments if there are no immediate apparent properties
  if (properties.length === 0 && enclosingNode) {
    const typeArguments = getTypeArgumentsIncludingIntersections(
      enclosingNode.getType()
    )
    properties = typeArguments.flatMap((typeArgument) =>
      typeArgument.getApparentProperties()
    )
  }

  return properties
    .map((property) =>
      processProperty(property, enclosingNode, defaultValues, propertyFilter)
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
  return type.getTypeArguments().filter((type) => !isPrimitiveType(type))
}

function defaultPropertyFilter(property: PropertySignature) {
  return !property.getSourceFile().isInNodeModules()
}

function processProperty(
  property: Symbol,
  enclosingNode?: Node,
  defaultValues?: Record<string, any>,
  propertyFilter: (
    property: PropertySignature
  ) => boolean = defaultPropertyFilter
) {
  let declaration = property.getValueDeclaration()

  if (!declaration) {
    declaration = property.getDeclarations().at(0)
  }

  if (Node.isPropertySignature(declaration) && !propertyFilter(declaration)) {
    return
  }

  const contextNode = enclosingNode || declaration
  const propertyType = contextNode
    ? property.getTypeAtLocation(contextNode)
    : undefined
  let typeText

  if (
    Node.isParameterDeclaration(declaration) ||
    Node.isPropertySignature(declaration) ||
    Node.isVariableDeclaration(declaration)
  ) {
    const typeNode = declaration.getTypeNodeOrThrow()
    typeText = typeNode.getText()
  } else if (propertyType) {
    typeText = propertyType.getText(
      enclosingNode,
      TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
    )
  }

  const propertyName = property.getName()
  const defaultValue = defaultValues?.[propertyName]
  const propertyMetadata: PropertyMetadata = {
    defaultValue,
    name: propertyName,
    required: !property.isOptional() && defaultValue === undefined,
    type: typeText ?? 'any',
  }

  const jsDocMetadata = declaration ? getJsDocMetadata(declaration) : undefined

  if (jsDocMetadata) {
    propertyMetadata.description = jsDocMetadata.description
    propertyMetadata.tags = jsDocMetadata.tags
  } else {
    propertyMetadata.description = getSymbolDescription(property)
  }

  if (propertyType?.isObject()) {
    const typeDeclaration = propertyType.getSymbol()?.getDeclarations()?.at(0)
    const isLocalType =
      enclosingNode && typeDeclaration
        ? enclosingNode.getSourceFile().getFilePath() ===
          typeDeclaration.getSourceFile().getFilePath()
        : false

    if (isLocalType) {
      const firstChild = declaration?.getFirstChild()

      if (propertyType.getCallSignatures().length > 0) {
        Object.assign(propertyMetadata, processFunctionType(propertyType))
      } else {
        propertyMetadata.properties = processTypeProperties(
          propertyType,
          enclosingNode,
          propertyFilter,
          Node.isObjectBindingPattern(firstChild)
            ? getDefaultValuesFromProperties(firstChild.getElements())
            : {}
        )
      }
    }
  }

  return propertyMetadata
}

/** Determine if a type is external, mapped, or in node_modules. */
function getTypeMetadata(type: Type<ts.Type>, declaration?: Node) {
  const typeSymbol = type.getSymbol()
  if (!typeSymbol) {
    return {
      isExternal: false,
      isMapped: false,
      isInNodeModules: false,
    }
  }

  const declarations = typeSymbol.getDeclarations()
  if (declarations.length === 0) {
    return {
      isExternal: false,
      isMapped: false,
      isInNodeModules: false,
    }
  }

  const sourceFile = declaration?.getSourceFile()
  let isExternal = true
  let isMapped = true
  let isInNodeModules = true

  for (const declaration of declarations) {
    const declarationSourceFile = declaration.getSourceFile()

    /**
     * Checks if a type is external to the current source file.
     * TODO: "local" needs to account for public/private, is there a private js doc tag, exported from package.json, index.js, etc.
     */
    if (declarationSourceFile === sourceFile) {
      isExternal = false
    }

    if (declaration.getKind() !== SyntaxKind.MappedType) {
      isMapped = false
    }

    if (!declarationSourceFile.isInNodeModules()) {
      isInNodeModules = false
    }

    if (!isExternal && !isMapped && !isInNodeModules) {
      break
    }
  }

  return { isExternal, isMapped, isInNodeModules }
}

/** Checks if a type is a primitive type. */
function isPrimitiveType(type: Type<ts.Type>) {
  return (
    type.isArray() ||
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

/** Attempts to find the declaration of a symbol. */
function getSymbolDeclaration(symbol?: Symbol) {
  return symbol
    ? symbol.getValueDeclaration() || symbol.getDeclarations().at(0)
    : undefined
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
