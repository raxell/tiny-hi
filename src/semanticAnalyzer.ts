import { Node, FunctionDefinitionNode, ProgramNode } from './parser'

type Scope = {
  formalParams: string[]
  functions: Set<string>
  variables: Set<string>
  astNode: FunctionDefinitionNode
}

export const globalScopeName = '_Global'

export const semanticAnalyzer = (ast: ProgramNode) => {
  // Assumes there can't be functions with the same name
  const scopes = new Map<string, Scope>()
  const globalScope: Scope = {
    formalParams: [],
    functions: new Set(),
    variables: new Set(),
    astNode: ast.block,
  }
  let currentScope = globalScope
  scopes.set(globalScopeName, currentScope)

  // Populates the global scope for subsequent check of symbol definitions
  const buildGlobalScope = (node: Node) => {
    switch (node.type) {
      case 'FunctionDefinition':
        // Global functions are kept in the global scope
        if (node.global) {
          globalScope.functions.add(node.name)
        }
        node.statements.forEach((statement) => buildGlobalScope(statement))
        return

      case 'Loop':
        buildGlobalScope(node.predicate)
        node.statements.forEach((statement) => buildGlobalScope(statement))
        return

      case 'IfExpression':
        buildGlobalScope(node.predicate)
        node.thenStatements.forEach((statement) => buildGlobalScope(statement))
        node.elseStatements.forEach((statement) => buildGlobalScope(statement))
        return

      case 'Predicate':
        buildGlobalScope(node.left)
        buildGlobalScope(node.right)
        return

      case 'Assignment':
        if (node.right === null) {
          // Global variables are kept in the global scope
          if (node.global) {
            // If it's a deallocation mark the global var as uninitialized
            globalScope.variables.delete(node.left)
          }
          return
        }
        // Global variables are kept in the global scope
        if (node.global) {
          globalScope.variables.add(node.left)
        }
        buildGlobalScope(node.right)
        return

      case 'Var':
        return

      case 'FunctionCall':
        node.actualParams.forEach((actualParam) => buildGlobalScope(actualParam))
        return

      case 'OutputExpression':
        buildGlobalScope(node.expression)
        return

      case 'Program':
        buildGlobalScope(node.block)
        return

      case 'BinaryOp':
        buildGlobalScope(node.left)
        buildGlobalScope(node.right)
        return

      case 'UnaryOp':
        buildGlobalScope(node.value)
        return

      case 'Vector':
        node.elements.forEach((element) => buildGlobalScope(element))
        return

      case 'Int':
        return

      case 'String':
        return
    }
  }

  // Perform some semantic checks: undefined varialbe, param reassignment, missing function params, etc...
  const evaluate = (node: Node) => {
    switch (node.type) {
      case 'FunctionDefinition':
        if (scopes.has(node.name)) {
          throw new Error(`Function "${node.name}" has already been defined`)
        }

        // Global functions are kept in the global scope
        ;(node.global ? globalScope : currentScope).functions.add(node.name)
        // Create a new scope for the current function
        const previousScope = currentScope
        currentScope = {
          formalParams: node.formalParams,
          functions: new Set([node.name]),
          variables: new Set(),
          astNode: node,
        }
        scopes.set(node.name, currentScope)
        // Populate the scope
        node.statements.forEach((statement) => evaluate(statement))
        // End of function definition, back to the previous scope
        currentScope = previousScope

        return

      case 'Loop':
        evaluate(node.predicate)
        node.statements.forEach((statement) => evaluate(statement))
        return

      case 'IfExpression':
        evaluate(node.predicate)
        node.thenStatements.forEach((statement) => evaluate(statement))
        node.elseStatements.forEach((statement) => evaluate(statement))
        return

      case 'Predicate':
        evaluate(node.left)
        evaluate(node.right)
        return

      case 'Assignment':
        if (currentScope.formalParams.includes(node.left)) {
          throw new Error(`Cannot reassign to function parameter "${node.left}"`)
        }

        // Global variables are kept in the global scope
        const scope = node.global ? globalScope : currentScope
        // Remove the variable from the scope if the assignment is a deallocation
        if (node.right === null) {
          scope.variables.delete(node.left)
          return
        }

        scope.variables.add(node.left)
        evaluate(node.right)

        return

      case 'Var':
        if (
          !globalScope.variables.has(node.name) &&
          !currentScope.formalParams.includes(node.name) &&
          !currentScope.variables.has(node.name)
        ) {
          throw new Error(`Undefined variable "${node.name}"`)
        }

        if (node.subscript !== null) {
          evaluate(node.subscript)
        }

        return

      case 'FunctionCall':
        const calledFunctionScope = node.global ? globalScope : scopes.get(node.name)

        if (calledFunctionScope === undefined) {
          throw new Error(`Undefined function "${node.name}"`)
        }

        if (calledFunctionScope.formalParams.length !== node.actualParams.length) {
          throw new Error(
            `Parameters mismatch, expected ${calledFunctionScope.formalParams.length} arguments for function "${calledFunctionScope.astNode.name}" but got ${node.actualParams.length}`,
          )
        }

        node.actualParams.forEach((actualParam) => evaluate(actualParam))

        return

      case 'OutputExpression':
        evaluate(node.expression)
        return

      case 'Program':
        evaluate(node.block)
        return

      case 'BinaryOp':
        evaluate(node.left)
        evaluate(node.right)
        return

      case 'UnaryOp':
        evaluate(node.value)
        return

      case 'Vector':
        node.elements.forEach((element) => evaluate(element))
        return

      case 'Int':
        return

      case 'String':
        return
    }
  }

  // We need to populate the global store first or global variables will be marked as undefined
  buildGlobalScope(ast)
  evaluate(ast)

  return scopes
}
