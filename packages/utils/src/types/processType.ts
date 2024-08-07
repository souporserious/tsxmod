import {
  Node,
  Type,
  TypeFormatFlags,
  SyntaxKind,
  type ClassDeclaration,
  type FunctionDeclaration,
  type ParameterDeclaration,
  type Project,
  type PropertyDeclaration,
  type PropertySignature,
  type MethodDeclaration,
  type SetAccessorDeclaration,
  type GetAccessorDeclaration,
  type Signature,
  type Symbol,
  type TypeNode,
} from 'ts-morph'

import { getJsDocMetadata } from '../js-docs'
import {
  getPropertyDefaultValueKey,
  getPropertyDefaultValue,
} from '../properties'
import { getSymbolDescription } from '../symbols'

export interface BaseType {
  /** Distinguishs between different kinds of types, such as primitives, objects, classes, functions, etc. */
  kind?: unknown

  /** The name of the symbol or declaration if it exists. */
  name?: string

  /** The description of the symbol or declaration if it exists. */
  description?: string

  /** JSDoc tags for the declaration if present. */
  tags?: { tagName: string; text?: string }[]

  /** A stringified representation of the type. */
  type: string

  /** The path to the file where the symbol declaration is located. */
  path?: string

  /** The line and column number of the symbol declaration. */
  position?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export interface ParameterType extends BaseType {
  /** The default value assigned to the property parsed as a literal value if possible. */
  defaultValue?: unknown

  /** Whether or not the property has an optional modifier or default value. */
  isOptional?: boolean
}

export type CreateParameterType<Type> = Type extends any
  ? Type & ParameterType
  : never

export interface PropertyType extends BaseType {
  /** The default value assigned to the property parsed as a literal value if possible. */
  defaultValue?: unknown

  /** Whether or not the property has an optional modifier or default value. */
  isOptional?: boolean

