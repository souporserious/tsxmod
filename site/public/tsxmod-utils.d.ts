import * as ts_morph from 'ts-morph';
import { DiagnosticMessageChain, SourceFile, Expression, ArrayLiteralExpression, ObjectLiteralExpression, Identifier, Node, Project, ts, ImportClause, ImportDeclaration, ImportSpecifier, JsxOpeningElement, JsxSelfClosingElement, JsxElement, VariableDeclaration, FunctionDeclaration, FunctionExpression, ArrowFunction, ClassDeclaration, JsxAttribute, BindingElement, ParameterDeclaration, PropertyAssignment, CallExpression, Symbol as Symbol$1, PropertySignature, InterfaceDeclaration, TypeAliasDeclaration, EnumDeclaration } from 'ts-morph';

/** Parses a diagnostic message into a string. */
declare function getDiagnosticMessageText(message: string | DiagnosticMessageChain): string;

/** Extract a single export and its local dependencies from a source file. */
declare function extractExportByIdentifier(sourceFile: SourceFile, identifier: string): string;

type LiteralExpressionValue = null | boolean | number | string | Record<string, any> | LiteralExpressionValue[];
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
declare function resolveJsxAttributeLiteralValue(attribute: JsxAttribute): LiteralExpressionValue | Symbol | undefined;

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

/** Gets the default values for a set of properties. */
declare function getDefaultValuesFromProperties(properties: Array<BindingElement | ParameterDeclaration | PropertyAssignment>): Record<string, LiteralExpressionValue>;

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

interface SharedMetadata {
    name?: string;
    description?: string;
    tags?: {
        tagName: string;
        text?: string;
    }[];
    type: string;
}
interface SharedValueMetadata extends SharedMetadata {
    defaultValue?: any;
    required?: boolean;
}
interface ValueMetadata extends SharedValueMetadata {
    kind: 'Value';
}
/** Represents a function value e.g. { fn(): void } */
interface FunctionValueMetadata extends SharedValueMetadata {
    kind: 'FunctionValue';
    parameters: ParameterMetadata[];
    returnType: string;
}
/** Represents an object value e.g. { prop: 'value' } */
interface ObjectValueMetadata extends SharedValueMetadata {
    kind: 'ObjectValue';
    properties?: PropertyMetadata[];
    unionProperties?: PropertyMetadata[][];
}
type ParameterMetadata = ValueMetadata | FunctionValueMetadata | ObjectValueMetadata;
type PropertyMetadata = ValueMetadata | FunctionValueMetadata | ObjectValueMetadata;
type PropertyFilter = (property: PropertySignature) => boolean;
interface InterfaceMetadata extends SharedMetadata {
    kind: 'Interface';
    properties: PropertyMetadata[];
    unionProperties?: PropertyMetadata[][];
}
interface TypeAliasMetadata extends SharedMetadata {
    kind: 'TypeAlias';
    properties: PropertyMetadata[];
    unionProperties?: PropertyMetadata[][];
}
interface EnumMetadata extends SharedMetadata {
    kind: 'Enum';
    members: string[];
}
interface ClassMetadata extends SharedMetadata {
    kind: 'Class';
    constructor?: SharedMetadata & {
        parameters: ParameterMetadata[];
    };
    accessors?: ClassAccessorMetadata[];
    methods?: ClassMethodMetadata[];
    properties?: ClassPropertyMetadata[];
}
interface SharedClassMemberMetadata extends SharedMetadata {
    scope?: 'abstract' | 'static';
    visibility?: 'private' | 'protected' | 'public';
}
interface ClassGetAccessorMetadata extends SharedClassMemberMetadata {
    kind: 'ClassGetAccessor';
}
interface ClassSetAccessorMetadata extends SharedClassMemberMetadata {
    kind: 'ClassSetAccessor';
    returnType: string;
    parameters?: ParameterMetadata[];
}
type ClassAccessorMetadata = ClassGetAccessorMetadata | ClassSetAccessorMetadata;
interface ClassMethodMetadata extends SharedClassMemberMetadata {
    kind: 'ClassMethod';
    modifier?: 'async' | 'generator';
    returnType: string;
    parameters: ParameterMetadata[];
}
interface ClassPropertyMetadata extends SharedClassMemberMetadata {
    kind: 'ClassProperty';
    isReadonly: boolean;
}
interface FunctionMetadata extends SharedMetadata {
    kind: 'Function';
    modifier?: 'async' | 'generator';
    parameters: ParameterMetadata[];
    returnType: string;
}
interface ComponentMetadata extends SharedMetadata {
    kind: 'Component';
    properties: PropertyMetadata[];
    unionProperties?: PropertyMetadata[][];
    returnType: string;
}
type Declaration = InterfaceDeclaration | TypeAliasDeclaration | EnumDeclaration | ClassDeclaration | FunctionDeclaration | VariableDeclaration;
type DocumentationMetadata<Type> = Type extends InterfaceDeclaration ? InterfaceMetadata : Type extends TypeAliasDeclaration ? TypeAliasMetadata : Type extends ClassDeclaration ? ClassMetadata : Type extends EnumDeclaration ? EnumMetadata : Type extends FunctionDeclaration ? FunctionMetadata | ComponentMetadata : Type extends VariableDeclaration ? FunctionMetadata | ComponentMetadata : never;
declare function getTypeDocumentation<Type extends Declaration>(declaration: Type, propertyFilter?: PropertyFilter): DocumentationMetadata<Type>;

export { type ClassAccessorMetadata, type ClassGetAccessorMetadata, type ClassMetadata, type ClassMethodMetadata, type ClassPropertyMetadata, type ClassSetAccessorMetadata, type ComponentMetadata, type DocumentationMetadata, type EnumMetadata, type FunctionMetadata, type FunctionValueMetadata, type InterfaceMetadata, type LiteralExpressionValue, type ObjectValueMetadata, type ParameterMetadata, type PropertyFilter, type PropertyMetadata, type SharedClassMemberMetadata, type SharedMetadata, type SharedValueMetadata, TreeMode, type TypeAliasMetadata, type ValueMetadata, addComputedTypes, extractExportByIdentifier, findClosestComponentDeclaration, findNamedImportReferences, findReferencesAsJsxElements, findReferencesInSourceFile, findRootComponentReferences, getChildrenFunction, getClassNamesForJsxElement, getComputedQuickInfoAtPosition, getDefaultValuesFromProperties, getDescendantAtRange, getDiagnosticMessageText, getImportClause, getImportDeclaration, getImportSpecifier, getJsDocMetadata, getJsxElement, getJsxElements, getReactFunctionDeclaration, getSymbolDescription, getTypeDeclarationsFromProject, getTypeDocumentation, hasJsDocTag, isForwardRefExpression, isJsxComponent, isLiteralExpressionValue, renameJsxIdentifier, resolveArrayLiteralExpression, resolveJsxAttributeLiteralValue, resolveLiteralExpression, resolveObjectLiteralExpression };
