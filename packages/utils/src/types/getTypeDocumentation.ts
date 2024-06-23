import type {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  TaggedTemplateExpression,
  CallExpression,
  TypeAliasDeclaration,
  InterfaceDeclaration,
  EnumDeclaration,
  ClassDeclaration,
  PropertyDeclaration,
  MethodDeclaration,
  ParameterDeclaration,
  SetAccessorDeclaration,
  GetAccessorDeclaration,
  VariableDeclaration,
  PropertySignature,
  MethodSignature,
  Symbol,
  Type,
  ts,
} from 'ts-morph'
import { Node, SyntaxKind, TypeFormatFlags } from 'ts-morph'

import {
  resolveLiteralExpression,
  isLiteralExpressionValue,
} from '../expressions'
import { getJsDocMetadata } from '../js-docs'
import { getDefaultValuesFromProperties } from '../properties'
import { getSymbolDescription } from '../symbols'

export interface SharedMetadata {
  name?: string
  description?: string
  tags?: { tagName: string; text?: string }[]
  type: string
}

export interface SharedValueMetadata extends SharedMetadata {
  defaultValue?: ReturnType<typeof resolveLiteralExpression>
  required?: boolean
}

export interface ValueMetadata extends SharedValueMetadata {
  kind: 'Value'
}

/** Represents a function value e.g. { fn(): void } */
export interface FunctionValueMetadata extends SharedValueMetadata {
  kind: 'FunctionValue'
  parameters: ParameterMetadata[]
  returnType: string
}

/** Represents an object value e.g. { prop: 'value' } */
export interface ObjectValueMetadata extends SharedValueMetadata {
  kind: 'ObjectValue'
  properties?: PropertyMetadata[]
  unionProperties?: PropertyMetadata[][]
}

export interface LiteralValueMetadata extends SharedMetadata {
  kind: 'LiteralValue'
  value: ReturnType<typeof resolveLiteralExpression>
}

export type ParameterMetadata =
  | ValueMetadata
  | FunctionValueMetadata
  | ObjectValueMetadata

export type PropertyMetadata =
  | ValueMetadata
  | FunctionValueMetadata
  | ObjectValueMetadata

export type PropertyFilter = (
  property: PropertySignature | MethodSignature
) => boolean

export interface PropertiesMetadata extends SharedMetadata {
  properties: PropertyMetadata[]
  unionProperties?: PropertyMetadata[][]
}

export interface InterfaceMetadata extends PropertiesMetadata {
  kind: 'Interface'
}

export interface TypeAliasMetadata extends PropertiesMetadata {
  kind: 'TypeAlias'
}

export interface EnumMetadata extends SharedMetadata {
  kind: 'Enum'
  members: string[]
}

export interface ClassMetadata extends SharedMetadata {
  kind: 'Class'
  constructor?: SharedMetadata & {
    parameters: ParameterMetadata[]
  }
  accessors?: ClassAccessorMetadata[]
  methods?: ClassMethodMetadata[]
  properties?: ClassPropertyMetadata[]
}

export interface SharedClassMemberMetadata extends SharedMetadata {
  scope?: 'abstract' | 'static'
  visibility?: 'private' | 'protected' | 'public'
}

export interface ClassGetAccessorMetadata extends SharedClassMemberMetadata {
  kind: 'ClassGetAccessor'
}

export interface ClassSetAccessorMetadata extends SharedClassMemberMetadata {
  kind: 'ClassSetAccessor'
  parameters?: ParameterMetadata[]
  returnType: string
}

export type ClassAccessorMetadata =
  | ClassGetAccessorMetadata
  | ClassSetAccessorMetadata

export interface ClassMethodMetadata extends SharedClassMemberMetadata {
  kind: 'ClassMethod'
  modifier?: 'async' | 'generator'
  parameters: ParameterMetadata[]
  returnType: string
}

