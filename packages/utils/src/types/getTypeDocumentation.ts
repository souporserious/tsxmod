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
  VariableDeclaration,
} from 'ts-morph'
import { Node, SyntaxKind, TypeFormatFlags } from 'ts-morph'

import { getJsDocMetadata } from '../js-docs'
import {
  isComponent,
  processCallSignatures,
  processClass,
  processType,
  type FunctionSignatureType,
  type ObjectType,
  type ProcessedType,
  type BaseType,
  type SymbolFilter,
  type ClassType,
  type EnumType,
} from './processType'

export interface FunctionMetadata extends BaseType {
  kind: 'Function'
  signatures: FunctionSignatureType[]
}

export interface ComponentSignatureMetadata extends BaseType {
  kind: 'ComponentSignature'
  properties: ObjectType
  returnType: string
}

export interface ComponentMetadata extends BaseType {
  kind: 'Component'
  signatures: ComponentSignatureMetadata[]
}

export interface UnknownMetadata extends BaseType {
  kind: 'Unknown'
}

export type MetadataMap = {
  Enum: EnumType
  Class: ClassType
  // ClassGetAccessor: ClassGetAccessorMetadata
  // ClassSetAccessor: ClassSetAccessorMetadata
  // ClassMethod: ClassMethodMetadata
  // ClassProperty: ClassPropertyMetadata
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
  | ProcessedType
  | EnumType
  | ClassType
  | FunctionMetadata
  | ComponentMetadata
  | UnknownMetadata

export type DocumentationMetadata<Type> = Type extends InterfaceDeclaration
  ? ObjectType
  : Type extends TypeAliasDeclaration
  ? ProcessedType
  : Type extends ClassDeclaration
  ? ClassType
  : Type extends EnumDeclaration
  ? EnumType
  : Type extends FunctionDeclaration
  ? FunctionMetadata | ComponentMetadata
  : Type extends VariableDeclaration
  ? ProcessedType
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
    Node.isTypeAliasDeclaration(declaration) ||
    Node.isEnumDeclaration(declaration)
  ) {
    const processedType = processType(
      declaration.getType(),
      declaration,
      filter
    )

    if (!processedType) {
      const kind = Node.isInterfaceDeclaration(declaration)
        ? 'Interface'
        : Node.isTypeAliasDeclaration(declaration)
        ? 'TypeAlias'
        : 'Enum'

      throw new Error(
        `[getTypeDocumentation] ${kind} "${declaration.getName()}" could not be processed. This declaration was either filtered, should be marked as internal, or filed as an issue for support.`
      )
    }

    return processedType
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
            properties: parameters.at(0)! as ObjectType,
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
      } satisfies FunctionSignatureType
    }),
    ...sharedMetadata,
  }
}
