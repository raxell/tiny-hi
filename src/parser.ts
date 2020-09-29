import { Lexer, Token } from './lexer'

export type ProgramNode = { type: 'Program'; block: FunctionDefinitionNode }
export type FunctionDefinitionNode = {
  type: 'FunctionDefinition'
  global: boolean
  name: string
  formalParams: string[]
  statements: Statement[]
}
type LoopNode = {
  type: 'Loop'
  positive: boolean
  predicate: PredicateNode
  statements: Statement[]
}
type IfExpressionNode = {
  type: 'IfExpression'
  predicate: PredicateNode
  thenStatements: Statement[]
  elseStatements: Statement[]
}
// @TODO: make this part of BinaryOpNode or rename the latter to ArithmeticOpNode
type PredicateNode = {
  type: 'Predicate'
  op: 'LTE' | 'LT' | 'EQ' | 'NEQ' | 'GT' | 'GTE'
  left: Expression
  right: Expression
}
export type AssignmentNode = { type: 'Assignment'; global: boolean; left: string; right: Node }
type OutputExpressionNode = { type: 'OutputExpression'; expression: Statement }
type Statement = Exclude<Node, { type: 'Program' }>
type Expression = Exclude<Node, { type: 'Program' }>
type VectorNode = { type: 'Vector'; elements: Expression[] }
type VarNode = { type: 'Var'; global: boolean; name: string; subscript: Expression | null }
export type FunctionCallNode = {
  type: 'FunctionCall'
  global: boolean
  name: string
  actualParams: Node[]
}
type IntNode = { type: 'Int'; value: number }
type StringNode = { type: 'String'; value: string }
type UnaryOpNode = { type: 'UnaryOp'; op: 'LENGTH' | 'NEGATION'; value: VectorNode }
type BinaryOpNode = { type: 'BinaryOp'; op: 'ADD' | 'SUB' | 'MUL' | 'DIV'; left: Node; right: Node }

export type Node =
  | ProgramNode
  | FunctionCallNode
  | FunctionDefinitionNode
  | LoopNode
  | IfExpressionNode
  | PredicateNode
  | AssignmentNode
  | OutputExpressionNode
  | VarNode
  | IntNode
  | StringNode
  | VectorNode
  | UnaryOpNode
  | BinaryOpNode

/**
 * Recursive descendant parser.
 *
 * Grammar
 * -------
 *
 * program: programDefinition NEWLINE
 * programDefinition: BEGIN name NEWLINE statementList END
 * // using ID here is incorrect since params can't start with a DOT but keep this way for simplicity
 * functionDefinition: BEGIN name (LPAREN ID (COMMA ID)* RPAREN)? NEWLINE statementList END
 * statementList: (statement NEWLINE)+
 * statement: functionDefinition | funCall | assignment | expression | loop | ifExpression
 * statementList2: (statement2 NEWLINE)+
 * statement2: funCall | assignment | expression | loop | ifExpression
 * loop: (WHILE | UNTIL) predicate NEWLINE statementList2 END
 * ifExpression: IF predicate NEWLINE statementList2 (ELSE NEWLINE stetementList2)? END
 * predicate: expression (LT | LTE | EQ | NEQ | GT | GTE) expression
 * assignment: ID ASSIGN expression
 * expression: operand ((PLUS | MINUS) operand)*
 * operand: factor ((STAR | SLASH) factor)*
 * factor: TILDE vector | HASH vector | LPAREN expression RPAREN | vector
 * vector: element element*
 * element: INT | variable | funCall | factor | STRING
 * variable: ID (LSQUARE expression RSQUARE)?
 * funCall: ID LPAREN (expression (COMMA expression)*)? RPAREN
 * ID: (DOT)? [A-Z][A-Z0-9_]
 */
