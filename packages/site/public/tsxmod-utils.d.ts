import { SourceFile, FunctionDeclaration, Identifier, Node, Project, ts, ImportClause, ImportDeclaration, ImportSpecifier, JsxOpeningElement, JsxSelfClosingElement, JsxElement, PropertyAssignment, BindingElement } from 'ts-morph';

/** Extract a single export and its local dependencies from a source file. */
declare function extractExportByIdentifier(sourceFile: SourceFile, identifier: string): string;

/** Get the parameter types for a function declaration. */
declare function getFunctionParameterTypes(declaration: FunctionDeclaration): {
    name: string | null;
    type: string | ({
        name: string;
        type: string;
        comment: string;
    } | null)[];
}[];

/** Find all references for an identifier in the file it is defined in or another source file. */
declare function findReferencesInSourceFile(identifier: Identifier, sourceFile?: SourceFile): Node[];

/**
 * Find all references for a named import.
 *
 * @example
 * const references = findNamedImportReferences(project, 'package', 'Stack')
 */
declare function findNamedImportReferences(project: Project, moduleSpecifierValue: string, namedImportName: string): Node<ts.Node>[];

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

/** Returns a functional component declaration, unwrapping forwardRef if needed. */
declare function getFunctionComponentDeclaration(declaration: Node): Node | null;

/** Get the first descendant JsxElement based on the identifier. */
declare function getJsxElement(node: Node, name: string): JsxOpeningElement | JsxSelfClosingElement | undefined;
/** Get all descendant JsxOpeningElement and JsxSelfClosingElement nodes. */
declare function getJsxElements(node: Node): (JsxOpeningElement | JsxSelfClosingElement)[];

/** Gets the prop types for a component declaration. */
declare function getPropTypes(declaration: Node): ({
    name: string;
    required: boolean;
    description: string | null;
    type: string;
    defaultValue: string | number | true | null;
} | null)[] | null;

/** Determines a JSX component by checking if the name is uppercase. */
declare function isComponent(name: string): boolean;

/** Determines if an expression is using React.forwardRef. */
declare function isForwardRefExpression(initializer: Node): boolean;

/** Renames JSX Element Identifier accounting for opening, closing, and self-closing elements. */
declare function renameJsxIdentifier(jsxElement: JsxElement | JsxSelfClosingElement, identifier: string): boolean;

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
declare function getDefaultValuesFromProperties(properties: Array<PropertyAssignment | BindingElement>): Record<string, string | number | boolean | null>;

export { TreeMode, extractExportByIdentifier, findClosestComponentDeclaration, findNamedImportReferences, findReferencesAsJsxElements, findReferencesInSourceFile, findRootComponentReferences, getChildrenFunction, getDefaultValuesFromProperties, getDescendantAtRange, getFunctionComponentDeclaration, getFunctionParameterTypes, getImportClause, getImportDeclaration, getImportSpecifier, getJsxElement, getJsxElements, getPropTypes, getTypeDeclarationsFromProject, isComponent, isForwardRefExpression, renameJsxIdentifier };
