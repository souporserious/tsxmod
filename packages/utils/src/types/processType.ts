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

export interface UnionProperty extends SharedProperty {
  kind: 'Union'
  type: string
  properties: ProcessedProperty[]
}

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

export interface LiteralProperty extends SharedProperty {
  kind: 'Literal'
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

export interface PromiseProperty extends SharedProperty {
  kind: 'Promise'
  type: ProcessedProperty
}

export interface UnknownProperty extends SharedProperty {
  kind: 'Unknown'
  type: string
}

export interface ReferenceProperty extends SharedProperty {
  kind: 'Reference'
  type: string
}

export type ProcessedProperty =
  | BooleanProperty
  | NumberProperty
  | StringProperty
  | LiteralProperty
  | PromiseProperty
  | ArrayProperty
  | UnionProperty
  | IntersectionProperty
  | TupleProperty
  | FunctionProperty
  | InterfaceProperty
  | ObjectProperty
  | UnknownProperty
  | ReferenceProperty

const processedTypesCache = new Map<string, ProcessedProperty>()

/** Process type metadata. */
export function processType(
  type: Type,
  references: Set<string> = new Set()
): ProcessedProperty {
  const typeText = type.getText(
    undefined,
    TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
  )

  // Check if the type has already been processed
  if (processedTypesCache.has(typeText)) {
    return processedTypesCache.get(typeText)!
  }

  // Detect recursion and return a reference
  if (references.has(typeText)) {
    return {
      kind: 'Reference',
      type: typeText,
    } satisfies ReferenceProperty
  }

  references.add(typeText)

  const symbol = type.getAliasSymbol() || type.getSymbol()
  let name = symbol ? symbol.getName() : undefined

  if (
    name === '__type' ||
    name === '__call' ||
    name === '__new' ||
    name === '__object'
  ) {
    name = undefined
  }

  let processedProperty: ProcessedProperty

  if (type.isBoolean()) {
    processedProperty = {
      kind: 'Boolean',
      type: typeText,
    } satisfies BooleanProperty
  } else if (type.isNumber()) {
    processedProperty = {
      kind: 'Number',
      type: typeText,
    } satisfies NumberProperty
  } else if (type.isString()) {
    processedProperty = {
      kind: 'String',
      type: typeText,
    } satisfies StringProperty
  } else if (type.isLiteral()) {
    processedProperty = {
      kind: 'Literal',
      type: typeText,
    } satisfies LiteralProperty
  } else if (isPromise(type)) {
    const [promiseType] = type.getTypeArguments()
    processedProperty = {
      kind: 'Promise',
      type: processType(promiseType, references),
    } satisfies PromiseProperty
  } else if (type.isArray()) {
    const elementType = type.getArrayElementTypeOrThrow()
    processedProperty = {
      kind: 'Array',
      type: processType(elementType, references),
    } satisfies ArrayProperty
  } else if (type.isUnion()) {
    processedProperty = {
      name,
      kind: 'Union',
      type: typeText,
      properties: type
        .getUnionTypes()
        .map((unionType) => processType(unionType, references)),
    } satisfies UnionProperty
  } else if (type.isIntersection()) {
    processedProperty = {
      name,
      kind: 'Intersection',
      type: typeText,
      properties: type
        .getIntersectionTypes()
        .map((intersectionType) => processType(intersectionType, references)),
    } satisfies IntersectionProperty
  } else if (type.isTuple()) {
    const tupleNames = type
      .getText()
      .slice(1, -1)
      .split(',')
      .map((signature) => {
        const [name] = signature.split(':')
        return name ? name.trim() : undefined
      })
    processedProperty = {
      kind: 'Tuple',
      type: typeText,
      elements: type.getTupleElements().map((tupleElementType, index) => ({
        ...processType(tupleElementType, references),
        name: tupleNames[index],
      })) satisfies ProcessedProperty[],
    } satisfies TupleProperty
  } else {
    const callSignatures = type.getCallSignatures()
    if (callSignatures.length > 0) {
      processedProperty = {
        name,
        kind: 'Function',
        type: typeText,
        signatures: processCallSignatures(callSignatures),
      } satisfies FunctionProperty
    } else if (type.isInterface()) {
      const symbol = type.getAliasSymbol()
      processedProperty = {
        kind: 'Interface',
        name: symbol ? symbol.getName() : undefined,
        type: typeText,
        properties: processTypeProperties(
          type,
          // @ts-expect-error - private argument
          references
        ),
      } satisfies InterfaceProperty
    } else if (type.isObject()) {
      processedProperty = {
        name,
        kind: 'Object',
        type: typeText,
        properties: processTypeProperties(
          type,
          // @ts-expect-error - private argument
          references
        ),
      } satisfies ObjectProperty
    } else {
      processedProperty = {
        kind: 'Unknown',
        type: typeText,
      } satisfies UnknownProperty
    }
  }

  references.delete(typeText)
  processedTypesCache.set(typeText, processedProperty)

  return processedProperty
}

/** Process all function signatures of a given type including their parameters and return types. */
export function processCallSignatures(
  signatures: Signature[]
): FunctionSignature[] {
  return signatures.map((signature) => {
    const generics = signature
      .getTypeParameters()
      .map((parameter) => parameter.getText())
      .join(', ')
    const genericsText = generics ? `<${generics}>` : ''
    const parameters = signature.getParameters().map((parameter) => {
      const parameterDeclaration = getSymbolDeclarationOrThrow(parameter)
      const parameterType = parameter.getTypeAtLocation(parameterDeclaration)
      return {
        ...processType(parameterType),
        name: parameter.getName(),
        description: getSymbolDescription(parameter),
      } satisfies ProcessedProperty
    })
    const returnType = signature
      .getReturnType()
      .getText(undefined, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope)
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
export function processTypeProperties(type: Type): ProcessedProperty[] {
  const references: Set<string> = arguments[1] || new Set()
  return type.getProperties().map((property) => {
    const propertyDeclaration = getSymbolDeclarationOrThrow(property)
    const propertyType = property.getTypeAtLocation(propertyDeclaration)
    return {
      ...processType(propertyType, references),
      ...getJsDocMetadata(propertyDeclaration),
      name: property.getName(),
    } satisfies ProcessedProperty
  })
}

/** Attempt to get the declaration of a symbol or throw an error. */
function getSymbolDeclarationOrThrow<DeclarationType extends Node = Node>(
  symbol: Symbol
) {
  const [declaration] = symbol.getDeclarations()
  if (!declaration) {
    throw new Error(
      `Could not find declaration for symbol: ${symbol.getName()}`
    )
  }
  return declaration as DeclarationType
}

/** Check if a type is a promise. */
function isPromise(type: Type) {
  const symbol = type.getSymbol()
  if (!symbol) {
    return false
  }
  const typeArguments = type.getTypeArguments()
  return symbol.getName() === 'Promise' && typeArguments.length === 1
}
