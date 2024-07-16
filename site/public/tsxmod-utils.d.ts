import * as ts_morph from 'ts-morph';
import { DiagnosticMessageChain, SourceFile, Expression, ArrayLiteralExpression, ObjectLiteralExpression, Identifier, Node, Project, ts, ImportClause, ImportDeclaration, ImportSpecifier, JsxOpeningElement, JsxSelfClosingElement, JsxElement, VariableDeclaration, FunctionDeclaration, FunctionExpression, ArrowFunction, ClassDeclaration, JsxAttribute, BindingElement, ParameterDeclaration, PropertyDeclaration, PropertySignature, CallExpression, Symbol as Symbol$1, Type, Signature } from 'ts-morph';

/** Parses a diagnostic message into a string. */
declare function getDiagnosticMessageText(message: string | DiagnosticMessageChain): string;

/** Extract a single export and its local dependencies from a source file. */
declare function extractExportByIdentifier(sourceFile: SourceFile, identifier: string): string;

type LiteralExpressionValue = undefined | null | boolean | number | string | Record<string, any> | LiteralExpressionValue[];
/** Recursively resolves an expression into a literal value. */
declare function resolveLiteralExpression(expression: Expression): LiteralExpressionValue | LiteralExpressionValue[] | Symbol;
/** Resolves an array literal expression to an array. */
declare function resolveArrayLiteralExpression(expression: ArrayLiteralExpression): LiteralExpressionValue[];
/** Resolves an object literal expression to a plain object. */
declare function resolveObjectLiteralExpression(expression: ObjectLiteralExpression): Record<string, any>;
/** Determines when a value was resolved in `resolveLiteralExpression`. */
declare function isLiteralExpressionValue(value: ReturnType<typeof resolveLiteralExpression>): value is LiteralExpressionValue | LiteralExpressionValue[];

/** Find all references for an identifier in the file it is defined in or another source file. */
declare function findReferencesInSourceFile(identifier: Identifier, sourceFile?: SourceFile): Node[];

/**
 * Find all references for a named import.
 *
 * @example
 * const references = findNamedImportReferences(project, 'package', 'Stack')
 */
declare function findNamedImportReferences(project: Project, moduleSpecifierValue: string, namedImportName: string): ts_morph.Node<ts.Node>[];

/**
 * Gets an import clause by its module and default import name.
 *
 * @example
 * const importClause = getImportClause(sourceFile, 'react', 'React')
 */
declare function getImportClause(sourceFile: SourceFile, moduleSpecifier: string, importClause: string): ImportClause | undefined;

/**
 * Gets an import declaration by its module specifier.
 *
 * @example
 * const importDeclaration = getImportDeclaration(sourceFile, 'react')
 */
declare function getImportDeclaration(sourceFile: SourceFile, moduleSpecifier: string): ImportDeclaration | undefined;

/**
 * Gets an import specifier by it's module and import name.
 *
 * @example
 * const importSpecifier = getImportSpecifier(sourceFile, 'react', 'useState')
 */
declare function getImportSpecifier(sourceFile: SourceFile, moduleSpecifier: string, importSpecifier: string): ImportSpecifier | undefined;

/** Gets the description and tags from a JSDoc comment for a node. */
declare function getJsDocMetadata(node: Node): {
    description?: string;
    tags?: {
        tagName: string;
        text?: string;
    }[];
} | null;

/** Determines if a node has a specific JSDoc tag present. */
declare function hasJsDocTag(node: Node, tagName: string): boolean;

/** Finds the closest component declaration starting from a node. */
declare function findClosestComponentDeclaration(node: Node): Node | undefined;

/**
 * Traces component references.
 *
 * This is similar to `findReferencesAsNodes` but returns JsxSelfClosingElement and JsxElement nodes.
 * Note, this currently does not account for cases where the component is used as a prop or is renamed.
 */
declare function findReferencesAsJsxElements(identifer: Identifier): (JsxOpeningElement | JsxSelfClosingElement)[];

/** Traces component references to the root component. */
declare function findRootComponentReferences(node: Node): Node[];