  /** Whether or not the property has a readonly modifier. */
  isReadonly?: boolean
}

export type CreatePropertyType<Type> = Type extends any
  ? Type & PropertyType
  : never

export interface StringType extends BaseType {
  kind: 'String'
  value?: string
}

export interface NumberType extends BaseType {
  kind: 'Number'
  value?: number
}

export interface BooleanType extends BaseType {
  kind: 'Boolean'
}

export interface SymbolType extends BaseType {
  kind: 'Symbol'
}

export interface ArrayType extends BaseType {
  kind: 'Array'
  element: ProcessedType
}

export interface TupleType extends BaseType {
  kind: 'Tuple'
  elements: ProcessedType[]
}

export interface ObjectType extends BaseType {
  kind: 'Object'
  properties: PropertyTypes[]
}

export interface IntersectionType extends BaseType {
  kind: 'Intersection'
  properties: ProcessedType[]
}

export interface EnumType extends BaseType {
  kind: 'Enum'
  members: Record<string, string | number | undefined>
}

export interface UnionType extends BaseType {
  kind: 'Union'
  members: ProcessedType[]
}

export interface ClassType extends BaseType {
  kind: 'Class'
  constructors?: ReturnType<typeof processCallSignatures>
  accessors?: ClassAccessorType[]
  methods?: ClassMethodType[]
  properties?: ClassPropertyType[]
}

export interface SharedClassMemberType extends BaseType {
  scope?: 'abstract' | 'static'
  visibility?: 'private' | 'protected' | 'public'
}

export interface ClassGetAccessorType extends SharedClassMemberType {
  kind: 'ClassGetAccessor'
}

export type ClassSetAccessorType = SharedClassMemberType & {
  kind: 'ClassSetAccessor'
} & Omit<FunctionSignatureType, 'kind'>

export type ClassAccessorType = ClassGetAccessorType | ClassSetAccessorType

export interface ClassMethodType extends SharedClassMemberType {
  kind: 'ClassMethod'
  signatures: FunctionSignatureType[]
}

export type ClassPropertyType = BaseTypes &
  SharedClassMemberType & {
    defaultValue?: unknown
    isReadonly: boolean
  }

export interface FunctionSignatureType extends BaseType {
  kind: 'FunctionSignature'
  modifier?: 'async' | 'generator'
  parameters: ParameterTypes[]
  returnType: string
}

export interface FunctionType extends BaseType {
  kind: 'Function'
  signatures: FunctionSignatureType[]
}

export interface ComponentSignatureType extends BaseType {
  kind: 'ComponentSignature'
  modifier?: 'async' | 'generator'
  parameter?: ObjectType | ReferenceType
  returnType: string
}

export interface ComponentType extends BaseType {
  kind: 'Component'
  signatures: ComponentSignatureType[]
}

export interface PrimitiveType extends BaseType {
  kind: 'Primitive'
}

export interface ReferenceType extends BaseType {
  kind: 'Reference'
}

export interface GenericType extends BaseType {
  kind: 'Generic'
  typeName: string
  arguments: ParameterTypes[]
}

export interface UnknownType extends BaseType {
  kind: 'Unknown'
}

export type BaseTypes =
  | StringType
  | NumberType
  | BooleanType
  | SymbolType
  | ArrayType
  | TupleType
  | ObjectType
  | IntersectionType
  | EnumType
  | UnionType
  | ClassType
  | FunctionType
  | ComponentType
  | PrimitiveType
  | ReferenceType
  | GenericType
  | UnknownType

export type AllTypes =
  | BaseTypes
  | ClassAccessorType
  | ClassMethodType
  | FunctionSignatureType
  | ComponentSignatureType

export type TypeByKind<Type, Key> = Type extends { kind: Key } ? Type : never

export type TypeOfKind<Key extends AllTypes['kind']> = TypeByKind<AllTypes, Key>

export type ParameterTypes = CreateParameterType<BaseTypes>

export type PropertyTypes = CreatePropertyType<BaseTypes>

export type ProcessedType = BaseTypes | ParameterTypes | PropertyTypes

export type SymbolMetadata = ReturnType<typeof getSymbolMetadata>

export type SymbolFilter = (symbolMetadata: SymbolMetadata) => boolean

const typeReferences = new WeakSet<Type>()
const objectReferences = new Set<string>()
const enclosingNodeMetadata = new WeakMap<Node, SymbolMetadata>()
const defaultFilter = (metadata: SymbolMetadata) => !metadata.isInNodeModules
const TYPE_FORMAT_FLAGS =
  TypeFormatFlags.NoTruncation |
  TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
  TypeFormatFlags.WriteArrayAsGenericType

/** Process type metadata. */
export function processType(
  type: Type,
  enclosingNode?: Node,
  filter: SymbolFilter = defaultFilter,
  isRootType: boolean = true,
  defaultValues?: Record<string, unknown> | unknown,
  useReferences: boolean = true
): ProcessedType | undefined {
  const symbol =
    // First, attempt to get the aliased symbol for imported and aliased types
    type.getAliasSymbol() ||
    // Next, try to get the symbol of the type itself
    type.getSymbol() ||
    // Finally, try to get the symbol of the apparent type
    type.getApparentType().getSymbol()
  const symbolMetadata = getSymbolMetadata(symbol, enclosingNode)
  const symbolDeclaration = symbol?.getDeclarations().at(0)
  const isPrimitive = isPrimitiveType(type)
  const declaration = symbolDeclaration || enclosingNode
  const typeArguments = type.getTypeArguments()
  const aliasTypeArguments = type.getAliasTypeArguments()
  let typeName: string | undefined = symbolDeclaration
    ? (symbolDeclaration as any)?.getNameNode?.()?.getText()
    : undefined
  let typeText = type.getText(enclosingNode, TYPE_FORMAT_FLAGS)
  let declarationLocation: ReturnType<typeof getDeclarationLocation> = {}

  if (declaration) {
    /* Use the enclosing node's location if it is a member. */
    const isMember =
      Node.isVariableDeclaration(enclosingNode) ||
      Node.isPropertyAssignment(enclosingNode) ||
      Node.isPropertySignature(enclosingNode) ||
      Node.isMethodSignature(enclosingNode) ||
      Node.isParameterDeclaration(enclosingNode) ||
      Node.isPropertyDeclaration(enclosingNode) ||
      Node.isMethodDeclaration(enclosingNode) ||
      Node.isGetAccessorDeclaration(enclosingNode) ||
      Node.isSetAccessorDeclaration(enclosingNode)

    declarationLocation = getDeclarationLocation(
      isMember ? enclosingNode : declaration
    )
  }

  /* Use the generic name and type text if the type is a type alias or property signature. */
  let genericTypeArguments: TypeNode[] = []
  let genericTypeName = ''
  let genericTypeText = ''

  if (
    typeArguments.length === 0 &&
    (Node.isTypeAliasDeclaration(enclosingNode) ||
      Node.isPropertySignature(enclosingNode))
  ) {
    const typeNode = enclosingNode.getTypeNode()

    if (Node.isTypeReference(typeNode)) {
      genericTypeArguments = typeNode.getTypeArguments()
      genericTypeName = typeNode.getTypeName().getText()
      genericTypeText = typeNode.getText()
    }
  }

  if (useReferences) {
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
          if (aliasTypeArguments.length > 0) {
            const processedTypeArguments = aliasTypeArguments
              .map((type) => processType(type, declaration, filter, false))
              .filter(Boolean) as ProcessedType[]

            if (processedTypeArguments.length === 0) {
              return
            }

            return {
              kind: 'Generic',
              type: typeText,
              typeName: typeName!,
              arguments: processedTypeArguments,
              ...declarationLocation,
            } satisfies GenericType
          } else {
            if (!declarationLocation.filePath) {
              throw new Error(
                `[processType]: No file path found for "${typeText}". Please file an issue if you encounter this error.`
              )
            }
            return {
              kind: 'Reference',
              type: typeText,
              ...declarationLocation,
            } satisfies ReferenceType
          }
        }
      }
    }

    /*
     * Determine if the symbol should be treated as a reference.
     * TODO: this should account for what's actually exported from package.json exports to determine what's processed.
     */
    const isLocallyExportedReference =
      !isRootType &&
      !symbolMetadata.isInNodeModules &&
      !symbolMetadata.isExternal &&
      symbolMetadata.isExported
    const isExternalNonNodeModuleReference =
      symbolMetadata.isExternal && !symbolMetadata.isInNodeModules
    const isNodeModuleReference =
      !symbolMetadata.isGlobal && symbolMetadata.isInNodeModules
    const hasNoTypeArguments =
      typeArguments.length === 0 &&
      aliasTypeArguments.length === 0 &&
      genericTypeArguments.length === 0
    const hasReference = typeReferences.has(type)

    if (
      hasReference ||
      ((isLocallyExportedReference ||
        isExternalNonNodeModuleReference ||
        isNodeModuleReference) &&
        hasNoTypeArguments)
    ) {
      if (!declarationLocation.filePath) {
        throw new Error(
          `[processType]: No file path found for "${typeText}". Please file an issue if you encounter this error.`
        )
      }

      /* Check if the reference is an object. This is specifically used in the `isComponent` function. */
      let isObject = false

      if (
        isLocallyExportedReference ||
        isExternalNonNodeModuleReference ||
        isNodeModuleReference
      ) {
        const processedReferenceType = processType(
          type,
          enclosingNode,
          filter,
          isRootType,
          defaultValues,
          false
        )

        if (processedReferenceType?.kind === 'Object') {
          isObject = true
        } else if (processedReferenceType?.kind === 'Union') {
          isObject = processedReferenceType.members.every(
            (property) => property.kind === 'Object'
          )
        }

        if (isObject) {
          const referenceId = getReferenceId({
            type: typeText,
            ...declarationLocation,
          })
          objectReferences.add(referenceId)
        }
      }

      return {
        kind: 'Reference',
        type: typeText,
        ...declarationLocation,
      } satisfies ReferenceType
    }
  }

  /* If the type is not virtual, store it as a reference. */
  if (!symbolMetadata.isVirtual) {
    typeReferences.add(type)
  }

  let processedType: ProcessedType = {
    kind: 'Unknown',
    type: typeText,
  } satisfies UnknownType

  if (type.isBoolean() || type.isBooleanLiteral()) {
    processedType = {
      kind: 'Boolean',
      name: symbolMetadata.name,
      type: typeText,
    } satisfies BooleanType
  } else if (type.isNumber() || type.isNumberLiteral()) {
    processedType = {
      kind: 'Number',
      name: symbolMetadata.name,
      type: typeText,
      value: type.getLiteralValue() as number,
    } satisfies NumberType
  } else if (type.isString() || type.isStringLiteral()) {
    processedType = {
      kind: 'String',
      name: symbolMetadata.name,
      type: typeText,
      value: type.getLiteralValue() as string,
    } satisfies StringType
  } else if (isSymbol(type)) {
    processedType = {
      kind: 'Symbol',
      name: symbolMetadata.name,
      type: typeText,
    } satisfies SymbolType
  } else if (type.isArray()) {
    const elementType = type.getArrayElementTypeOrThrow()
    const processedElementType = processType(
      elementType,
      declaration,
      filter,
      false
    )
    if (processedElementType) {
      processedType = {
        kind: 'Array',
        name: symbolMetadata.name,
        type: typeText,
        element: processedElementType,
      } satisfies ArrayType
    } else {
      typeReferences.delete(type)
      return
    }
  } else {
    /* Attempt to process generic type arguments if they exist. */
    if (aliasTypeArguments.length === 0 && genericTypeArguments.length > 0) {
      const processedTypeArguments = genericTypeArguments
        .map((type) => {
          const processedType = processType(type.getType(), type, filter, false)
          if (processedType) {
            return {
              ...processedType,
              type: type.getText(),
            }
          }
        })
        .filter(Boolean) as ProcessedType[]
      const everyTypeArgumentIsReference = processedTypeArguments.every(
        (type) => type.kind === 'Reference'
      )

      /* If the any of the type arguments are references, they need need to be linked to the generic type. */
      if (everyTypeArgumentIsReference && processedTypeArguments.length > 0) {
        typeReferences.delete(type)

        return {
          kind: 'Generic',
          type: genericTypeText,
          typeName: genericTypeName,
          arguments: processedTypeArguments,
          ...declarationLocation,
        } satisfies GenericType
      }
    }

    if (type.isClass()) {
      if (Node.isClassDeclaration(symbolDeclaration)) {
        processedType = processClass(symbolDeclaration, filter)
        if (symbolMetadata.name) {
          processedType.name = symbolMetadata.name
        }
      } else {
        throw new Error(
          `[processType]: No class declaration found for "${symbolMetadata.name}". Please file an issue if you encounter this error.`
        )
      }
    } else if (type.isEnum()) {
      if (Node.isEnumDeclaration(symbolDeclaration)) {
        processedType = {
          kind: 'Enum',
          name: symbolMetadata.name,
          type: typeText,
          members: Object.fromEntries(
            symbolDeclaration
              .getMembers()
              .map((member) => [member.getName(), member.getValue()])
          ) as Record<string, string | number | undefined>,
        } satisfies EnumType
      } else {
        throw new Error(
          `[processType]: No enum declaration found for "${symbolMetadata.name}". Please file an issue if you encounter this error.`
        )
      }
    } else if (type.isUnion()) {
      const typeNode = Node.isTypeAliasDeclaration(symbolDeclaration)
        ? symbolDeclaration.getTypeNode()
        : undefined

      /* type.isIntersection() will be `false` when mixed with unions so we process the type nodes individually instead. */
      if (Node.isIntersectionTypeNode(typeNode)) {
        const processedIntersectionTypes = typeNode
          .getTypeNodes()
          .map((typeNode) =>
            processType(typeNode.getType(), typeNode, filter, false)
          )
          .filter(Boolean) as ProcessedType[]

        if (processedIntersectionTypes.length === 0) {
          typeReferences.delete(type)
          return
        }

        processedType = {
          kind: 'Intersection',
          name: symbolMetadata.name,
          type: typeText,
          properties: processedIntersectionTypes,
        } satisfies IntersectionType
      } else {
        const processedUnionTypes: ProcessedType[] = []

        for (const unionType of type.getUnionTypes()) {
          const processedType = processType(
            unionType,
            declaration,
            filter,
            false,
            defaultValues
          )

          if (processedType) {
            const previousProperty = processedUnionTypes.at(-1)

            // Flatten boolean literals to just 'boolean' if both values are present
            if (
              processedType.kind === 'Boolean' &&
              previousProperty?.kind === 'Boolean'
            ) {
              processedUnionTypes.pop()
              processedType.type = 'boolean'
            }

            processedUnionTypes.push(processedType)
          }
        }

        if (processedUnionTypes.length === 0) {
          typeReferences.delete(type)
          return
        }

        processedType = {
          kind: 'Union',
          name: symbolMetadata.name,
          type: typeText,
          members: processedUnionTypes,
        } satisfies UnionType
      }
    } else if (type.isIntersection()) {
      const processedIntersectionTypes = type
        .getIntersectionTypes()
        .map((intersectionType) =>
          processType(
            intersectionType,
            declaration,
            filter,
            false,
            defaultValues
          )
        )
        .filter(Boolean) as ProcessedType[]

      // Intersection types can safely merge the immediate object properties to reduce nesting
      const properties: ProcessedType[] = []
      let isObject = true

      for (const processedType of processedIntersectionTypes) {
        if (processedType.kind === 'Object') {
          properties.push(...processedType.properties)
        } else {
          properties.push(processedType)
          isObject = false
        }
      }

      if (properties.length === 0) {
        typeReferences.delete(type)
        return
      }

      if (isObject) {
        processedType = {
          kind: 'Object',
          name: symbolMetadata.name,
          type: typeText,
          properties,
        } satisfies ObjectType
      } else {
        processedType = {
          kind: 'Intersection',
          name: symbolMetadata.name,
          type: typeText,
          properties,
        } satisfies IntersectionType
      }
    } else if (type.isTuple()) {
      const elements = processTypeTupleElements(
        type,
        declaration,
        filter,
        false
      )

      if (elements.length === 0) {
        typeReferences.delete(type)
        return
      }

      processedType = {
        kind: 'Tuple',
        name: symbolMetadata.name,
        type: typeText,
        elements,
      } satisfies TupleType
    } else {
      const callSignatures = type.getCallSignatures()

      if (callSignatures.length > 0) {
        const processedCallSignatures = processCallSignatures(
          callSignatures,
          declaration,
          filter,
          false
        )

        if (isComponent(symbolMetadata.name, processedCallSignatures)) {
          processedType = {
            kind: 'Component',
            name: symbolMetadata.name,
            type: typeText,
            signatures: processedCallSignatures.map(
              ({ parameters, ...processedCallSignature }) => {
                return {
                  ...processedCallSignature,
                  kind: 'ComponentSignature',
                  parameter: parameters.at(0) as
                    | ObjectType
                    | ReferenceType
                    | undefined,
                } satisfies ComponentSignatureType
              }
            ),
          } satisfies ComponentType
        } else {
          processedType = {
            kind: 'Function',
            name: symbolMetadata.name,
            type: typeText,
            signatures: processedCallSignatures,
          } satisfies FunctionType
        }
      } else if (isPrimitive) {
        processedType = {
          kind: 'Primitive',
          type: typeText,
        } satisfies PrimitiveType
      } else if (type.isObject()) {
        const properties = processTypeProperties(
          type,
          enclosingNode,
          filter,
          false,
          defaultValues
        )

        if (properties.length === 0 && typeArguments.length > 0) {
          const processedTypeArguments = typeArguments
            .map((type) =>
              processType(type, declaration, filter, false, defaultValues)
            )
            .filter(Boolean) as ProcessedType[]

          if (processedTypeArguments.length === 0) {
            typeReferences.delete(type)
            return
          }

          processedType = {
            kind: 'Generic',
            name: symbolMetadata.name,
            type: typeText,
            typeName: typeName!,
            arguments: processedTypeArguments,
          } satisfies GenericType
        } else if (properties.length === 0) {
          typeReferences.delete(type)
          return
        } else {
          processedType = {
            kind: 'Object',
            name: symbolMetadata.name,
            type: typeText,
            properties,
          } satisfies ObjectType
        }
      } else {
        /** Finally, try to process the apparent type if it is different from the current type. */
        const apparentType = type.getApparentType()

        if (type !== apparentType) {
          typeReferences.delete(type)

          return processType(
            apparentType,
            declaration,
            filter,
            false,
            defaultValues
          )
        }
      }
    }
  }

  typeReferences.delete(type)

  let metadataDeclaration = declaration

  /* If the type is a variable declaration, use the parent statement to retrieve jsdoc metadata. */
  if (Node.isVariableDeclaration(enclosingNode)) {
    metadataDeclaration = enclosingNode
  }

  return {
    ...(metadataDeclaration ? getJsDocMetadata(metadataDeclaration) : {}),
    ...processedType,
    ...declarationLocation,
  }
}

