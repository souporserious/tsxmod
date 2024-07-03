import type {
  ArrowFunction,
  AsExpression,
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
  SetAccessorDeclaration,
  GetAccessorDeclaration,
  VariableDeclaration,
} from 'ts-morph'
import { Node, SyntaxKind, TypeFormatFlags } from 'ts-morph'

import { getJsDocMetadata } from '../js-docs'
import {
  isComponent,
  processCallSignatures,
  processSignature,
  processType,
  type FunctionSignature,
  type ObjectProperty,
  type ProcessedProperty,
  type SharedMetadata,
  type SymbolFilter,
} from './processType'

export interface EnumMetadata extends SharedMetadata {
  kind: 'Enum'
  members: Record<string, unknown>
}

export interface ClassMetadata extends SharedMetadata {
  kind: 'Class'
  constructors?: ReturnType<typeof processCallSignatures>
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

export type ClassSetAccessorMetadata = SharedClassMemberMetadata & {
  kind: 'ClassSetAccessor'
} & Omit<FunctionSignature, 'kind'>

export type ClassAccessorMetadata =
  | ClassGetAccessorMetadata
  | ClassSetAccessorMetadata

export interface ClassMethodMetadata extends SharedClassMemberMetadata {
  kind: 'ClassMethod'
  signatures: FunctionSignature[]
}

export type ClassPropertyMetadata = SharedClassMemberMetadata & {
  isReadonly: boolean
} & ProcessedProperty

export interface FunctionMetadata extends SharedMetadata {
  kind: 'Function'
  signatures: FunctionSignature[]
}

export interface ComponentSignatureMetadata extends SharedMetadata {
  kind: 'ComponentSignature'
  properties: ObjectProperty
  returnType: string
}

export interface ComponentMetadata extends SharedMetadata {
  kind: 'Component'
  signatures: ComponentSignatureMetadata[]
}

export interface UnknownMetadata extends SharedMetadata {
  kind: 'Unknown'
}

export type MetadataMap = {
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
  | ProcessedProperty
  | EnumMetadata
  | ClassMetadata
  | FunctionMetadata
  | ComponentMetadata
  | UnknownMetadata

export type DocumentationMetadata<Type> = Type extends InterfaceDeclaration
  ? ObjectProperty
  : Type extends TypeAliasDeclaration
  ? ProcessedProperty
  : Type extends ClassDeclaration
  ? ClassMetadata
  : Type extends EnumDeclaration
  ? EnumMetadata
  : Type extends FunctionDeclaration
  ? FunctionMetadata | ComponentMetadata
  : Type extends VariableDeclaration
  ? ProcessedProperty
  : never

const TYPE_FORMAT_FLAGS =
  TypeFormatFlags.AddUndefined |
  TypeFormatFlags.NoTruncation |
  TypeFormatFlags.UseAliasDefinedOutsideCurrentScope

export function getTypeDocumentation<Type extends Declaration>(
  declaration: Type,
  filter?: SymbolFilter
): DocumentationMetadata<Type>
export function getTypeDocumentation(
  declaration:
    | InterfaceDeclaration
    | TypeAliasDeclaration
    | ClassDeclaration
    | FunctionDeclaration
    | VariableDeclaration,
  filter?: SymbolFilter
): Metadata {
  if (
    Node.isInterfaceDeclaration(declaration) ||
    Node.isTypeAliasDeclaration(declaration)
  ) {
    const processedType = processType(
      declaration.getType(),
      declaration,
      filter
    )

    if (!processedType) {
      const kind = Node.isInterfaceDeclaration(declaration)
        ? 'Interface'
        : 'TypeAlias'

      throw new Error(
        `[getTypeDocumentation] ${kind} "${declaration.getName()}" could not be processed. This declaration was either filtered, should be marked as internal, or filed as an issue for support.`
      )
    }

    return processedType
  }

  if (Node.isEnumDeclaration(declaration)) {
    return processEnum(declaration)
  }

  if (Node.isClassDeclaration(declaration)) {
    return processClass(declaration, filter)
  }

  if (Node.isFunctionDeclaration(declaration)) {
    return processFunctionDeclarationOrExpression(declaration, filter)
  }

  if (Node.isVariableDeclaration(declaration)) {
    const initializer = declaration.getInitializer()

    if (
      Node.isArrowFunction(initializer) ||
      Node.isFunctionExpression(initializer) ||
      Node.isCallExpression(initializer) ||
      Node.isTaggedTemplateExpression(initializer)
    ) {
      return processFunctionDeclarationOrExpression(
        initializer,
        filter,
        declaration
      )
    }

    if (Node.isAsExpression(initializer)) {
      const processedType = processType(
        initializer.getType(),
        initializer,
        filter
      )

      if (processedType) {
        return {
          ...processedType,
          ...getJsDocMetadata(declaration),
          name: declaration.getName(),
        }
      }

      throw new Error(
        `[getTypeDocumentation] Variable "${declaration.getName()}" could not be processed. This declaration was either filtered, should be marked as internal, or filed as an issue for support.`
      )
    }
  }

  const processedType = processType(declaration.getType(), declaration, filter)

  if (processedType) {
    const jsDocMetadata = getJsDocMetadata(declaration)

    return {
      ...processedType,
      ...jsDocMetadata,
      name: declaration.getName(),
    }
  }

  throw new Error(
    `[getTypeDocumentation] Declaration "${declaration.getName()}" could not be processed. This declaration was either filtered, should be marked as internal, or filed as an issue for support.`
  )
}

/** Processes an enum declaration into a metadata object. */
function processEnum(enumDeclaration: EnumDeclaration): EnumMetadata {
  return {
    kind: 'Enum',
    name: enumDeclaration.getName(),
    type: enumDeclaration.getType().getText(enumDeclaration, TYPE_FORMAT_FLAGS),
    members: Object.fromEntries(
      enumDeclaration
        .getMembers()
        .map((member) => [member.getName(), member.getValue()])
    ),
    ...getJsDocMetadata(enumDeclaration),
  }
}

/** Processes a function or expression into a metadata object. */
function processFunctionDeclarationOrExpression(
  functionDeclarationOrExpression:
    | AsExpression
    | FunctionDeclaration
    | ArrowFunction
    | FunctionExpression
    | TaggedTemplateExpression
    | CallExpression,
  filter?: SymbolFilter,
  variableDeclaration?: VariableDeclaration
): FunctionMetadata | ComponentMetadata {
  const signatures = functionDeclarationOrExpression
    .getType()
    .getCallSignatures()
  const processedCallSignatures = processCallSignatures(
    signatures,
    variableDeclaration || functionDeclarationOrExpression,
    filter
  )
  const sharedMetadata = {
    name: variableDeclaration
      ? variableDeclaration.getName()
      : (functionDeclarationOrExpression as FunctionDeclaration).getName(),
    type: functionDeclarationOrExpression
      .getType()
      .getText(functionDeclarationOrExpression, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(variableDeclaration || functionDeclarationOrExpression),
  } as const

  if (isComponent(sharedMetadata.name, processedCallSignatures)) {
    return {
      kind: 'Component',
      signatures: processedCallSignatures.map(
        ({ parameters, ...processedCallSignature }) => {
          return {
            ...processedCallSignature,
            kind: 'ComponentSignature',
            properties: parameters.at(0)! as ObjectProperty,
          } satisfies ComponentSignatureMetadata
        }
      ),
      ...sharedMetadata,
    }
  }

  return {
    kind: 'Function',
    signatures: processedCallSignatures.map((processedCallSignature) => {
      return {
        ...processedCallSignature,
        kind: 'FunctionSignature',
      } satisfies FunctionSignature
    }),
    ...sharedMetadata,
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
  filter?: SymbolFilter
): ClassMetadata {
  const classMetadata: ClassMetadata = {
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
        classMetadata.properties.push(processClassPropertyDeclaration(member))
      }
    }
  })

  return classMetadata
}

/** Processes an accessor (getter or setter) into a metadata object. */
function processClassAccessor(
  accessor: GetAccessorDeclaration | SetAccessorDeclaration,
  filter?: SymbolFilter
): ClassAccessorMetadata {
  const sharedMetadata: SharedClassMemberMetadata = {
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
      } satisfies ClassSetAccessorMetadata
    }

