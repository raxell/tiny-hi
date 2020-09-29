import { FunctionCallNode, AssignmentNode, ProgramNode, Node } from './parser'
import { globalScopeName, semanticAnalyzer } from './semanticAnalyzer'

const isNode = <T>(value: unknown, type: Node['type']): value is T =>
  typeof value === 'object' && value !== null && (value as Node).type === type

const isVectorOfStrings = (vector: unknown[]): vector is string[] =>
  vector.every((element) => typeof element === 'string')

const isVectorOfInts = (vector: unknown[]): vector is number[] =>
  vector.every((element) => typeof element === 'number')

const maximumCallStack = 100

const binaryOp = {
  ADD: (left: number, right: number) => left + right,
  SUB: (left: number, right: number) => left - right,
  MUL: (left: number, right: number) => left * right,
  DIV: (left: number, right: number) => Math.trunc(left / right),
} as const

const relationalOp = {
  LTE: (left: number | string, right: number | string) => left <= right,
  LT: (left: number | string, right: number | string) => left < right,
  EQ: (left: number | string, right: number | string) => left === right,
  NEQ: (left: number | string, right: number | string) => left !== right,
  GT: (left: number | string, right: number | string) => left > right,
  GTE: (left: number | string, right: number | string) => left >= right,
} as const

type StackFrame = { name: string; members: Map<string, any> }

export const Interpreter = (ast: ProgramNode) => {
  const scopes = semanticAnalyzer(ast)
  const callStack: StackFrame[] = []

  const getCurrentStackFrame = () => callStack.slice(-1)[0]

  const evaluate = (node: Node): unknown => {
    switch (node.type) {
      case 'Program':
        return evaluate(node.block)

      case 'FunctionCall':
        if (callStack.length > maximumCallStack) {
          throw new Error('Maximum call stack exceeded')
        }

        const { formalParams, astNode } = scopes.get(node.name)!
        const stackFrame = { name: node.name, members: new Map() }

        node.actualParams.forEach((value, index) => {
          stackFrame.members.set(formalParams[index], evaluate(value))
        })

        callStack.push(stackFrame)
        const result = evaluate(astNode)
        callStack.pop()

        if (isNode<AssignmentNode>(result, 'Assignment')) {
          return evaluate(result.right)
        }

        return result

      case 'FunctionDefinition':
        return (
          node.statements
            // Functions definitions must be executed only when called
            .filter((statement) => statement.type !== 'FunctionDefinition')
            .map((statement) => evaluate(statement))
            .slice(-1)[0]
        )

      case 'Predicate':
        const left = evaluate(node.left) as number[] | [string]
        const right = evaluate(node.right) as number[] | [string]

        if (isVectorOfInts(left) && isVectorOfInts(right)) {
          if (left.length === right.length) {
            return left.every((element, index) => relationalOp[node.op](element, right[index]))
          }

          throw new Error('Incompatible vector lengths.')
        }

        if (isVectorOfStrings(left) && isVectorOfStrings(right)) {
          return relationalOp[node.op](left.join(''), right.join(''))
        }

        throw new Error(
          `Type mismatch, operator "${node.op}" can only be computed on vectors of the same type`,
        )

      case 'Loop':
        while (node.positive ? evaluate(node.predicate) : !evaluate(node.predicate)) {
          node.statements.forEach((statement) => evaluate(statement))
        }
        return

      case 'IfExpression':
        if (evaluate(node.predicate)) {
          return node.thenStatements.map((statement) => evaluate(statement)).slice(-1)[0]
        }

        return node.elseStatements.map((statement) => evaluate(statement)).slice(-1)[0]

      case 'Assignment':
        const value = evaluate(node.right)
        // Global variables are stored on the global stack frame
        ;(node.global ? callStack[0] : getCurrentStackFrame()).members.set(node.left, value)
        // Assignment is a valid return value for functions, so it is an expression
        return value

      case 'OutputExpression':
        const vector = evaluate(node.expression) as number[] | [string]

        if (isVectorOfInts(vector)) {
          console.log(vector.join(' '))
          return vector
        }

        console.log(vector[0])
        return vector

      case 'Var':
        const variableValue = (node.global ? callStack[0] : getCurrentStackFrame()).members.get(
          node.name,
        ) as number[] | [string]

        if (variableValue === undefined) {
          throw new Error(`Uninitialized global variable "${node.name}"`)
        }

        if (node.subscript) {
          const varElements =
            typeof variableValue[0] === 'string' ? variableValue[0].split('') : variableValue

          const subscriptElements = (evaluate(node.subscript) as (number | string)[]).map(
            (value) => {
              if (typeof value !== 'number') {
                throw new Error(`Invalid subscript expression "${value}"`)
              }

              if (varElements[value - 1] === undefined) {
                throw new Error('Subscript out of range')
              }

              return varElements[value - 1]
            },
          )

          return typeof subscriptElements[0] === 'string'
            ? subscriptElements.join('')
            : subscriptElements
        }

        return variableValue

      case 'Int':
        return node.value

      case 'String':
        return node.value

      case 'Vector':
        // The parser can generate nested vectors, flatten them to execute operations as expected
        const vec = node.elements.map((element) => evaluate(element)).flat()

        if (!isVectorOfInts(vec) && !isVectorOfStrings(vec)) {
          throw new Error('Vector error, vector elements must be of the same type')
        }

        return typeof vec[0] === 'string' ? [vec.join('')] : vec

      case 'UnaryOp':
        switch (node.op) {
          case 'NEGATION':
            const vec = evaluate(node.value) as number[] | [string]

            if (isVectorOfInts(vec)) {
              return vec.map((element) => -element)
            }

            throw new Error(
              'Type mismatch, operator "~" is only applicable to a vector of integers',
            )

          case 'LENGTH':
            const vector = evaluate(node.value) as number[] | [string]

            if (isVectorOfInts(vector)) {
              return [vector.length]
            }

            return [vector[0].length]
        }

      case 'BinaryOp':
        switch (node.op) {
          case 'ADD':
          case 'SUB':
          case 'MUL':
          case 'DIV':
            const left = evaluate(node.left) as number[] | [string]
            const right = evaluate(node.right) as number[] | [string]

            if (!isVectorOfInts(left) || !isVectorOfInts(right)) {
              throw new Error(
                `Type mismatch, operator "${node.op}" can only be applied to vectors of integers`,
              )
            }

            if (left.length === right.length) {
              return left.map((element, index) => binaryOp[node.op](element, right[index]))
            }

            if (left.length === 1) {
              return right.map((element) => binaryOp[node.op](element, left[0]))
            }

            throw new Error('Incompatible vector lengths.')
        }
    }
  }

  // Allocate a frame for the global scope
  callStack.push({ name: globalScopeName, members: new Map() })

  const entrypoint = scopes.get(globalScopeName)!.astNode
  callStack.push({ name: entrypoint.name, members: new Map() })
  evaluate(entrypoint)
}