/** Get all possible class names for a JSX element. */
declare function getClassNamesForJsxElement(jsxElement: JsxElement | JsxOpeningElement | JsxSelfClosingElement): string[];

/** Get the first descendant JsxElement based on the identifier. */
declare function getJsxElement(node: Node, name: string): JsxSelfClosingElement | JsxElement | undefined;
/** Get all descendant JsxElement nodes. */
declare function getJsxElements(node: Node): (JsxSelfClosingElement | JsxElement)[];

/** Determines if a node is a JSX component. */
declare function isJsxComponent(node: Node): node is VariableDeclaration | FunctionDeclaration | FunctionExpression | ArrowFunction | ClassDeclaration;

/** Renames JSX Element Identifier accounting for opening, closing, and self-closing elements. */
declare function renameJsxIdentifier(jsxElement: JsxElement | JsxSelfClosingElement, identifier: string): boolean;

/** Resolves the value of a JSX attribute into a literal value. */
declare function resolveJsxAttributeLiteralValue(attribute: JsxAttribute): LiteralExpressionValue | Symbol;

declare const TreeMode: {
    readonly getChildren: "getChildren";
    readonly forEachChild: "forEachChild";
};
/**
 * Get the children of a node using `getChildren` or `forEachChild`.
 *
 * @citation
 * Forked from [ts-ast-viewer](https://github.com/dsherret/ts-ast-viewer/blob/main/site/src/compiler/getChildrenFunction.ts)
 */
declare function getChildrenFunction(mode: keyof typeof TreeMode): (node: Node) => Node[];

/**
 * Get a descendant node between a start and end range.
 *
 * @citation
 * Forked from [ts-ast-viewer](https://github.com/dsherret/ts-ast-viewer/blob/main/site/src/compiler/getDescendantAtRange.ts)
 */
declare function getDescendantAtRange(sourceFile: SourceFile, range: [number, number], mode?: keyof typeof TreeMode): Node;

/** Generates type declarations from a project. */
declare function getTypeDeclarationsFromProject(project: Project): Promise<{
    path: string;
    code: string;
}[]>;

/** Gets the key for a default value property. */
declare function getPropertyDefaultValueKey(property: BindingElement | ParameterDeclaration | PropertyDeclaration | PropertySignature): string;
/** Gets the default value for a single parameter or property. */
declare function getPropertyDefaultValue(property: ParameterDeclaration | PropertyDeclaration | PropertySignature): LiteralExpressionValue;

/** Returns a functional component declaration, unwrapping forwardRef if needed. */
declare function getReactFunctionDeclaration(declaration: Node): ArrowFunction | FunctionDeclaration | FunctionExpression | null;

/** Determines if an expression is using React.forwardRef. */
declare function isForwardRefExpression(node: Node): node is CallExpression;

/** Gets the description from a symbol's JSDoc or leading comment range. */
declare function getSymbolDescription(symbol: Symbol$1): string | undefined;

/**
 * Modifies a source file to add computed types to all eligible type aliases and interfaces.
 *
 * **Note:** This function requires lib files to be present in the project to work correctly.
 */
declare function addComputedTypes(sourceFile: SourceFile): void;

/**
 * Get the computed quick info at a position in a source file. This is similar to `getQuickInfoAtPosition`
 * using the language service, but it will also flatten types. Note, type source files will be modified
 * using `addComputedTypes`.
 */
declare function getComputedQuickInfoAtPosition(sourceFile: SourceFile, position: number): ts.QuickInfo | undefined;