/** Process all function signatures of a given type including their parameters and return types. */
export function processCallSignatures(
  signatures: Signature[],
  enclosingNode?: Node,
  filter: SymbolFilter = defaultFilter,
  isRootType: boolean = true
): FunctionSignatureType[] {
  return signatures
    .map((signature) =>
      processSignature(signature, enclosingNode, filter, isRootType)
    )
    .filter(Boolean) as FunctionSignatureType[]
}

/** Process a single function signature including its parameters and return type. */
export function processSignature(
  signature: Signature,
  enclosingNode?: Node,
  filter: SymbolFilter = defaultFilter,
  isRootType: boolean = true
): FunctionSignatureType | undefined {
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
  const processedParameters = signatureParameters
    .map((parameter, index) => {
      const parameterDeclaration = parameterDeclarations[index]
      const isOptional = parameterDeclaration
        ? parameterDeclaration.hasQuestionToken()
        : undefined
      const declaration = parameterDeclaration || enclosingNode

      if (declaration) {
        const defaultValue = parameterDeclaration
          ? getPropertyDefaultValue(parameterDeclaration)
          : undefined
        const processedType = processType(
          parameter.getTypeAtLocation(signatureDeclaration),
          declaration,
          filter,
          isRootType,
          defaultValue
        )

        if (processedType) {
          let name: string | undefined = parameter.getName()

          if (name.startsWith('__')) {
            name = undefined
          }

          return {
            ...processedType,
            name,
            defaultValue,
            isOptional: isOptional ?? Boolean(defaultValue),
            description: getSymbolDescription(parameter),
          } satisfies ParameterTypes
        }
      } else {
        throw new Error(
          `[processCallSignatures]: No parameter declaration found for "${parameter.getName()}". You must pass the enclosing node as the second argument to "processCallSignatures".`
        )
      }
    })
    .filter(Boolean) as ParameterTypes[]

  /** Skip signatures with filtered parameters if they are in node_modules. */
  if (
    signatureParameters.length !== 0 &&
    processedParameters.length === 0 &&
    signatureDeclaration.getSourceFile().isInNodeModules()
  ) {
    return
  }

  const returnType = signature
    .getReturnType()
    .getText(undefined, TypeFormatFlags.UseAliasDefinedOutsideCurrentScope)
  const parametersText = processedParameters
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
    kind: 'FunctionSignature',
    type: simplifiedTypeText,
    parameters: processedParameters,
    modifier,
    returnType,
  }
}

