import { Node } from './parser'

const binaryOp = {
  ADD: (left: number, right: number) => left + right,
  SUB: (left: number, right: number) => left - right,
  MUL: (left: number, right: number) => left * right,
  DIV: (left: number, right: number) => Math.trunc(left / right),
} as const

export const Interpreter = (ast: Node) => {
  const store = new Map<string, any>()

  const evaluate = (node: Node): unknown => {
    switch (node.type) {
      case 'Program':
        return evaluate(node.block)

      case 'FunctionDefinition':
        return node.statements.forEach((statement) => evaluate(statement))

      case 'Assignment':
        store.set(node.left, evaluate(node.right))
        return

      case 'OutputExpression':
        console.log((evaluate(node.expression) as unknown[]).join(' '))
        return

      case 'Var':
        if (!store.has(node.name)) {
          throw new Error(`Undefined variable "${node.name}"`)
        }

        return store.get(node.name)

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

  evaluate(ast)
}
