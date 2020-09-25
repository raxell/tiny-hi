import { Lexer, Token } from './lexer'

type ProgramNode = { type: 'Program'; expressions: Node[] }
type VectorNode = { type: 'Vector'; elements: Node[] }
type IntNode = { type: 'Int'; value: number }
type UnaryOpNode = { type: 'UnaryOp'; op: 'LENGTH' | 'NEGATION'; value: VectorNode }
type BinaryOpNode = { type: 'BinaryOp'; op: 'ADD' | 'SUB' | 'MUL' | 'DIV'; left: Node; right: Node }

export type Node = ProgramNode | IntNode | VectorNode | UnaryOpNode | BinaryOpNode

/**
 * Recursive descendant parser.
 *
 * Grammar
 * -------
 *
 * program: intExpression
 * intExpression: operand ((PLUS | MINUS) operand)*
 * operand: factor ((STAR | SLASH) factor)*
 * factor: MINUS vec | HASH vec | LPAREN intexpr RPAREN | vec
 * vector: element element*
 * element: INT | var | fun | factor
 */
export const Parser = (input: string) => {
  const lexer = Lexer(input)
  let currentToken: Token = lexer.nextToken()!

  const assertToken = (token: Token, type: Token['type']) => {
    if (token.type !== type) {
      // @TODO: improve error message by providing at least line:col informations
      throw new Error(`Syntax error: expected token "${type}" but got "${token.type}".`)
    }
  }

  const consume = (type: Token['type']) => {
    if (currentToken.type !== type) {
      assertToken(currentToken, type)

      return
    }

    currentToken = lexer.nextToken()!
  }

  const element = () => {
    if (currentToken.type === 'INT') {
      const value = Number(currentToken.value)
      consume('INT')

      return { type: 'Int', value } as const
    }

    return factor()
  }

  const vector = (): VectorNode => {
    const elements = [element()]

    while (['INT', 'TILDE', 'HASH', 'LPAREN'].includes(currentToken.type)) {
      elements.push(element())
    }

    return { type: 'Vector', elements } as const
  }

  var factor = (): Node => {
    if (currentToken.type === 'TILDE') {
      consume('TILDE')

      return { type: 'UnaryOp', op: 'NEGATION', value: vector() } as const
    }

    if (currentToken.type === 'HASH') {
      consume('HASH')

      return { type: 'UnaryOp', op: 'LENGTH', value: vector() } as const
    }

    if (currentToken.type === 'LPAREN') {
      consume('LPAREN')
      const node = intExpression()
      consume('RPAREN')

      return node
    }

    return vector()
  }

  const operand = () => {
    let node = factor()

    while (['ASTERISK', 'SLASH'].includes(currentToken.type)) {
      const op = currentToken.type === 'ASTERISK' ? 'MUL' : 'DIV'
      consume(currentToken.type)

      node = { type: 'BinaryOp', op, left: node, right: factor() } as const
    }

    return node
  }

  var intExpression = () => {
    let node = operand()

    while (['PLUS', 'MINUS'].includes(currentToken.type)) {
      const op = currentToken.type === 'PLUS' ? 'ADD' : 'SUB'
      consume(currentToken.type)

      node = { type: 'BinaryOp', op, left: node, right: operand() } as const
    }

    return node
  }

  const program = (): ProgramNode => {
    const expressions = currentToken.type === 'EOF' ? [] : [intExpression()]
    consume('EOF')

    return { type: 'Program', expressions }
  }

  return program()
}