/** Process all apparent properties of a given type. */
export function processTypeProperties(
  type: Type,
  enclosingNode?: Node,
  filter: SymbolFilter = defaultFilter,
  isRootType: boolean = true,
  defaultValues?: Record<string, unknown> | unknown
): ProcessedType[] {
  const isReadonly = isTypeReadonly(type, enclosingNode)

  return type
    .getApparentProperties()
    .map((property) => {
      const symbolMetadata = getSymbolMetadata(property, enclosingNode)
      const propertyDeclaration = property.getDeclarations().at(0) as
        | PropertySignature
        | undefined
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
                getPropertyDefaultValueKey(propertyDeclaration)
              ]
            : undefined

        // Store the metadata of the enclosing node for file location comparison used in processType
        enclosingNodeMetadata.set(declaration, symbolMetadata)

        const propertyType = property.getTypeAtLocation(declaration)
        const processedProperty = processType(
          propertyType,
          declaration,
          filter,
          isRootType,
          defaultValue
        )

        if (processedProperty) {
          const isOptional = Boolean(
            propertyDeclaration?.hasQuestionToken() || defaultValue
          )
          const isPropertyReadonly = propertyDeclaration
            ? 'isReadonly' in propertyDeclaration
              ? propertyDeclaration.isReadonly()
              : false
            : false

          return {
            ...processedProperty,
            ...getJsDocMetadata(declaration),
            name,
            defaultValue,
            isOptional,
            isReadonly: isReadonly || isPropertyReadonly,
          } satisfies PropertyTypes
        }
      } else {
        throw new Error(
          `[processTypeProperties]: No property declaration found for "${property.getName()}". You must pass the enclosing node as the second argument to "processTypeProperties".`
        )
      }
    })
    .filter(Boolean) as PropertyTypes[]
}