export interface ClassPropertyMetadata extends SharedClassMemberMetadata {
  kind: 'ClassProperty'
  isReadonly: boolean
}

export interface FunctionMetadata extends SharedMetadata {
  kind: 'Function'
  modifier?: 'async' | 'generator'
  parameters: ParameterMetadata[]
  returnType: string
}

export interface ComponentMetadata extends PropertiesMetadata {
  kind: 'Component'
  returnType: string
}

export interface UnknownMetadata extends SharedMetadata {
  kind: 'Unknown'
}

export type MetadataMap = {
  Value: ValueMetadata
  FunctionValue: FunctionValueMetadata
  ObjectValue: ObjectValueMetadata
  LiteralValue: LiteralValueMetadata
  Parameter: ParameterMetadata
  Property: PropertyMetadata
  Properties: PropertiesMetadata
  Interface: InterfaceMetadata
  TypeAlias: TypeAliasMetadata
  Enum: EnumMetadata
  Class: ClassMetadata
  ClassGetAccessor: ClassGetAccessorMetadata
  ClassSetAccessor: ClassSetAccessorMetadata
  ClassMethod: ClassMethodMetadata
  ClassProperty: ClassPropertyMetadata
  Function: FunctionMetadata
  Component: ComponentMetadata
  Unknown: UnknownMetadata
}

export type MetadataOfKind<Key extends keyof MetadataMap = keyof MetadataMap> =
  MetadataMap[Key]

type Declaration =
  | InterfaceDeclaration
  | TypeAliasDeclaration
  | EnumDeclaration
  | ClassDeclaration
  | FunctionDeclaration
  | VariableDeclaration

type Metadata =
  | InterfaceMetadata
  | TypeAliasMetadata
  | EnumMetadata
  | ClassMetadata
  | FunctionMetadata
  | ComponentMetadata
  | LiteralValueMetadata
  | UnknownMetadata

export type DocumentationMetadata<Type> = Type extends InterfaceDeclaration
  ? InterfaceMetadata
  : Type extends TypeAliasDeclaration
  ? TypeAliasMetadata
  : Type extends ClassDeclaration
  ? ClassMetadata
  : Type extends EnumDeclaration
  ? EnumMetadata
  : Type extends FunctionDeclaration
  ? FunctionMetadata | ComponentMetadata
  : Type extends VariableDeclaration
  ? FunctionMetadata | ComponentMetadata
  : never

const TYPE_FORMAT_FLAGS =
  TypeFormatFlags.AddUndefined |
  TypeFormatFlags.NoTruncation |
  TypeFormatFlags.UseAliasDefinedOutsideCurrentScope

export function getTypeDocumentation<Type extends Declaration>(
  declaration: Type,
  propertyFilter?: PropertyFilter
): DocumentationMetadata<Type>
export function getTypeDocumentation(
  declaration:
    | InterfaceDeclaration
    | TypeAliasDeclaration
    | ClassDeclaration
    | FunctionDeclaration
    | VariableDeclaration,
  propertyFilter?: PropertyFilter
): Metadata {
  if (Node.isInterfaceDeclaration(declaration)) {
    return processInterface(declaration, propertyFilter)
  }

  if (Node.isTypeAliasDeclaration(declaration)) {
    return processTypeAlias(declaration, propertyFilter)
  }

  if (Node.isEnumDeclaration(declaration)) {
    return processEnum(declaration)
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

    if (Node.isExpression(initializer)) {
      const resolvedLiteral = resolveLiteralExpression(initializer)

      if (isLiteralExpressionValue(resolvedLiteral)) {
        return {
          kind: 'LiteralValue',
          value: resolvedLiteral,
          ...processDefaultDeclaration(declaration),
        }
      }
    }
  }

  return {
    kind: declaration.getKindName() as 'Unknown',
    ...processDefaultDeclaration(declaration),
  }
}