    throw new Error(
      `[processClassAccessor] Setter "${accessor.getName()}" could not be processed. This declaration was either filtered, should be marked as internal, or filed as an issue for support.`
    )
  }

  return {
    ...sharedMetadata,
    kind: 'ClassGetAccessor',
  } satisfies ClassGetAccessorMetadata
}

/** Processes a method declaration into a metadata object. */
function processClassMethod(
  method: MethodDeclaration,
  filter?: SymbolFilter
): ClassMethodMetadata {
  const callSignatures = method.getType().getCallSignatures()

  return {
    kind: 'ClassMethod',
    name: method.getName(),
    scope: getScope(method),
    visibility: getVisibility(method),
    signatures: processCallSignatures(callSignatures, method, filter),
    type: method.getType().getText(method, TYPE_FORMAT_FLAGS),
    ...getJsDocMetadata(method),
  } satisfies ClassMethodMetadata
}

/** Processes a class property declaration into a metadata object. */
function processClassPropertyDeclaration(
  property: PropertyDeclaration,
  filter?: SymbolFilter
): ClassPropertyMetadata {
  const propertyType = property.getType()
  const processedType = processType(propertyType, property, filter)

  if (processedType) {
    return {
      ...processedType,
      ...getJsDocMetadata(property),
      name: property.getName(),
      scope: getScope(property),
      visibility: getVisibility(property),
      isReadonly: property.isReadonly(),
    } satisfies ClassPropertyMetadata
  }

  throw new Error(
    `[processClassPropertyDeclaration] Property "${property.getName()}" could not be processed. This declaration was either filtered, should be marked as internal, or filed as an issue for support.`
  )
}