/** Process all elements of a tuple type. */
function processTypeTupleElements(
  type: Type,
  enclosingNode?: Node,
  filter?: SymbolFilter,
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
        isRootType
      )
      if (processedType) {
        return {
          ...processedType,
          name: tupleNames[index],
        } satisfies ProcessedType
      }
    })
    .filter(Boolean) as ProcessedType[]
}

/** Check if every type argument is in node_modules. */
function isEveryTypeInNodeModules(types: (Type | TypeNode)[]) {
  if (types.length === 0) {
    return false
  }
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

  /** Whether or not the node is generated by the compiler. */
  isVirtual: boolean
} {
  if (!symbol) {
    return {
      isExported: false,
      isExternal: false,
      isInNodeModules: false,
      isGlobal: false,
      isVirtual: true,
    }
  }

  const declarations = symbol.getDeclarations()

  if (declarations.length === 0) {
    return {
      isExported: false,
      isExternal: false,
      isInNodeModules: false,
      isGlobal: false,
      isVirtual: false,
    }
  }

  const declaration = declarations.at(0)!
  const declarationSourceFile = declaration?.getSourceFile()
  const enclosingNodeSourceFile = enclosingNode?.getSourceFile()

  /** Attempt to get the name of the symbol. */
  let name: string | undefined

  if (
    // If the symbol value declaration is a variable use the name from the enclosing node if provided
    Node.isVariableDeclaration(symbol.getValueDeclaration()) ||
    // Otherwise, use the enclosing node if it is a variable declaration
    Node.isVariableDeclaration(enclosingNode)
  ) {
    if (
      Node.isVariableDeclaration(enclosingNode) &&
      declaration !== enclosingNode
    ) {
      name = enclosingNode.getName()
    }
    // Don't use the name from the symbol if this fails to prevent using apparent names like String, Number, etc.
  } else {
    name = symbol.getName()
  }

  // Ignore private symbol names e.g. __type, __call, __0, etc.
  if (name?.startsWith('__')) {
    name = undefined
  }

  /** Check if the symbol is exported if it is not the enclosing node. */
  let isExported = false

  if (declaration !== enclosingNode) {
    if ('isExported' in declaration) {
      // @ts-expect-error - isExported is not defined on all declaration types
      isExported = declaration.isExported()
    } else {
      // alternatively, check if the declaration's parent is an exported variable declaration
      const variableDeclaration = declaration.getParent()
      if (Node.isVariableDeclaration(variableDeclaration)) {
        isExported = variableDeclaration.isExported()
      }
    }
  }

  /** Check if a type is external to the enclosing source file. */
  let isExternal = false

  // TODO: this is not sufficient because the enclosing node can be from node modules e.g. Promise
  // this should use a root source file to determine if the symbol is external
  if (enclosingNodeSourceFile && !enclosingNodeSourceFile.isInNodeModules()) {
    isExternal = enclosingNodeSourceFile !== declarationSourceFile
  }

  const isInNodeModules = declarationSourceFile.isInNodeModules()

  return {
    name,
    isExported,
    isExternal,
    isInNodeModules,
    isGlobal: isInNodeModules && !isExported,
    isVirtual: false,
  }
}

