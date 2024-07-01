import {
  Node,
  Type,
  TypeFormatFlags,
  type FunctionDeclaration,
  type MethodDeclaration,
  type ParameterDeclaration,
  type PropertySignature,
  type Signature,
  type Symbol,
} from 'ts-morph'

import { getJsDocMetadata } from '../js-docs'
import {
  getDefaultValueKey,
  getDefaultValuesFromProperties,
} from '../properties'
import { getSymbolDescription } from '../symbols'

export interface SharedProperty {
  /** The name of the symbol or declaration if it exists. */
  name?: string

  /** The description of the declaration if provided. */
  description?: string

  /** The tags of the declaration if provided. */
  tags?: { tagName: string; text?: string }[]

  /** Whether or not the property is optional. */
  isOptional?: boolean

  /** The default value of the property. */
  defaultValue?: unknown
}

export interface ArrayProperty extends SharedProperty {
  kind: 'Array'
  type: ProcessedProperty
}

export interface ObjectProperty extends SharedProperty {
  kind: 'Object'
  type: string
  properties: ProcessedProperty[]
}

export interface GenericProperty extends SharedProperty {
  kind: 'Generic'
  type: string
  arguments: ProcessedProperty[]
}

export interface UnionProperty extends SharedProperty {
  kind: 'Union'
  type: string
  properties: ProcessedProperty[]
}

// TODO: add UnionLiteral to handle union literals like 'foo' | 'bar' that can just print the type instead of each property
// this should also be the case for a UnionPrimitive type like string | number | boolean

export interface TupleProperty extends SharedProperty {
  kind: 'Tuple'
  type: string
  elements: ProcessedProperty[]
}

export interface BooleanProperty extends SharedProperty {
  kind: 'Boolean'
  type: string
}

export interface NumberProperty extends SharedProperty {
  kind: 'Number'
  type: string
}

export interface StringProperty extends SharedProperty {
  kind: 'String'
  type: string
}

export interface SymbolProperty extends SharedProperty {
  kind: 'Symbol'
  type: string
}

export interface FunctionProperty extends SharedProperty {
  kind: 'Function'
  type: string
  signatures: FunctionSignature[]
}

export interface FunctionSignature {
  modifier?: 'async' | 'generator'
  parameters: ProcessedProperty[]
  type: string
  returnType: string
}

export interface PrimitiveProperty extends SharedProperty {
  kind: 'Primitive'
  type: string
}

export interface UnknownProperty extends SharedProperty {
  kind: 'Unknown'
  type: string
}

export interface ReferenceProperty extends SharedProperty {
  kind: 'Reference'
  type: string
  // path?: string // TODO: add import specifier for external references and identifier for internal references
}

export interface UtilityProperty extends SharedProperty {
  kind: 'Utility'
  type: string
  arguments: ProcessedProperty[]
}

export type ProcessedProperty =
  | BooleanProperty
  | NumberProperty
  | StringProperty
  | SymbolProperty
  | GenericProperty
  | ArrayProperty
  | UnionProperty
  | TupleProperty
  | FunctionProperty
  | ObjectProperty
  | UnknownProperty
  | ReferenceProperty
  | PrimitiveProperty
  | UtilityProperty

export type SymbolMetadata = ReturnType<typeof getSymbolMetadata>

export type SymbolFilter = (symbolMetadata: SymbolMetadata) => boolean

const enclosingNodeMetadata = new WeakMap<Node, SymbolMetadata>()
const defaultFilter = (metadata: SymbolMetadata) => !metadata.isInNodeModules
const TYPE_FORMAT_FLAGS =
  TypeFormatFlags.NoTruncation |
  TypeFormatFlags.UseAliasDefinedOutsideCurrentScope