interface BaseType {
    /** Distinguishs between different kinds of types, such as primitives, objects, classes, functions, etc. */
    kind?: unknown;
    /** The name of the symbol or declaration if it exists. */
    name?: string;
    /** The description of the symbol or declaration if it exists. */
    description?: string;
    /** JSDoc tags for the declaration if present. */
    tags?: {
        tagName: string;
        text?: string;
    }[];
    /** A stringified representation of the type. */
    type: string;
    /** The path to the file where the symbol declaration is located. */
    path?: string;
    /** The line and column number of the symbol declaration. */
    position?: {
        start: {
            line: number;
            column: number;
        };
        end: {
            line: number;
            column: number;
        };
    };
}
interface ParameterType extends BaseType {
    /** The default value assigned to the property parsed as a literal value if possible. */
    defaultValue?: unknown;
    /** Whether or not the property has an optional modifier or default value. */
    isOptional?: boolean;
}
type CreateParameterType<Type> = Type extends any ? Type & ParameterType : never;
interface PropertyType extends BaseType {
    /** The default value assigned to the property parsed as a literal value if possible. */
    defaultValue?: unknown;
    /** Whether or not the property has an optional modifier or default value. */
    isOptional?: boolean;
    /** Whether or not the property has a readonly modifier. */
    isReadonly?: boolean;
}
type CreatePropertyType<Type> = Type extends any ? Type & PropertyType : never;
interface StringType extends BaseType {
    kind: 'String';
    value?: string;
}
interface NumberType extends BaseType {
    kind: 'Number';
    value?: number;
}
interface BooleanType extends BaseType {
    kind: 'Boolean';
}
interface SymbolType extends BaseType {
    kind: 'Symbol';
}
interface ArrayType extends BaseType {
    kind: 'Array';
    element: ProcessedType;
}
interface TupleType extends BaseType {
    kind: 'Tuple';
    elements: ProcessedType[];
}
interface ObjectType extends BaseType {
    kind: 'Object';
    properties: PropertyTypes[];
}
interface IntersectionType extends BaseType {
    kind: 'Intersection';
    properties: ProcessedType[];
}
interface EnumType extends BaseType {
    kind: 'Enum';
    members: Record<string, string | number | undefined>;
}
interface UnionType extends BaseType {
    kind: 'Union';
    members: ProcessedType[];
}
interface ClassType extends BaseType {
    kind: 'Class';
    constructors?: ReturnType<typeof processCallSignatures>;
    accessors?: ClassAccessorType[];
    methods?: ClassMethodType[];
    properties?: ClassPropertyType[];
}
interface SharedClassMemberType extends BaseType {
    scope?: 'abstract' | 'static';
    visibility?: 'private' | 'protected' | 'public';
}
interface ClassGetAccessorType extends SharedClassMemberType {
    kind: 'ClassGetAccessor';
}
type ClassSetAccessorType = SharedClassMemberType & {
    kind: 'ClassSetAccessor';
} & Omit<FunctionSignatureType, 'kind'>;
type ClassAccessorType = ClassGetAccessorType | ClassSetAccessorType;
interface ClassMethodType extends SharedClassMemberType {
    kind: 'ClassMethod';
    signatures: FunctionSignatureType[];
}
type ClassPropertyType = BaseTypes & SharedClassMemberType & {
    defaultValue?: unknown;
    isReadonly: boolean;
};
interface FunctionSignatureType extends BaseType {
    kind: 'FunctionSignature';
    modifier?: 'async' | 'generator';
    parameters: ParameterTypes[];
    returnType: string;
}
interface FunctionType extends BaseType {
    kind: 'Function';
    signatures: FunctionSignatureType[];
}
interface ComponentSignatureType extends BaseType {
    kind: 'ComponentSignature';
    modifier?: 'async' | 'generator';
    parameter?: ObjectType | ReferenceType;
    returnType: string;
}
interface ComponentType extends BaseType {
    kind: 'Component';
    signatures: ComponentSignatureType[];
}
interface PrimitiveType extends BaseType {
    kind: 'Primitive';
}
interface ReferenceType extends BaseType {
    kind: 'Reference';
}
interface GenericType extends BaseType {
    kind: 'Generic';
    typeName: string;
    arguments: ParameterTypes[];
}
interface UnknownType extends BaseType {
    kind: 'Unknown';
}
type BaseTypes = StringType | NumberType | BooleanType | SymbolType | ArrayType | TupleType | ObjectType | IntersectionType | EnumType | UnionType | ClassType | FunctionType | ComponentType | PrimitiveType | ReferenceType | GenericType | UnknownType;
type AllTypes = BaseTypes | ClassAccessorType | ClassMethodType | FunctionSignatureType | ComponentSignatureType;
type TypeByKind<Type, Key> = Type extends {
    kind: Key;
} ? Type : never;
type TypeOfKind<Key extends AllTypes['kind']> = TypeByKind<AllTypes, Key>;
type ParameterTypes = CreateParameterType<BaseTypes>;
type PropertyTypes = CreatePropertyType<BaseTypes>;
type ProcessedType = BaseTypes | ParameterTypes | PropertyTypes;
type SymbolMetadata = ReturnType<typeof getSymbolMetadata>;
type SymbolFilter = (symbolMetadata: SymbolMetadata) => boolean;
/** Process type metadata. */
declare function processType(type: Type, enclosingNode?: Node, filter?: SymbolFilter, isRootType?: boolean, defaultValues?: Record<string, unknown> | unknown, useReferences?: boolean): ProcessedType | undefined;
/** Process all function signatures of a given type including their parameters and return types. */
declare function processCallSignatures(signatures: Signature[], enclosingNode?: Node, filter?: SymbolFilter, isRootType?: boolean): FunctionSignatureType[];
/** Process a single function signature including its parameters and return type. */
declare function processSignature(signature: Signature, enclosingNode?: Node, filter?: SymbolFilter, isRootType?: boolean): FunctionSignatureType | undefined;
/** Process all apparent properties of a given type. */
declare function processTypeProperties(type: Type, enclosingNode?: Node, filter?: SymbolFilter, isRootType?: boolean, defaultValues?: Record<string, unknown> | unknown): ProcessedType[];
/** Gather metadata about a symbol. */
declare function getSymbolMetadata(symbol?: Symbol$1, enclosingNode?: Node): {
    /** The name of the symbol if it exists. */
    name?: string;
    /** Whether or not the symbol is exported. */
    isExported: boolean;
    /** Whether or not the symbol is external to the current source file. */
    isExternal: boolean;
    /** Whether or not the symbol is located in node_modules. */
    isInNodeModules: boolean;
    /** Whether or not the symbol is global. */
    isGlobal: boolean;
    /** Whether or not the node is generated by the compiler. */
    isVirtual: boolean;
};
/** Processes a class declaration into a metadata object. */
declare function processClass(classDeclaration: ClassDeclaration, filter?: SymbolFilter): ClassType;