/** Gets the location of a declaration. */
function getDeclarationLocation(declaration: Node): {
  /** The file path for the symbol declaration relative to the project. */
  filePath?: string

  /** The line and column number of the symbol declaration. */
  position?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
} {
  const filePath = getFilePathRelativeToProject(declaration)
  const sourceFile = declaration.getSourceFile()

  return {
    filePath,
    position: {
      start: sourceFile.getLineAndColumnAtPos(declaration.getStart()),
      end: sourceFile.getLineAndColumnAtPos(declaration.getEnd()),
    },
  }
}

/** Calculate a file path of a source file relative to the project root. */
function getFilePathRelativeToProject(declaration: Node) {
  const sourceFile = declaration.getSourceFile()
  const rootFilePath = getRootFilePath(sourceFile.getProject())
  let trimmedFilePath = sourceFile.getFilePath().replace(rootFilePath, '')

  if (trimmedFilePath.includes('node_modules')) {
    trimmedFilePath = trimmedFilePath.slice(
      trimmedFilePath.lastIndexOf('node_modules') - 1
    )
  }

  return trimmedFilePath.slice(1)
}

const rootFilePaths = new WeakMap<Project, string>()

/** Gets the root source file path for a project. */
function getRootFilePath(project: Project) {
  let rootFilePath: string

  if (!rootFilePaths.has(project)) {
    rootFilePath = project.getFileSystem().getCurrentDirectory()
    rootFilePaths.set(project, rootFilePath)
  } else {
    rootFilePath = rootFilePaths.get(project)!
  }

  return rootFilePath
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

/** Get the visibility of a class member. */
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

/** Get the scope of a class member. */
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

/** Processes a class declaration into a metadata object. */
export function processClass(
  classDeclaration: ClassDeclaration,
  filter?: SymbolFilter
): ClassType {
  const classMetadata: ClassType = {
    kind: 'Class',
    name: classDeclaration.getName(),
    type: classDeclaration
      .getType()
      .getText(classDeclaration, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(classDeclaration),
  }

  const constructorSignatures = classDeclaration
    .getConstructors()
    .map((constructor) => constructor.getSignature())

  if (constructorSignatures.length) {
    classMetadata.constructors = processCallSignatures(
      constructorSignatures,
      classDeclaration,
      filter
    )
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
        classMetadata.accessors.push(processClassAccessor(member, filter))
      }
    } else if (Node.isMethodDeclaration(member)) {
      if (!member.hasModifier(SyntaxKind.PrivateKeyword)) {
        if (!classMetadata.methods) {
          classMetadata.methods = []
        }
        classMetadata.methods.push(processClassMethod(member, filter))
      }
    } else if (Node.isPropertyDeclaration(member)) {
      if (!member.hasModifier(SyntaxKind.PrivateKeyword)) {
        if (!classMetadata.properties) {
          classMetadata.properties = []
        }
        classMetadata.properties.push(processClassProperty(member))
      }
    }
  })

  return classMetadata
}

