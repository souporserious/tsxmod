import * as ts_morph from 'ts-morph';
import { DiagnosticMessageChain, SourceFile, Expression, Identifier, Node, Project, ts, ImportClause, ImportDeclaration, ImportSpecifier, JsxOpeningElement, JsxSelfClosingElement, JsxElement, VariableDeclaration, FunctionDeclaration, FunctionExpression, ArrowFunction, ClassDeclaration, JsxAttribute, ObjectLiteralExpression, BindingElement, ParameterDeclaration, PropertyAssignment, CallExpression, Symbol, TaggedTemplateExpression } from 'ts-morph';

/** Parses a diagnostic message into a string. */
declare function getDiagnosticMessageText(message: string | DiagnosticMessageChain): string;

/** Extract a single export and its local dependencies from a source file. */
declare function extractExportByIdentifier(sourceFile: SourceFile, identifier: string): string;

type ExpressionValue = null | boolean | number | string | Record<string, any> | ExpressionValue[];
/** Recursively resolves an expression into a literal value. */
declare function resolveExpression(expression: Expression): ExpressionValue | ExpressionValue[];

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

/** Gets the prop types for a component declaration. */
declare function getPropTypes(declaration: Node): ({
    name: string;
    required: boolean;
    description: string | null;
    type: string;
    defaultValue: string | number | boolean | null;
} | null)[] | null;

/** Determines if a node is a JSX component. */
declare function isJsxComponent(node: Node): node is VariableDeclaration | FunctionDeclaration | FunctionExpression | ArrowFunction | ClassDeclaration;

/** Renames JSX Element Identifier accounting for opening, closing, and self-closing elements. */
declare function renameJsxIdentifier(jsxElement: JsxElement | JsxSelfClosingElement, identifier: string): boolean;

/** Resolves the value of a JSX attribute into a literal value. */
declare function resolveJsxAttributeValue(attribute: JsxAttribute): (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any> | any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null) | undefined;

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

/** Resolves an object literal expression to a plain object. */
declare function resolveObject(expression: ObjectLiteralExpression): Record<string, any>;

/** Generates type declarations from a project. */
declare function getTypeDeclarationsFromProject(project: Project): Promise<{
    path: string;
    code: string;
}[]>;

/** Gets the default values for a set of properties. */
declare function getDefaultValuesFromProperties(properties: Array<BindingElement | ParameterDeclaration | PropertyAssignment>): Record<string, string | number | boolean | null>;

/** Returns a functional component declaration, unwrapping forwardRef if needed. */
declare function getReactFunctionDeclaration(declaration: Node): ArrowFunction | FunctionDeclaration | FunctionExpression | null;

/** Determines if an expression is using React.forwardRef. */
declare function isForwardRefExpression(node: Node): node is CallExpression;

/** Gets the description from a symbol's jsdocs or leading comment range. */
declare function getSymbolDescription(symbol: Symbol): string | null;

/** Modifies a source file to add computed types to all eligible type aliases. */
declare function addComputedTypes(sourceFile: SourceFile): void;

/**
 * Get the computed quick info at a position in a source file.
 * Note, this will modify the source file by adding computed types.
 */
declare function getComputedQuickInfoAtPosition(sourceFile: SourceFile, position: number): ts.QuickInfo | undefined;

/** Analyzes metadata and parameter types from functions, tagged templates, and call expressions. */
declare function getTypeDocumentation(declarationOrExpression: FunctionDeclaration | FunctionExpression | ArrowFunction | TaggedTemplateExpression | CallExpression): {
    name: string | null;
    description: string | null;
    defaultValue: any;
    required: boolean;
    text: string;
    properties?: PropertyMetadata[] | null | undefined;
    unionProperties?: PropertyMetadata[][] | null | undefined;
}[] | null;
interface PropertyMetadata {
    name: string | null;
    description: string | null;
    defaultValue: any;
    required: boolean;
    text: string;
    properties: (PropertyMetadata | null)[] | null;
    unionProperties?: PropertyMetadata[][];
}

export { type PropertyMetadata, TreeMode, addComputedTypes, extractExportByIdentifier, findClosestComponentDeclaration, findNamedImportReferences, findReferencesAsJsxElements, findReferencesInSourceFile, findRootComponentReferences, getChildrenFunction, getClassNamesForJsxElement, getComputedQuickInfoAtPosition, getDefaultValuesFromProperties, getDescendantAtRange, getDiagnosticMessageText, getImportClause, getImportDeclaration, getImportSpecifier, getJsxElement, getJsxElements, getPropTypes, getReactFunctionDeclaration, getSymbolDescription, getTypeDeclarationsFromProject, getTypeDocumentation, isForwardRefExpression, isJsxComponent, renameJsxIdentifier, resolveExpression, resolveJsxAttributeValue, resolveObject };
