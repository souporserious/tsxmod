import type {
  FunctionDeclaration,
  TypeAliasDeclaration,
  InterfaceDeclaration,
  EnumDeclaration,
  ClassDeclaration,
  VariableDeclaration,
} from 'ts-morph'
import {
  Node,
  SyntaxKind,
  TypeFormatFlags,
  VariableDeclarationKind,
} from 'ts-morph'

import { getJsDocMetadata } from '../js-docs'
import {
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
    Node.isEnumDeclaration(declaration) ||
    Node.isClassDeclaration(declaration) ||
    Node.isFunctionDeclaration(declaration)
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
        : Node.isEnumDeclaration(declaration)
        ? 'Enum'
        : Node.isClassDeclaration(declaration)
        ? 'Class'
        : 'Function'

      throw new Error(
        `[getTypeDocumentation] ${kind} "${declaration.getName()}" could not be processed. This declaration was either filtered, should be marked as internal, or filed as an issue for support.`
      )
    }

    return processedType
  }

  if (Node.isVariableDeclaration(declaration)) {
    const initializer = declaration.getInitializer()

    if (
      Node.isArrowFunction(initializer) ||
      Node.isFunctionExpression(initializer) ||
      Node.isCallExpression(initializer) ||
      Node.isTaggedTemplateExpression(initializer)
    ) {
      const processedType = processType(
        initializer.getType(),
        declaration,
        filter
      )

      if (!processedType) {
        const kind = Node.isArrowFunction(initializer)
          ? 'ArrowFunction'
          : Node.isFunctionExpression(initializer)
          ? 'FunctionExpression'
          : Node.isCallExpression(initializer)
          ? 'CallExpression'
          : 'TaggedTemplateExpression'

        throw new Error(
          `[getTypeDocumentation] ${kind} "${declaration.getName()}" could not be processed. This declaration was either filtered, should be marked as internal, or filed as an issue for support.`
        )
      }

      return processedType
    }

    if (Node.isAsExpression(initializer)) {
      const processedType = processType(
        initializer.getType(),
        declaration,
        filter
      )

      if (processedType) {
        return {
          ...processedType,
          ...getJsDocMetadata(declaration),
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