/** Process type metadata. */
export function processType(
  type: Type,
  enclosingNode?: Node,
  filter: SymbolFilter = defaultFilter,
  references: Set<string> = new Set(),
  isRootType: boolean = true,
  defaultValues?: Record<string, unknown> | unknown
): ProcessedProperty | undefined {
  const typeText = type.getText(enclosingNode, TYPE_FORMAT_FLAGS)
  const symbol = getTypeSymbol(type)
  const symbolMetadata = getSymbolMetadata(symbol, enclosingNode)
  const symbolDeclaration = symbol?.getDeclarations().at(0)
  const declaration = symbolDeclaration || enclosingNode
  const isPrimitive = isPrimitiveType(type)
  const typeArguments = type.getTypeArguments()
  const aliasTypeArguments = type.getAliasTypeArguments()

  let processedProperty: ProcessedProperty = {
    kind: 'Unknown',
    type: typeText,
  } satisfies UnknownProperty

  /** Determine if the enclosing type is referencing a type in node modules. */
  if (symbol && enclosingNode && !isPrimitive) {
    const enclosingSymbolMetadata = enclosingNodeMetadata.get(enclosingNode)
    const inSeparateProjects =
      enclosingSymbolMetadata?.isInNodeModules === false &&
      symbolMetadata.isInNodeModules

    if (inSeparateProjects) {
      /**
       * Additionally, we check if type arguments exist and are all located in node_modules before
       * treating the entire expression as a reference.
       */
      if (
        typeArguments.length === 0 ||
        isEveryTypeInNodeModules(typeArguments)
      ) {
        const isUtilityType = symbolMetadata.name
          ? UTILITY_TYPES.has(symbolMetadata.name)
          : false

        if (isUtilityType) {
          const processedTypeArguments = aliasTypeArguments
            .map((type) =>
              processType(type, declaration, filter, references, false)
            )
            .filter(Boolean) as ProcessedProperty[]

          if (processedTypeArguments.length === 0) {
            return undefined
          }

          return {
            kind: 'Utility',
            type: typeText,
            arguments: processedTypeArguments,
          } satisfies UtilityProperty
        } else {
          return {
            kind: 'Reference',
            type: typeText,
          } satisfies ReferenceProperty
        }
      }
    }
  }

  /** TODO: this should account for what's actually exported from package.json exports to determine what's processed. */
  if (
    /** If the current symbol is located outside of this source file it is treated as a reference. */
    ((symbolMetadata.isExternal && !symbolMetadata.isInNodeModules) ||
      /** If the symbol is located in node_modules and not global it is also treated as a reference. */
      (!symbolMetadata.isGlobal && symbolMetadata.isInNodeModules) ||
      /** Finally, locally exported symbols are treated as a reference since they will be processed. */
      (!isRootType &&
        !symbolMetadata.isInNodeModules &&
        !symbolMetadata.isExternal &&
        symbolMetadata.isExported)) &&
    /** Don't treat generics as references since they operate on type arguments that need to be processed. */
    typeArguments.length === 0 &&
    aliasTypeArguments.length === 0
  ) {
    return {
      kind: 'Reference',
      type: typeText,
    } satisfies ReferenceProperty
  }

  /** Detect self-references to avoid infinite recursion */
  if (references.has(typeText)) {
    return {
      kind: 'Reference',
      type: typeText,
    } satisfies ReferenceProperty
  }

  references.add(typeText)

  if (type.isBoolean() || type.isBooleanLiteral()) {
    processedProperty = {
      kind: 'Boolean',
      type: typeText,
    } satisfies BooleanProperty
  } else if (type.isNumber() || type.isNumberLiteral()) {
    processedProperty = {
      kind: 'Number',
      type: typeText,
    } satisfies NumberProperty
  } else if (type.isString() || type.isStringLiteral()) {
    processedProperty = {
      kind: 'String',
      type: typeText,
    } satisfies StringProperty
  } else if (isSymbol(type)) {
    return {
      kind: 'Symbol',
      type: typeText,
    } satisfies SymbolProperty
  } else if (type.isArray()) {
    const elementType = type.getArrayElementTypeOrThrow()
    const processedElementType = processType(
      elementType,
      declaration,
      filter,
      references,
      false
    )
    if (processedElementType) {
      processedProperty = {
        kind: 'Array',
        type: processedElementType,
      } satisfies ArrayProperty
    } else {
      return
    }
  } else if (type.isUnion()) {
    const processedUnionTypes = type
      .getUnionTypes()
      .map((unionType) =>
        processType(
          unionType,
          declaration,
          filter,
          references,
          false,
          defaultValues
        )
      )
      .filter(Boolean) as ProcessedProperty[]

    if (processedUnionTypes.length === 0) {
      return undefined
    }

    processedProperty = {
      name: symbolMetadata.name,
      kind: 'Union',
      type: typeText,
      properties: processedUnionTypes
        // Flatten boolean literals to just 'boolean' if both values are present
        // TODO: optimize and only loop once
        .reduce((allProperties, property, index) => {
          const previousProperty = processedUnionTypes.at(index - 1)

          // Remove previous boolean literal if the current property is a boolean as well
          if (
            property.kind === 'Boolean' &&
            previousProperty?.kind === 'Boolean'
          ) {
            allProperties.pop()
            property.type = 'boolean'
          }

          allProperties.push(property)

          return allProperties
        }, [] as ProcessedProperty[]),
    } satisfies UnionProperty
  } else if (type.isIntersection()) {
    const processedIntersectionTypes = type
      .getIntersectionTypes()
      .map((intersectionType) =>
        processType(
          intersectionType,
          declaration,
          filter,
          references,
          false,
          defaultValues
        )
      )
      .filter(Boolean) as ProcessedProperty[]

    // Intersection types can safely merge the immediate object properties to reduce nesting
    const properties: ProcessedProperty[] = []

    for (const processedType of processedIntersectionTypes) {
      if (processedType.kind === 'Object') {
        properties.push(...processedType.properties)
      } else {
        properties.push(processedType)
      }
    }

    if (properties.length === 0) {
      return undefined
    }

    processedProperty = {
      name: symbolMetadata.name,
      kind: 'Object',
      type: typeText,
      properties,
    } satisfies ObjectProperty
  } else if (type.isTuple()) {
    const elements = processTypeTupleElements(
      type,
      declaration,
      filter,
      references,
      false
    )

    if (elements.length === 0) {
      return undefined
    }

    processedProperty = {
      kind: 'Tuple',
      type: typeText,
      elements,
    } satisfies TupleProperty
  } else {
    const callSignatures = type.getCallSignatures()

    if (callSignatures.length > 0) {
      processedProperty = {
        name: symbolMetadata.name,
        kind: 'Function',
        type: typeText,
        signatures: processCallSignatures(
          callSignatures,
          declaration,
          filter,
          references,
          false
        ),
      } satisfies FunctionProperty
    } else if (isPrimitive) {
      processedProperty = {
        kind: 'Primitive',
        type: typeText,
      } satisfies PrimitiveProperty
    } else if (typeArguments.length > 0) {
      const processedTypeArguments = typeArguments
        .map((type) =>
          processType(
            type,
            declaration,
            filter,
            references,
            false,
            defaultValues
          )
        )
        .filter(Boolean) as ProcessedProperty[]

      if (processedTypeArguments.length === 0) {
        return
      }

      processedProperty = {
        name: symbolMetadata.name,
        kind: 'Generic',
        type: typeText,
        arguments: processedTypeArguments,
      } satisfies GenericProperty
    } else if (type.isObject()) {
      const properties = processTypeProperties(
        type,
        declaration,
        filter,
        references,
        false,
        defaultValues
      )

      if (properties.length === 0) {
        return undefined
      }

      processedProperty = {
        name: symbolMetadata.name,
        kind: 'Object',
        type: typeText,
        properties,
      } satisfies ObjectProperty
    } else {
      /** Finally, try to process the apparent type if it is different from the current type. */
      const apparentType = type.getApparentType()

      if (type !== apparentType) {
        return processType(
          apparentType,
          declaration,
          filter,
          references,
          false,
          defaultValues
        )
      }
    }
  }

  references.delete(typeText)

  return processedProperty
}