export { type AllTypes, type ArrayType, type BaseType, type BaseTypes, type BooleanType, type ClassAccessorType, type ClassGetAccessorType, type ClassMethodType, type ClassPropertyType, type ClassSetAccessorType, type ClassType, type ComponentSignatureType, type ComponentType, type CreateParameterType, type CreatePropertyType, type EnumType, type FunctionSignatureType, type FunctionType, type GenericType, type IntersectionType, type LiteralExpressionValue, type NumberType, type ObjectType, type ParameterType, type ParameterTypes, type PrimitiveType, type ProcessedType, type PropertyType, type PropertyTypes, type ReferenceType, type SharedClassMemberType, type StringType, type SymbolFilter, type SymbolMetadata, type SymbolType, TreeMode, type TupleType, type TypeByKind, type TypeOfKind, type UnionType, type UnknownType, addComputedTypes, extractExportByIdentifier, findClosestComponentDeclaration, findNamedImportReferences, findReferencesAsJsxElements, findReferencesInSourceFile, findRootComponentReferences, getChildrenFunction, getClassNamesForJsxElement, getComputedQuickInfoAtPosition, getDescendantAtRange, getDiagnosticMessageText, getImportClause, getImportDeclaration, getImportSpecifier, getJsDocMetadata, getJsxElement, getJsxElements, getPropertyDefaultValue, getPropertyDefaultValueKey, getReactFunctionDeclaration, getSymbolDescription, getTypeDeclarationsFromProject, hasJsDocTag, isForwardRefExpression, isJsxComponent, isLiteralExpressionValue, processCallSignatures, processClass, processSignature, processType, processTypeProperties, renameJsxIdentifier, resolveArrayLiteralExpression, resolveJsxAttributeLiteralValue, resolveLiteralExpression, resolveObjectLiteralExpression };
