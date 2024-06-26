import {
  Node,
  Type,
  TypeFormatFlags,
  type Signature,
  type Symbol,
} from 'ts-morph'

import { getJsDocMetadata } from '../js-docs'
import { getDefaultValuesFromProperties } from '../properties'
import { getSymbolDescription } from '../symbols'

export interface SharedProperty {
  name?: string
  description?: string
  tags?: { tagName: string; text?: string }[]
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

export interface IntersectionProperty extends SharedProperty {
  kind: 'Intersection'
  type: string
  properties: ProcessedProperty[]
}

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
  parameters: ProcessedProperty[]
  type: string
  returnType: string
}

export interface InterfaceProperty extends SharedProperty {
  kind: 'Interface'
  type: string
  properties: ProcessedProperty[]
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
  | IntersectionProperty
  | TupleProperty
  | FunctionProperty
  | InterfaceProperty
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
  isRootType: boolean = true
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
          return {
            kind: 'Utility',
            type: typeText,
            arguments: aliasTypeArguments
              .map((type) =>
                processType(type, declaration, filter, references, false)
              )
              .filter(Boolean) as ProcessedProperty[],
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
    (symbolMetadata.isExternal && !symbolMetadata.isInNodeModules) ||
    /** If the symbol is located in node_modules and not global it is also treated as a reference. */
    (!symbolMetadata.isGlobal && symbolMetadata.isInNodeModules) ||
    /** Finally, locally exported symbols are treated as a reference since they will be processed. */
    (!isRootType &&
      !symbolMetadata.isInNodeModules &&
      !symbolMetadata.isExternal &&
      symbolMetadata.isExported &&
      /** Don't treat generics as references since they operate on type arguments that need to be processed. */
      typeArguments.length === 0 &&
      aliasTypeArguments.length === 0)
  ) {
    return {
      kind: 'Reference',
      type: typeText,
    } satisfies ReferenceProperty
  }

  if (type.isArray()) {
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
    processedProperty = {
      name: symbolMetadata.name,
      kind: 'Union',
      type: typeText,
      properties: type
        .getUnionTypes()
        .map((unionType) =>
          processType(unionType, declaration, filter, references, false)
        )
        .filter(Boolean) as ProcessedProperty[],
    } satisfies UnionProperty
  } else if (type.isIntersection()) {
    processedProperty = {
      name: symbolMetadata.name,
      kind: 'Intersection',
      type: typeText,
      properties: type
        .getIntersectionTypes()
        .map((intersectionType) =>
          processType(intersectionType, declaration, filter, references, false)
        )
        .filter(Boolean) as ProcessedProperty[],
    } satisfies IntersectionProperty
  } else if (type.isTuple()) {
    processedProperty = {
      kind: 'Tuple',
      type: typeText,
      elements: processTypeTupleElements(type, declaration, filter, references),
    } satisfies TupleProperty
  } else {
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
    } else {
      const callSignatures = type.getCallSignatures()
      if (callSignatures.length > 0) {
        processedProperty = {
          name: symbolMetadata.name,
          kind: 'Function',
          type: typeText,
          signatures: processCallSignatures(callSignatures),
        } satisfies FunctionProperty
      } else if (type.isInterface()) {
        processedProperty = {
          kind: 'Interface',
          name: symbol ? symbol.getName() : undefined,
          type: typeText,
          properties: processTypeProperties(
            type,
            declaration,
            filter,
            references
          ),
        } satisfies InterfaceProperty
      } else if (isPrimitive) {
        processedProperty = {
          kind: 'Primitive',
          type: typeText,
        } satisfies PrimitiveProperty
      } else if (type.isObject()) {
        const properties = processTypeProperties(
          type,
          declaration,
          filter,
          references
        )

        // TODO: use appropriate kind based on declaration (isNode) rather than isObject
        // TODO: collapse nested generics and unions if possible while preserving important generics like Promise

        // If the type has no properties but has type arguments, we assume it is a generic type and process the type arguments
        if (properties.length === 0 && typeArguments.length > 0) {
          const processedTypeArguments = typeArguments
            .map((type) =>
              processType(type, declaration, filter, references, false)
            )
            .filter(Boolean) as ProcessedProperty[]

          // TODO: generics don't need to have arguments to be considered a generic type
          if (processedTypeArguments.length > 0) {
            processedProperty = {
              name: symbolMetadata.name,
              kind: 'Generic',
              type: typeText,
              arguments: processedTypeArguments,
            } satisfies GenericProperty
          }
        } else {
          processedProperty = {
            name: symbolMetadata.name,
            kind: 'Object',
            type: typeText,
            properties,
          } satisfies ObjectProperty
        }
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
  filter: SymbolFilter = defaultFilter
): FunctionSignature[] {
  return signatures.map((signature) => {
    const generics = signature
      .getTypeParameters()
      .map((parameter) => parameter.getText())
      .join(', ')
    const genericsText = generics ? `<${generics}>` : ''
    const parameters = signature
      .getParameters()
      .map((parameter) => {
        const parameterDeclaration = parameter.getDeclarations().at(0)
        const declaration = parameterDeclaration || enclosingNode

        // TODO: handle argument references e.g. (props: ButtonProps) => React.ReactNode

        if (declaration) {
          const parameterType = parameter.getTypeAtLocation(declaration)
          const processedType = processType(
            parameterType,
            enclosingNode,
            filter
          )

          if (processedType) {
            let name: string | undefined = parameter.getName()

            if (name.startsWith('_')) {
              name = undefined
            }

            return {
              ...processedType,
              name,
              description: getSymbolDescription(parameter),
            } satisfies ProcessedProperty
          }
        }
      })
      .filter(Boolean) as ProcessedProperty[]
    const returnType = signature
      .getReturnType()
      .getText(undefined, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope)
    // TODO: account for method, function declaration, etc.
    const simplifiedTypeText = `${genericsText}(${parameters
      .map((parameter) => `${parameter.name}: ${parameter.type}`)
      .join(', ')}) => ${returnType}`

    return {
      type: simplifiedTypeText,
      parameters,
      returnType,
    }
  })
}

/** Process all properties of a given type */
export function processTypeProperties(
  type: Type,
  enclosingNode?: Node,
  filter: SymbolFilter = defaultFilter,
  references: Set<string> = new Set()
): ProcessedProperty[] {
  // TODO: to determine if a property signature is filtered both the
  return type
    .getProperties()
    .map((property) => {
      const symbolMetadata = getSymbolMetadata(property, enclosingNode)
      const propertyDeclaration = property.getDeclarations().at(0)
      const declaration = propertyDeclaration || enclosingNode
      const filterResult = filter(symbolMetadata)

      if (filterResult === false) {
        return
      }

      if (declaration) {
        // Store the metadata of the enclosing node for file location comparison used in processType
        enclosingNodeMetadata.set(declaration, symbolMetadata)

        const propertyType = property.getTypeAtLocation(declaration)
        const processedProperty = processType(
          propertyType,
          declaration,
          filter,
          references
        )

        if (processedProperty) {
          return {
            ...processedProperty,
            ...getJsDocMetadata(declaration),
            name: property.getName(),
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
  references?: Set<string>
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
        references
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

  const declaration = symbol.getDeclarations().at(0)!
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