/** Process all function signatures of a given type including their parameters and return types. */
export function processCallSignatures(
  signatures: Signature[],
  enclosingNode?: Node,
  filter: SymbolFilter = defaultFilter,
  references: Set<string> = new Set(),
  isRootType: boolean = true
): FunctionSignature[] {
  return signatures.map((signature) =>
    processSignature(signature, enclosingNode, filter, references, isRootType)
  )
}

/** Process a single function signature including its parameters and return type. */
export function processSignature(
  signature: Signature,
  enclosingNode?: Node,
  filter: SymbolFilter = defaultFilter,
  references: Set<string> = new Set(),
  isRootType: boolean = true
): FunctionSignature {
  const signatureDeclaration = signature.getDeclaration()
  const signatureParameters = signature.getParameters()
  const parameterDeclarations = signatureParameters.map((parameter) =>
    parameter.getDeclarations().at(0)
  ) as (ParameterDeclaration | undefined)[]
  const generics = signature
    .getTypeParameters()
    .map((parameter) => parameter.getText())
    .join(', ')
  const genericsText = generics ? `<${generics}>` : ''
  const defaultValues = getDefaultValuesFromProperties(
    parameterDeclarations.filter(Boolean) as ParameterDeclaration[]
  )
  const parameters = signatureParameters
    .map((parameter, index) => {
      const parameterDeclaration = parameterDeclarations[index]
      const isOptional = parameterDeclaration
        ? parameterDeclaration.hasQuestionToken()
        : undefined
      const declaration = parameterDeclaration || enclosingNode

      if (declaration) {
        const defaultValue = parameterDeclaration
          ? defaultValues[getDefaultValueKey(parameterDeclaration)]
          : undefined
        const processedType = processType(
          parameter.getTypeAtLocation(signatureDeclaration),
          enclosingNode,
          filter,
          references,
          isRootType,
          defaultValue
        )

        if (processedType) {
          let name: string | undefined = parameter.getName()

          if (name.startsWith('_')) {
            name = undefined
          }

          return {
            ...processedType,
            name,
            defaultValue,
            isOptional: isOptional ?? Boolean(defaultValue),
            description: getSymbolDescription(parameter),
          } satisfies ProcessedProperty
        }
      } else {
        throw new Error(
          `[processCallSignatures]: No parameter declaration found for "${parameter.getName()}". You must pass the enclosing node as the second argument to "processCallSignatures".`
        )
      }
    })
    .filter(Boolean) as ProcessedProperty[]
  const returnType = signature
    .getReturnType()
    .getText(undefined, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope)
  const parametersText = parameters
    .map((parameter) => {
      const questionMark = parameter.isOptional ? '?' : ''
      return parameter.name
        ? `${parameter.name}${questionMark}: ${parameter.type}`
        : parameter.type
    })
    .join(', ')
  let simplifiedTypeText: string

  if (Node.isFunctionDeclaration(signatureDeclaration)) {
    simplifiedTypeText = `function ${signatureDeclaration.getName()}${genericsText}(${parametersText}): ${returnType}`
  } else {
    simplifiedTypeText = `${genericsText}(${parametersText}) => ${returnType}`
  }

  const modifier: ReturnType<typeof getModifier> =
    Node.isFunctionDeclaration(signatureDeclaration) ||
    Node.isMethodDeclaration(signatureDeclaration)
      ? getModifier(signatureDeclaration)
      : undefined

  return {
    type: simplifiedTypeText,
    modifier,
    parameters,
    returnType,
  }
}

