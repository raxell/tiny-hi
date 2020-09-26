import { ProgramNode, Node } from './parser'
import { globalScopeName, semanticAnalyzer } from './semanticAnalyzer'

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
        const activationRecord = { name: node.name, members: new Map() }

        node.actualParams.forEach((value, index) => {
          activationRecord.members.set(formalParams[index], value)
        })

        callStack.push(activationRecord)
        evaluate(astNode)
        callStack.pop()

        return

      case 'FunctionDefinition':
        callStack.push({ name: node.name, members: new Map() })
        node.statements
          // Functions definitions must be executed only when called
          .filter((statement) => statement.type !== 'FunctionDefinition')
          .forEach((statement) => evaluate(statement))
        callStack.pop()

        return node.statements.slice(-1)[0]

      case 'Assignment':
        getCurrentStackFrame().members.set(node.left, evaluate(node.right))
        return

      case 'OutputExpression':
        console.log((evaluate(node.expression) as unknown[]).join(' '))
        return

      case 'Var':
        return getCurrentStackFrame().members.get(node.name)

      case 'Int':
        return node.value

      case 'Vector':
        // The parser can generate nested vectors, flatten them to execute operations as expected
        return node.elements.map((element) => evaluate(element)).flat()

      case 'UnaryOp':
        switch (node.op) {
          case 'NEGATION':
            return (evaluate(node.value) as number[]).map((element) => -element)
          case 'LENGTH':
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

  evaluate(scopes.get(globalScopeName)!.astNode)
}