export const Parser = (input: string) => {
  const lexer = Lexer(input)
  let currentToken: Token = lexer.nextToken()!

  const assertToken = (token: Token, ...types: Token['type'][]) => {
    if (!types.includes(token.type)) {
      // @TODO: improve error message by providing at least line:col informations
      throw new Error(
        `Syntax error: expected token "${types.join(' or ')}" but got "${token.type}".`,
      )
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
    ['STRING', 'INT', 'ID', 'TILDE', 'HASH', 'LPAREN'].includes(token.type)

  // Checks if the given token represents the start of an expression
  const isStartOfExpression = (token: Token) =>
    ['STRING', 'MINUS', 'HASH', 'LPAREN', 'INT', 'ID'].includes(token.type)

  // Checks if there's another statement to parse for the given block. A block is defined by
  // a function definition (which ends with END) or an if expression (which ends with END and
  // optionally ELSE).
  const hasNextStatement = (token: Token) => !['END', 'ELSE'].includes(token.type)

  // Grammar rules

  const funCall = () => {
    const name = currentToken.value
    const global = name.startsWith('.')
    const actualParams: Node[] = []
    consume('ID')
    consume('LPAREN')

    if (isStartOfExpression(currentToken)) {
      actualParams.push(expression())

      while (currentToken.type === 'COMMA') {
        consume('COMMA')
        actualParams.push(expression())
      }
    }

    consume('RPAREN')

    return { type: 'FunctionCall', global, name, actualParams } as const
  }

  const variable = () => {
    const name = currentToken.value
    const global = name.startsWith('.')
    let subscript = null
    consume('ID')

    if (currentToken.type === 'LSQUARE') {
      consume('LSQUARE')
      subscript = expression()
      consume('RSQUARE')
    }

    return { type: 'Var', global, name, subscript } as const
  }

  const element = () => {
    if (currentToken.type === 'STRING') {
      const node = { type: 'String', value: currentToken.value } as const
      consume('STRING')

      return node
    }

    if (currentToken.type === 'ID' && lexer.peek().type === 'LPAREN') {
      return funCall()
    }

    if (currentToken.type === 'ID') {
      return variable()
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
      const node = expression()
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

  var expression = () => {
    let node = operand()

    while (['PLUS', 'MINUS'].includes(currentToken.type)) {
      const op = currentToken.type === 'PLUS' ? 'ADD' : 'SUB'
      consume(currentToken.type)

      node = { type: 'BinaryOp', op, left: node, right: operand() } as const
    }

    return node
  }

  const assignment = (): AssignmentNode => {
    const id = currentToken
    const global = id.value.startsWith('.')
    consume('ID')
    consume('ASSIGN')

    return { type: 'Assignment', global, left: id.value, right: expression() }
  }

  const predicate = () => {
    const left = expression()

    assertToken(currentToken, 'LTE', 'LT', 'EQ', 'NEQ', 'GT', 'GTE')
    const op = currentToken.type as PredicateNode['op']
    consume(currentToken.type)

    const right = expression()

    return { type: 'Predicate', op, left, right } as const
  }

  const loop = () => {
    assertToken(currentToken, 'WHILE', 'UNTIL')
    const positive = currentToken.type === 'WHILE'
    consume(currentToken.type)
    const predicateNode = predicate()
    consume('NEWLINE')
    const statements = statementList({ excludeFunctionDefinition: true })
    consume('END')

    return { type: 'Loop', positive, predicate: predicateNode, statements } as const
  }

  const ifExpression = () => {
    consume('IF')
    const predicateNode = predicate()
    consume('NEWLINE')
    const thenStatements = statementList({ excludeFunctionDefinition: true })
    const elseStatements = []

    if (currentToken.type === 'ELSE') {
      consume('ELSE')
      consume('NEWLINE')
      elseStatements.push(...statementList({ excludeFunctionDefinition: true }))
    }

    consume('END')

    return {
      type: 'IfExpression',
      predicate: predicateNode,
      thenStatements,
      elseStatements,
    } as const
  }

  // `excludeFunctionDefinition` makes this function act also as the `statement2` rule of the grammar
  const statement = ({
    excludeFunctionDefinition,
  }: {
    excludeFunctionDefinition: boolean
  }): Statement => {
    if (!excludeFunctionDefinition && currentToken.type === 'BEGIN') {
      return functionDefinition()
    }

    if (['WHILE', 'UNTIL'].includes(currentToken.type)) {
      return loop()
    }

    if (currentToken.type === 'IF') {
      return ifExpression()
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
  // a new grammar rule with its corresponding function.
  // Same for `excludeFunctionDefinition`, it just make this act also as the `statementList2`
  // rule of the grammar.
  const statementList = ({
    isProgramDefinition = false,
    excludeFunctionDefinition = false,
  }: {
    isProgramDefinition?: boolean
    excludeFunctionDefinition?: boolean
  } = {}): Statement[] => {
    const statements = [statement({ excludeFunctionDefinition })]
    consume('NEWLINE')

    while (hasNextStatement(currentToken)) {
      statements.push(statement({ excludeFunctionDefinition }))
      consume('NEWLINE')
    }

    // The last statement can't be an output expression for functions other than the program
    if (!isProgramDefinition && !excludeFunctionDefinition) {
      const lastStatement = statements.slice(-1)[0]

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
    const global = name.startsWith('.')
    const formalParams = []
    consume('ID')

    if (currentToken.type === 'LPAREN') {
      consume('LPAREN')
      formalParams.push(currentToken.value)
      consume('ID')
      // This should be handled at grammar level
      if (formalParams.slice(-1)[0].startsWith('.')) {
        throw new Error('Unexpected global function parameter')
      }

      // Typescript can't infer that there's been a side effect in `consume`
      // @ts-ignore
      while (currentToken.type === 'COMMA') {
        consume('COMMA')
        formalParams.push(currentToken.value)
        consume('ID')
        // This should be handled at grammar level
        if (formalParams.slice(-1)[0].startsWith('.')) {
          throw new Error('Unexpected global function parameter')
        }
      }

      consume('RPAREN')
    }

    consume('NEWLINE')
    const statements = statementList()
    consume('END')

    return { type: 'FunctionDefinition', global, name, formalParams, statements }
  }

  // A program is a special case of a function definition, it has no parameters nor return expression
  const programDefinition = (): FunctionDefinitionNode => {
    consume('BEGIN')
    const name = currentToken.value
    consume('ID')
    consume('NEWLINE')
    const statements = statementList({ isProgramDefinition: true })
    consume('END')

    // No need to define a new node, the semantic remains the same of a function definition
    return { type: 'FunctionDefinition', global: false, name, formalParams: [], statements }
  }

  const program = (): ProgramNode => {
    const blockNode = programDefinition()
    consume('NEWLINE')
    consume('EOF')

    return { type: 'Program', block: blockNode }
  }

  return program()
}