function processDefaultDeclaration(declaration: Declaration): SharedMetadata {
  return {
    name: declaration.getName(),
    type: declaration.getType().getText(declaration, TYPE_FORMAT_FLAGS),
    description: getJsDocMetadata(declaration)?.description || '',
    tags: getJsDocMetadata(declaration)?.tags || [],
  }
}

/** Processes an interface into a metadata object. */
function processInterface(
  interfaceDeclaration: InterfaceDeclaration,
  propertyFilter?: PropertyFilter
): InterfaceMetadata {
  const interfaceType = interfaceDeclaration.getType()
  const metadata: InterfaceMetadata = {
    kind: 'Interface',
    name: interfaceDeclaration.getName(),
    properties: undefined as any,
    type: interfaceType.getText(interfaceDeclaration, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(interfaceDeclaration),
  }

  if (!isPrimitiveType(interfaceType)) {
    if (interfaceType.isUnion()) {
      Object.assign(
        metadata,
        processUnionType(
          interfaceType,
          interfaceDeclaration,
          propertyFilter,
          undefined
        )
      )
    } else {
      Object.assign(metadata, {
        properties: processTypeProperties(
          interfaceType,
          interfaceDeclaration,
          propertyFilter
        ),
      })
    }
  }

  return metadata
}

/** Processes a type alias into a metadata object. */
function processTypeAlias(
  typeAlias: TypeAliasDeclaration,
  propertyFilter?: PropertyFilter
): TypeAliasMetadata {
  const typeAliasType = typeAlias.getType()
  const name = typeAlias.getName()
  const metadata: TypeAliasMetadata = {
    name,
    kind: 'TypeAlias',
    properties: undefined as any,
    type: typeAliasType.getText(typeAlias, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(typeAlias),
  }

  if (!isPrimitiveType(typeAliasType)) {
    if (typeAliasType.isUnion()) {
      const { properties, unionProperties } = processUnionType(
        typeAliasType,
        typeAlias,
        propertyFilter,
        undefined
      )
      metadata.properties = properties
      metadata.unionProperties = unionProperties
    } else {
      metadata.properties = processTypeProperties(
        typeAliasType,
        typeAlias,
        propertyFilter
      )
    }
  }

  return metadata
}

/** Processes an enum declaration into a metadata object. */
function processEnum(enumDeclaration: EnumDeclaration): EnumMetadata {
  const members = enumDeclaration.getMembers().map((member) => member.getName())

  return {
    kind: 'Enum',
    name: enumDeclaration.getName(),
    type: enumDeclaration.getType().getText(enumDeclaration, TYPE_FORMAT_FLAGS),
    members,
    ...getJsDocMetadata(enumDeclaration),
  }
}

/** Processes a function or expression into a metadata object. */
function processFunctionOrExpression(
  functionDeclarationOrExpression:
    | FunctionDeclaration
    | ArrowFunction
    | FunctionExpression
    | TaggedTemplateExpression
    | CallExpression,
  propertyFilter?: PropertyFilter,
  variableDeclaration?: VariableDeclaration
): FunctionMetadata | ComponentMetadata {
  if (functionDeclarationOrExpression === undefined) {
    throw new Error(
      'Cannot process undefined function declaration or expression.'
    )
  }
  const signatures = functionDeclarationOrExpression
    .getType()
    .getCallSignatures()

  if (signatures.length === 0) {
    throw new Error(
      `No signatures found for function declaration or expression: ${functionDeclarationOrExpression.getText()}`
    )
  }

  // TODO: add support for multiple signatures (overloads)
  const signature = signatures.at(0)!
  const parameters = signature.getParameters()
  const sharedMetadata = {
    name: variableDeclaration
      ? variableDeclaration.getName()
      : (functionDeclarationOrExpression as FunctionDeclaration).getName(),
    type: functionDeclarationOrExpression
      .getType()
      .getText(functionDeclarationOrExpression, TYPE_FORMAT_FLAGS),
    returnType: signature
      .getReturnType()
      .getText(functionDeclarationOrExpression, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(variableDeclaration || functionDeclarationOrExpression),
  } as const
  const parameterTypes = parameters.map((parameter) => {
    const parameterDeclaration = getSymbolDeclaration(parameter)

    if (!parameterDeclaration) {
      throw new Error(
        `No declaration found for parameter: ${parameter.getName()}`
      )
    }

    return processParameterType(
      parameterDeclaration as ParameterDeclaration,
      functionDeclarationOrExpression,
      propertyFilter
    )
  })

  const isComponent = sharedMetadata.name
    ? /[A-Z]/.test(sharedMetadata.name.charAt(0)) && parameterTypes.length === 1
    : false

  if (isComponent) {
    const firstParameter = parameterTypes.at(0)! as ObjectValueMetadata
    return {
      kind: 'Component',
      properties: firstParameter.properties!,
      unionProperties: firstParameter.unionProperties,
      ...sharedMetadata,
    }
  }

  return {
    kind: 'Function',
    parameters: parameterTypes,
    ...sharedMetadata,
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
  const typeText = type.getText(declaration, TYPE_FORMAT_FLAGS)
  const parameters = signature.getParameters()
  let parameterTypes: ReturnType<typeof processParameterType>[] = []

  for (const parameter of parameters) {
    // TODO: function type parameter types need to be processed differently since they don't have default values, required, etc.
    const parameterDeclaration = getSymbolDeclaration(parameter)

    if (parameterDeclaration) {
      const parameterType = processParameterType(
        parameterDeclaration as ParameterDeclaration,
        declaration || parameterDeclaration,
        propertyFilter
      )
      parameterTypes.push(parameterType)
    }
  }

  return {
    kind: 'Function',
    parameters: parameterTypes,
    type: typeText,
    returnType: signature
      .getReturnType()
      .getText(declaration, TYPE_FORMAT_FLAGS),
  }
}

function getModifier(node: FunctionDeclaration | MethodDeclaration) {
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
  const classMetadata: ClassMetadata = {
    kind: 'Class',
    name: classDeclaration.getName(),
    type: classDeclaration
      .getType()
      .getText(classDeclaration, TYPE_FORMAT_FLAGS),
    constructor: undefined,
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
      type: constructor.getType().getText(constructor, TYPE_FORMAT_FLAGS),
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
  const sharedMetadata: SharedClassMemberMetadata = {
    name: accessor.getName(),
    scope: getScope(accessor),
    visibility: getVisibility(accessor),
    type: accessor.getType().getText(accessor, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(accessor),
  }

  if (Node.isSetAccessorDeclaration(accessor)) {
    const parameters = accessor
      .getParameters()
      .map((parameter) =>
        processParameterType(parameter, accessor, propertyFilter)
      )
    const returnType = accessor.getType().getText(accessor, TYPE_FORMAT_FLAGS)

    return {
      kind: 'ClassSetAccessor',
      parameters,
      returnType,
      ...sharedMetadata,
    }
  }

  return {
    kind: 'ClassGetAccessor',
    ...sharedMetadata,
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
    kind: 'ClassMethod',
    parameters,
    name: method.getName(),
    modifier: getModifier(method),
    scope: getScope(method),
    visibility: getVisibility(method),
    type: method.getType().getText(method, TYPE_FORMAT_FLAGS),
    returnType: signature.getReturnType().getText(method, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(method),
  }
}

/** Processes a class property declaration into a metadata object. */
function processClassPropertyDeclaration(
  property: PropertyDeclaration
): ClassPropertyMetadata {
  return {
    kind: 'ClassProperty',
    name: property.getName(),
    scope: getScope(property),
    visibility: getVisibility(property),
    isReadonly: property.isReadonly(),
    type: property.getType().getText(property, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(property),
  }
}

/** Processes a signature parameter into a metadata object. */
function processParameterType(
  parameterDeclaration: ParameterDeclaration,
  enclosingNode: Node,
  propertyFilter?: PropertyFilter
): ParameterMetadata {
  if (parameterDeclaration === undefined) {
    throw new Error('Cannot process undefined parameter declaration.')
  }
  const parameterType = parameterDeclaration.getType()
  const defaultValue = parameterDeclaration.getInitializer()?.getText()
  const isObjectBindingPattern = Node.isObjectBindingPattern(
    parameterDeclaration.getNameNode()
  )
  const metadata: ParameterMetadata = {
    defaultValue,
    kind: 'Value',
    name: isObjectBindingPattern ? undefined : parameterDeclaration.getName(),
    required: !parameterDeclaration.hasQuestionToken() && !defaultValue,
    type: parameterType.getText(enclosingNode, TYPE_FORMAT_FLAGS),
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

  if (parameterType.getCallSignatures().length > 0) {
    ;(metadata as ParameterMetadata).kind = 'FunctionValue'
    Object.assign(metadata, processFunctionType(parameterType))
  } else if (!isPrimitiveType(parameterType)) {
    ;(metadata as ParameterMetadata).kind = 'ObjectValue'
    if (parameterType.isUnion()) {
      Object.assign(
        metadata,
        processUnionType(
          parameterType,
          enclosingNode,
          propertyFilter,
          defaultValues
        )
      )
    } else {
      Object.assign(metadata, {
        properties: processTypeProperties(
          parameterType,
          enclosingNode,
          propertyFilter,
          defaultValues
        ),
      })
    }
  }

  return metadata
}

/** Processes union types into an array of property arrays. */
function processUnionType(
  unionType: Type<ts.UnionType>,
  enclosingNode: Node,
  propertyFilter?: PropertyFilter,
  defaultValues?: Record<string, any>
) {
  const unionTypeInNodeModules = getSymbolDeclaration(unionType.getSymbol())
    ?.getSourceFile()
    .isInNodeModules()
  const allUnionTypes = unionType
    .getUnionTypes()
    .map((subType) =>
      processTypeProperties(
        subType,
        enclosingNode,
        propertyFilter,
        defaultValues,
        !unionTypeInNodeModules
      )
    )
  const { duplicates, filtered } = parseDuplicateTypes(allUnionTypes)

  return {
    properties: duplicates,
    unionProperties: filtered,
  }
}

/** Processes the properties of a type. */
function processTypeProperties(
  type: Type,
  enclosingNode: Node,
  propertyFilter?: PropertyFilter,
  defaultValues: Record<string, any> = {},
  isUsedLocally = false
): PropertyMetadata[] {
  // Handle intersection types by recursively processing each type in the intersection
  if (type.isIntersection()) {
    const intersectionTypes = type.getIntersectionTypes()

    return intersectionTypes.flatMap((intersectType) =>
      processTypeProperties(
        intersectType,
        enclosingNode,
        propertyFilter,
        defaultValues,
        isUsedLocally
      )
    )
  }

  const typeMetadata = getTypeMetadata(type, enclosingNode)

  if (typeMetadata.isInNodeModules) {
    /** If the node modules type is used locally, return the type text and the library that it is from. */
    if (isUsedLocally) {
      return [
        {
          kind: 'Value',
          type: type.getText(enclosingNode, TYPE_FORMAT_FLAGS),
        },
      ]
    }

    /** If no property filter is provided, short-circuit for types in node_modules. */
    if (!propertyFilter) {
      return []
    }
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
        kind: 'Value',
        required: symbol ? !symbol.isOptional() : true,
        type: type.getText(enclosingNode, TYPE_FORMAT_FLAGS),
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
      processProperty(property, enclosingNode, propertyFilter, defaultValues)
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

function defaultPropertyFilter(property: PropertySignature | MethodSignature) {
  return !property.getSourceFile().isInNodeModules()
}

function processProperty(
  property: Symbol,
  enclosingNode: Node,
  filter: (
    property: PropertySignature | MethodSignature
  ) => boolean = defaultPropertyFilter,
  defaultValues?: Record<string, any>
): PropertyMetadata | undefined {
  const declaration = getSymbolDeclaration(property)
  const isPropertySignature = Node.isPropertySignature(declaration)
  const isMethodSignature = Node.isMethodSignature(declaration)

  if ((isPropertySignature || isMethodSignature) && !filter(declaration)) {
    return
  }

  const propertyType = property.getTypeAtLocation(enclosingNode || declaration)
  const propertyName = property.getName()
  const defaultValue = defaultValues?.[propertyName]
  const propertyMetadata: PropertyMetadata = {
    defaultValue,
    kind: 'Value',
    name: propertyName,
    required: !property.isOptional() && defaultValue === undefined,
    type: propertyType.getText(enclosingNode, TYPE_FORMAT_FLAGS),
  }
  const jsDocMetadata = declaration ? getJsDocMetadata(declaration) : undefined

  if (jsDocMetadata) {
    propertyMetadata.description = jsDocMetadata.description
    propertyMetadata.tags = jsDocMetadata.tags
  } else {
    propertyMetadata.description = getSymbolDescription(property)
  }

  // Skip processing if the property declaration is a primitive type
  if (declaration && isPrimitiveType(declaration.getType())) {
    return propertyMetadata
  }

  const isObject = propertyType?.isObject()
  const isUnion = propertyType?.isUnion()

  if (isObject || isUnion) {
    const typeDeclaration = propertyType.getSymbol()?.getDeclarations()?.at(0)
    const isLocalType =
      enclosingNode && typeDeclaration
        ? enclosingNode.getSourceFile().getFilePath() ===
          typeDeclaration.getSourceFile().getFilePath()
        : false

    if (isLocalType || isUnion) {
      if (propertyType.getCallSignatures().length > 0) {
        ;(propertyMetadata as PropertyMetadata).kind = 'FunctionValue'
        Object.assign(propertyMetadata, processFunctionType(propertyType))
      } else if (!isPrimitiveType(propertyType)) {
        const firstChild = declaration?.getFirstChild()
        const defaultValues = Node.isObjectBindingPattern(firstChild)
          ? getDefaultValuesFromProperties(firstChild.getElements())
          : {}
        ;(propertyMetadata as PropertyMetadata).kind = 'ObjectValue'
        if (propertyType.isUnion()) {
          Object.assign(
            propertyMetadata,
            processUnionType(propertyType, enclosingNode, filter, defaultValues)
          )
        } else {
          Object.assign(propertyMetadata, {
            properties: processTypeProperties(
              propertyType,
              enclosingNode,
              filter,
              defaultValues
            ),
          })
        }
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

/** Parses duplicate types from an array of arrays. */
function parseDuplicateTypes<Item extends PropertyMetadata>(
  arrays: Item[][]
): { duplicates: Item[]; filtered: Item[][] } {
  const seenTypes = new Map<string, Item>()
  const duplicatesMap = new Map<string, Item>()
  const uniqueDuplicates: Item[] = []
  const getKey = (item: Item) => item.name + item.type

  for (let arrayIndex = 0; arrayIndex < arrays.length; arrayIndex++) {
    const array = arrays[arrayIndex]

    for (let itemIndex = 0; itemIndex < array.length; itemIndex++) {
      const item = array[itemIndex]
      const key = getKey(item)

      if (seenTypes.has(key)) {
        if (!duplicatesMap.has(key)) {
          duplicatesMap.set(key, item)
          uniqueDuplicates.push(item)
        }
      } else {
        seenTypes.set(key, item)
      }
    }
  }

  const filteredArrays: Item[][] = arrays.map((array) =>
    array.filter((item) => !duplicatesMap.has(getKey(item)))
  )

  return {
    duplicates: uniqueDuplicates,
    filtered: filteredArrays,
  }
}