/** Processes a class accessor (getter or setter) declaration into a metadata object. */
function processClassAccessor(
  accessor: GetAccessorDeclaration | SetAccessorDeclaration,
  filter?: SymbolFilter
): ClassAccessorType {
  const sharedMetadata: SharedClassMemberType = {
    name: accessor.getName(),
    scope: getScope(accessor),
    visibility: getVisibility(accessor),
    type: accessor.getType().getText(accessor, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(accessor),
  }

  if (Node.isSetAccessorDeclaration(accessor)) {
    const processedSignature = processSignature(
      accessor.getSignature(),
      accessor,
      filter
    )

    if (processedSignature) {
      return {
        ...processedSignature,
        ...sharedMetadata,
        kind: 'ClassSetAccessor',
        type: accessor.getType().getText(accessor, TYPE_FORMAT_FLAGS),
      } satisfies ClassSetAccessorType
    }

    throw new Error(
      `[processClassAccessor] Setter "${accessor.getName()}" could not be processed. This declaration was either filtered, should be marked as internal, or filed as an issue for support.`
    )
  }

  return {
    ...sharedMetadata,
    kind: 'ClassGetAccessor',
  } satisfies ClassGetAccessorType
}

/** Processes a method declaration into a metadata object. */
function processClassMethod(
  method: MethodDeclaration,
  filter?: SymbolFilter
): ClassMethodType {
  const callSignatures = method.getType().getCallSignatures()

  return {
    kind: 'ClassMethod',
    name: method.getName(),
    scope: getScope(method),
    visibility: getVisibility(method),
    signatures: processCallSignatures(callSignatures, method, filter),
    type: method.getType().getText(method, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(method),
  } satisfies ClassMethodType
}

/** Processes a class property declaration into a metadata object. */
function processClassProperty(
  property: PropertyDeclaration,
  filter?: SymbolFilter
): ClassPropertyType {
  const propertyType = property.getType()
  const processedType = processType(propertyType, property, filter)

  if (processedType) {
    return {
      ...processedType,
      ...getJsDocMetadata(property),
      name: property.getName(),
      defaultValue: getPropertyDefaultValue(property),
      scope: getScope(property),
      visibility: getVisibility(property),
      isReadonly: property.isReadonly(),
    } satisfies ClassPropertyType
  }

  throw new Error(
    `[processClassPropertyDeclaration] Property "${property.getName()}" could not be processed. This declaration was either filtered, should be marked as internal, or filed as an issue for support.`
  )
}

/** Determines if a type is readonly. */
function isTypeReadonly(type: Type, enclosingNode: Node | undefined) {
  let isReadonly = false

  /** Check if the type is marked as Readonly using the TypeScript utility type. */
  if (type.getText().startsWith('Readonly')) {
    isReadonly = Boolean(
      type
        .getSymbol()
        ?.getDeclarations()
        .at(0)
        ?.getSourceFile()
        .getFilePath()
        .includes('node_modules/typescript')
    )
  }

  /** Alternatively, check for const assertion. */
  if (isReadonly === false && Node.isVariableDeclaration(enclosingNode)) {
    const initializer = enclosingNode.getInitializer()

    if (Node.isAsExpression(initializer)) {
      const typeNode = initializer.getTypeNode()

      if (typeNode) {
        isReadonly = typeNode.getText() === 'const'
      }
    }
  }

  return isReadonly
}

/** Generate an id based on the type metadata. */
function getReferenceId(typeMetadata: BaseType) {
  return (
    typeMetadata.type +
    typeMetadata.path +
    typeMetadata.position?.start.line +
    typeMetadata.position?.start.column
  )
}

/** Determines if a function is a component based on its name and call signature shape. */
export function isComponent(
  name: string | undefined,
  callSignatures: FunctionSignatureType[]
) {
  if (!name) {
    return false
  }

  const isFirstLetterCapitalized = /[A-Z]/.test(name.charAt(0))

  if (!isFirstLetterCapitalized || callSignatures.length === 0) {
    return false
  }

  return callSignatures.every((signature) => {
    if (signature.returnType === 'ReactNode') {
      return true
    } else if (signature.parameters.length === 1) {
      const firstParameter = signature.parameters.at(0)!

      if (firstParameter.kind === 'Object') {
        return true
      }

      if (firstParameter.kind === 'Union') {
        return firstParameter.members.every(
          (property) => property.kind === 'Object'
        )
      }

      if (firstParameter.kind === 'Reference') {
        const referenceId = getReferenceId(firstParameter)
        return Boolean(objectReferences.has(referenceId))
      }
    }
  })
}
