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
  let currentScope: Scope = {
    formalParams: [],
    functions: new Set(),
    variables: new Set(),
    astNode: ast.block,
  }
  scopes.set(globalScopeName, currentScope)

  const evaluate = (node: Node) => {
    switch (node.type) {
      case 'FunctionDefinition':
        if (scopes.has(node.name)) {
          throw new Error(`Function "${node.name}" has already been defined`)
        }

        if (currentScope) {
          currentScope.functions.add(node.name)
        }
        const previousScope = currentScope
        currentScope = {
          formalParams: node.formalParams,
          functions: new Set([node.name]),
          variables: new Set(),
          astNode: node,
        }
        scopes.set(node.name, currentScope)
        node.statements.forEach((statement) => evaluate(statement))
        currentScope = previousScope

        return

      case 'Assignment':
        if (currentScope.formalParams.includes(node.left)) {
          throw new Error(`Cannot reassign to function parameter "${node.left}"`)
        }

        currentScope.variables.add(node.left)

        return

      case 'Var':
        if (
          !currentScope.formalParams.includes(node.name) &&
          !currentScope.variables.has(node.name)
        ) {
          throw new Error(`Undefined variable "${node.name}"`)
        }
        return

      case 'FunctionCall':
        const calledFunctionScope = scopes.get(node.name)

        if (calledFunctionScope === undefined) {
          throw new Error(`Undefined function "${node.name}"`)
        }

        if (calledFunctionScope.formalParams.length !== node.actualParams.length) {
          throw new Error(
            `Parameters mismatch, expected ${calledFunctionScope.formalParams.length} arguments for function "${calledFunctionScope.astNode.name}" but got ${node.actualParams.length}`,
          )
        }

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
    }
  }

  evaluate(ast)

  return scopes
}