/** Process all apparent properties of a given type. */
export function processTypeProperties(
  type: Type,
  enclosingNode?: Node,
  filter: SymbolFilter = defaultFilter,
  references: Set<string> = new Set(),
  isRootType: boolean = true,
  defaultValues?: Record<string, unknown> | unknown
): ProcessedProperty[] {
  return type
    .getApparentProperties()
    .map((property) => {
      const symbolMetadata = getSymbolMetadata(property, enclosingNode)
      const propertyDeclaration = property.getDeclarations().at(0) as
        | PropertySignature
        | undefined
      const isOptional = propertyDeclaration
        ? propertyDeclaration.hasQuestionToken()
        : false
      const declaration = propertyDeclaration || enclosingNode
      const filterResult = filter(symbolMetadata)

      if (filterResult === false) {
        return
      }

      if (declaration) {
        const name = property.getName()
        const defaultValue =
          defaultValues && propertyDeclaration
            ? (defaultValues as Record<string, unknown>)[
                getDefaultValueKey(propertyDeclaration)
              ]
            : undefined

        // Store the metadata of the enclosing node for file location comparison used in processType
        enclosingNodeMetadata.set(declaration, symbolMetadata)

        const propertyType = property.getTypeAtLocation(declaration)
        const processedProperty = processType(
          propertyType,
          declaration,
          filter,
          references,
          isRootType,
          defaultValue
        )

        if (processedProperty) {
          return {
            ...processedProperty,
            ...getJsDocMetadata(declaration),
            name,
            defaultValue,
            isOptional: isOptional || Boolean(defaultValue),
          } satisfies ProcessedProperty
        }
      } else {
        throw new Error(
          `[processTypeProperties]: No property declaration found for "${property.getName()}". You must pass the enclosing node as the second argument to "processTypeProperties".`
        )
      }
    })
    .filter(Boolean) as ProcessedProperty[]
}

/** Process all elements of a tuple type. */
function processTypeTupleElements(
  type: Type,
  enclosingNode?: Node,
  filter?: SymbolFilter,
  references: Set<string> = new Set(),
  isRootType: boolean = true
) {
  const tupleNames = type
    .getText()
    .slice(1, -1)
    .split(',')
    .map((signature) => {
      const [name] = signature.split(':')
      return name ? name.trim() : undefined
    })
  return type
    .getTupleElements()
    .map((tupleElementType, index) => {
      const processedType = processType(
        tupleElementType,
        enclosingNode,
        filter,
        references,
        isRootType
      )
      if (processedType) {
        return {
          ...processedType,
          name: tupleNames[index],
        } satisfies ProcessedProperty
      }
    })
    .filter(Boolean) as ProcessedProperty[]
}

