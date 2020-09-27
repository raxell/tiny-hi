import { Lexer, Token } from './lexer'

export type ProgramNode = { type: 'Program'; block: FunctionDefinitionNode }
export type FunctionDefinitionNode = {
  type: 'FunctionDefinition'
  name: string
  formalParams: string[]
  statements: Statement[]
}
export type AssignmentNode = { type: 'Assignment'; left: string; right: Node }
type OutputExpressionNode = { type: 'OutputExpression'; expression: Statement }
type Statement = Exclude<Node, { type: 'Program' }>
type Expression = Exclude<Node, { type: 'Program' }>
type VectorNode = { type: 'Vector'; elements: Expression[] }
type VarNode = { type: 'Var'; name: string }
export type FunctionCallNode = { type: 'FunctionCall'; name: string; actualParams: Node[] }
type IntNode = { type: 'Int'; value: number }
type UnaryOpNode = { type: 'UnaryOp'; op: 'LENGTH' | 'NEGATION'; value: VectorNode }
type BinaryOpNode = { type: 'BinaryOp'; op: 'ADD' | 'SUB' | 'MUL' | 'DIV'; left: Node; right: Node }

export type Node =
  | ProgramNode
  | FunctionCallNode
  | FunctionDefinitionNode
  | AssignmentNode
  | OutputExpressionNode
  | VarNode
  | IntNode
  | VectorNode
  | UnaryOpNode
  | BinaryOpNode

/**
 * Recursive descendant parser.
 *
 * Grammar
 * -------
 *
 * Doubts:
 * - is `A[1] <- 2` a valid assignment expression?
 *
 * program: programDefinition NEWLINE
 * programDefinition: BEGIN name NEWLINE statementList END
 * functionDefinition: BEGIN name (LPAREN ID (COMMA ID)* RPAREN)? NEWLINE statementList END
 * statementList: (statement NEWLINE)+
 * statement: functionDefinition | funCall | assignment | expression
 * assignment: ID ASSIGN expression
 * expression: intExpression
 * intExpression: operand ((PLUS | MINUS) operand)*
 * operand: factor ((STAR | SLASH) factor)*
 * factor: TILDE vec | HASH vec | LPAREN intexpr RPAREN | vec
 * vector: element element*
 * element: INT | var | funCall | factor
 * var: ID (LSQUARE intExpression RSQUARE)?
 * funCall: ID LPAREN (expression (COMMA expression)*)? RPAREN
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

    currentToken = lexer.nextToken()
  }

  // Checks if the given token represents the start of an element
  const isStartOfElement = (token: Token) =>
    ['INT', 'ID', 'TILDE', 'HASH', 'LPAREN'].includes(token.type)

  // Checks if the given token represents the start of an expression
  const isStartOfExpression = (token: Token) =>
    ['MINUS', 'HASH', 'LPAREN', 'INT', 'ID'].includes(token.type)

  // Grammar rules

  const funCall = () => {
    const name = currentToken.value
    const actualParams: Node[] = []
    consume('ID')
    consume('LPAREN')

    if (isStartOfExpression(currentToken)) {
      actualParams.push(expression())

      while (currentToken.type === 'COMMA') {
        actualParams.push(expression())
      }
    }

    consume('RPAREN')

    return { type: 'FunctionCall', name, actualParams } as const
  }

  const element = () => {
    if (currentToken.type === 'ID' && lexer.peek().type === 'LPAREN') {
      return funCall()
    }

    if (currentToken.type === 'ID') {
      const name = currentToken.value
      consume('ID')

      return { type: 'Var', name } as const
    }

    if (currentToken.type === 'INT') {
      const value = Number(currentToken.value)
      consume('INT')

      return { type: 'Int', value } as const
    }

    return factor()
  }

  const vector = (): VectorNode => {
    const elements = [element()]

    while (isStartOfElement(currentToken)) {
      elements.push(element())
    }

    return { type: 'Vector', elements } as const
  }

  var factor = (): Expression => {
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

  const expression = () => {
    return intExpression()
  }

  const assignment = (): AssignmentNode => {
    const id = currentToken
    consume('ID')
    consume('ASSIGN')

    return { type: 'Assignment', left: id.value, right: expression() }
  }

  const statement = (): Statement => {
    if (currentToken.type === 'BEGIN') {
      return functionDefinition()
    }

    if (currentToken.type === 'ID' && lexer.peek().type === 'ASSIGN') {
      return assignment()
    }

    if (currentToken.type === 'ID' && lexer.peek().type === 'LPAREN') {
      return { type: 'OutputExpression', expression: funCall() }
    }

    return { type: 'OutputExpression', expression: expression() }
  }

  // The parameter `isProgramDefinition` si just for convenience, it avoids to define
  // a new grammar rule with its corresponding function
  const statementList = (isProgramDefinition: boolean): Statement[] => {
    const statements = [statement()]
    consume('NEWLINE')

    while (currentToken.type !== 'END') {
      statements.push(statement())
      consume('NEWLINE')
    }

    if (!isProgramDefinition) {
      const lastStatement = statements.slice(-1)[0]

      // The last statement can't be an output expression for functions other than the program
      if (lastStatement.type === 'OutputExpression') {
        statements.pop()
        statements.push(lastStatement.expression)
      }
    }

    return statements
  }

  const functionDefinition = (): FunctionDefinitionNode => {
    consume('BEGIN')
    const name = currentToken.value
    const formalParams = []
    consume('ID')

    if (currentToken.type === 'LPAREN') {
      consume('LPAREN')
      formalParams.push(currentToken.value)
      consume('ID')

      // Typescript can't infer that there's been a side effect in `consume`
      // @ts-ignore
      while (currentToken.type === 'COMMA') {
        consume('COMMA')
        formalParams.push(currentToken.value)
        consume('ID')
      }

      consume('RPAREN')
    }

    consume('NEWLINE')
    const statements = statementList(false)
    consume('END')

    return { type: 'FunctionDefinition', name, formalParams, statements }
  }

  // A program is a special case of a function definition, it has no parameters nor return expression
  const programDefinition = (): FunctionDefinitionNode => {
    consume('BEGIN')
    const name = currentToken.value
    consume('ID')
    consume('NEWLINE')
    const statements = statementList(true)
    consume('END')

    // No need to define a new node, the semantic remains the same of a function definition
    return { type: 'FunctionDefinition', name, formalParams: [], statements }
  }

  const program = (): ProgramNode => {
    const blockNode = programDefinition()
    consume('NEWLINE')
    consume('EOF')

    return { type: 'Program', block: blockNode }
  }

  return program()
}
