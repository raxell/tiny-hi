import { FunctionCallNode, AssignmentNode, ProgramNode, Node } from './parser'
import { globalScopeName, semanticAnalyzer } from './semanticAnalyzer'

const isVectorOfStrings = (vector: unknown[]): vector is string[] =>
  Array.isArray(vector) && vector.every((element) => typeof element === 'string')

const isVectorOfInts = (vector: unknown[]): vector is number[] =>
  Array.isArray(vector) && vector.every((element) => typeof element === 'number')

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

        // set the parameters as variables in the stack frame by using the formal parameter as name and the actual parameter as value
        node.actualParams.forEach((value, index) => {
          stackFrame.members.set(formalParams[index], evaluate(value))
        })

        callStack.push(stackFrame)
        const result = evaluate(astNode)
        callStack.pop()

        // the return of the function call can be undefined if the function does not return any value
        return result

      case 'FunctionDefinition':
        node.statements
          // Functions definitions must be executed only when called, skip execution now
          .filter((statement) => statement.type !== 'FunctionDefinition')
          .forEach((statement) => evaluate(statement))

        // the return value of the function is the variable with its same name, if exists
        return getCurrentStackFrame().members.get(node.name)

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
        // UNTIL loop is handled by negating the while condition
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
        // Global variables are stored on the global stack frame
        const members = (node.global ? callStack[0] : getCurrentStackFrame()).members

        // Deallocation of variable
        if (node.right === null) {
          members.delete(node.left)
          return
        }

        members.set(node.left, evaluate(node.right))
        return

      case 'OutputExpression':
        const vector = evaluate(node.expression) as number[] | [string]

        // The vector can be undefined if it comes from a function with no return value, in
        // that case don't print anything
        if (vector === undefined) {
          return
        }

        if (isVectorOfInts(vector)) {
          console.log(vector.join(' '))
          return
        }

        console.log(vector[0])
        return

      case 'Var':
        // Get the variable from the global stack frame if it is a global var
        const variableValue = (node.global ? callStack[0] : getCurrentStackFrame()).members.get(
          node.name,
        ) as number[] | [string]

        // A variable can be undefined at runtime if has been deallocated or if it is a global variable not initialized yet
        if (variableValue === undefined) {
          const message = node.name.startsWith('.')
            ? `Uninitialized global variable "${node.name}"`
            : `Undefined variable "${node.name}"`
          throw new Error(message)
        }

        if (node.subscript) {
          const varElements =
            typeof variableValue[0] === 'string' ? variableValue[0].split('') : variableValue

          const subscriptElements = (evaluate(node.subscript) as (number | string)[]).map(
            (value) => {
              // Only integers can be used as index
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

        if (vec.some((element) => element === undefined)) {
          throw new Error('Vector error, vector elements cannot be undefined')
        }

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
