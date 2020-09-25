import { Node } from './parser'

const binaryOp = {
  ADD: (left: number, right: number) => left + right,
  SUB: (left: number, right: number) => left - right,
  MUL: (left: number, right: number) => left * right,
  DIV: (left: number, right: number) => Math.trunc(left / right),
} as const

export const Interpreter = (ast: Node) => {
  const evaluate = (node: Node): unknown => {
    switch (node.type) {
      case 'Program':
        return node.expressions[0] ? evaluate(node.expressions[0]) : null

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

  const result = evaluate(ast)

  if (typeof result === 'number') {
    return String(result)
  }

  if (Array.isArray(result)) {
    return result.join(' ')
  }

  return result
}