/** Check if every type argument is in node_modules. */
function isEveryTypeInNodeModules(types: Type[]) {
  return types.every((type) =>
    type.getSymbol()?.getDeclarations().at(0)?.getSourceFile().isInNodeModules()
  )
}

/** Checks if a type is a primitive type. */
function isPrimitiveType(type: Type) {
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
    type.isNever() ||
    isSymbol(type) ||
    isBigInt(type)
  )
}

/** Check if a type is a symbol. */
function isSymbol(type: Type) {
  const symbol = type.getSymbol()
  return symbol?.getName() === 'Symbol'
}

/** Check if a type is a bigint. */
function isBigInt(type: Type) {
  return type.getText() === 'bigint'
}

/** Attempt to get the symbol of a type. */
function getTypeSymbol(type: Type): Symbol | undefined {
  const symbol = type.getAliasSymbol() || type.getSymbol()
  if (!symbol) {
    const apparentType = type.getApparentType()
    return apparentType.getAliasSymbol() || apparentType.getSymbol()
  }
  return symbol
}

/** Gather metadata about a symbol. */
function getSymbolMetadata(
  symbol?: Symbol,
  enclosingNode?: Node
): {
  /** The name of the symbol if it exists. */
  name?: string

  /** Whether or not the symbol is exported. */
  isExported: boolean

  /** Whether or not the symbol is external to the current source file. */
  isExternal: boolean

  /** Whether or not the symbol is located in node_modules. */
  isInNodeModules: boolean

  /** Whether or not the symbol is global. */
  isGlobal: boolean
} {
  if (!symbol) {
    return {
      isExported: false,
      isExternal: false,
      isInNodeModules: false,
      isGlobal: false,
    }
  }

  const declarations = symbol.getDeclarations()

  if (declarations.length === 0) {
    return {
      isExported: false,
      isExternal: false,
      isInNodeModules: false,
      isGlobal: false,
    }
  }

  const declaration = declarations.at(0)!
  const declarationSourceFile = declaration?.getSourceFile()
  const enclosingSourceFile = enclosingNode?.getSourceFile()

  /** Attempt to get the name of the symbol. */
  let name: string | undefined = symbol.getName()

  if ('getName' in declaration) {
    // @ts-expect-error - getName is not defined on all declaration types
    name = declaration.getName()
  }

  // Ignore private symbol names e.g. __type, __call, __0, etc.
  if (name?.startsWith('__')) {
    name = undefined
  }

  /** Check if the symbol is exported if it is not the enclosing node. */
  let isExported = false

  if (enclosingNode !== declaration && 'isExported' in declaration) {
    // @ts-expect-error - isExported is not defined on all declaration types
    isExported = declaration.isExported()
  }

  /** Check if a type is external to the enclosing source file. */
  let isExternal = false

  // TODO: this is not sufficient because the enclosing node can be from node modules e.g. Promise
  // this should use a root source file to determine if the symbol is external
  if (enclosingSourceFile && !enclosingSourceFile.isInNodeModules()) {
    isExternal = enclosingSourceFile !== declarationSourceFile
  }

  const isInNodeModules = declarationSourceFile.isInNodeModules()

  return {
    name,
    isExported,
    isExternal,
    isInNodeModules,
    isGlobal: isInNodeModules && !isExported,
  }
}

/** Get the modifier of a function or method declaration. */
function getModifier(node: FunctionDeclaration | MethodDeclaration) {
  if (node.isAsync()) {
    return 'async'
  }

  if (node.isGenerator()) {
    return 'generator'
  }
}

const UTILITY_TYPES = new Set([
  'Awaited',
  'Partial',
  'Required',
  'Readonly',
  'Record',
  'Pick',
  'Omit',
  'Exclude',
  'Extract',
  'NonNullable',
  'Parameters',
  'ConstructorParameters',
  'ReturnType',
  'InstanceType',
  'NoInfer',
  'ThisParameterType',
  'OmitThisParameter',
  'ThisType',
  'Uppercase',
  'Lowercase',
  'Capitalize',
  'Uncapitalize',
])
