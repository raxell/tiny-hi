import { FunctionCallNode, AssignmentNode, ProgramNode, Node } from './parser'
import { globalScopeName, semanticAnalyzer } from './semanticAnalyzer'

const isNode = <T>(value: unknown, type: Node['type']): value is T =>
  typeof value === 'object' && value !== null && (value as Node).type === type

const maximumCallStack = 100

const binaryOp = {
  ADD: (left: number, right: number) => left + right,
  SUB: (left: number, right: number) => left - right,
  MUL: (left: number, right: number) => left * right,
  DIV: (left: number, right: number) => Math.trunc(left / right),
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

      case 'Assignment':
        const value = evaluate(node.right)
        getCurrentStackFrame().members.set(node.left, value)
        // Assignment is a valid return value for functions, so it is an expression
        return value

      case 'OutputExpression':
        const vector = evaluate(node.expression) as (string | number)[]

        // @TODO: check elements compatibility
        if (typeof vector[0] === 'string') {
          console.log((evaluate(node.expression) as string[]).join(''))
          return
        }

        console.log((evaluate(node.expression) as number[]).join(' '))
        return

      case 'Var':
        return getCurrentStackFrame().members.get(node.name)

      case 'Int':
        return node.value

      case 'String':
        return node.value

      case 'Vector':
        // The parser can generate nested vectors, flatten them to execute operations as expected
        return node.elements.map((element) => evaluate(element)).flat()

      case 'UnaryOp':
        switch (node.op) {
          case 'NEGATION':
            return (evaluate(node.value) as number[]).map((element) => -element)
          case 'LENGTH':
            const vector = evaluate(node.value) as (number | string)[]

            // @TODO: check elements compatibility
            if (typeof vector[0] === 'string') {
              return [vector.join('').length]
            }

            return [(evaluate(node.value) as number[]).length]
        }

      case 'BinaryOp':
        switch (node.op) {
          case 'ADD':
          case 'SUB':
          case 'MUL':
          case 'DIV':
            const left = evaluate(node.left) as number[]
            const right = evaluate(node.right) as number[]

            if (left.length === right.length) {
              return left.map((element, index) => binaryOp[node.op](element, right[index]))
            }

            if (left.length === 1) {
              return right.map((element) => binaryOp[node.op](element, left[0]))
            }
          default:
            throw new Error('Incompatible vector lengths.')
        }
    }
  }

  const entrypoint = scopes.get(globalScopeName)!.astNode
  callStack.push({ name: entrypoint.name, members: new Map() })
  evaluate(entrypoint)
}
