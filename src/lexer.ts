export type Token = {
  type:
    | 'EOF'
    | 'BEGIN'
    | 'END'
    | 'IF'
    | 'ELSE'
    | 'WHILE'
    | 'UNTIL'
    | 'NEWLINE' // TODO: figure out if this is required
    | 'LPAREN'
    | 'RPAREN'
    | 'LSQUARE'
    | 'RSQUARE'
    | 'QUOTE'
    | 'ASSIGN'
    | 'PLUS'
    | 'MINUS'
    | 'ASTERISK'
    | 'SLASH'
    | 'HASH'
    | 'DOT'
    | 'COMMA'
    | 'LT'
    | 'LTE'
    | 'GT'
    | 'GTE'
    | 'EQ'
    | 'NEQ'
    | 'QUESTION_MARK'
    | 'ID'
    | 'INT'
    | 'STRING'
  value: string
}

/**
 * Lazy lexer, consumes the tokens on demand.
 */
export const Lexer = (input: string) => {
  const reservedKeywords = ['BEGIN', 'END', 'IF', 'ELSE', 'WHILE', 'UNTIL']
  const tokens: Token[] = []

  let pos = 0
  let line = 1
  let column = 1
  let currentChar = input[pos]

  // Pushes the token into the stack and returns it
  const pushAndTop = (token: Token) => {
    tokens.push(token)

    return token
  }

  const consume = () => {
    pos += 1
    column += 1

    currentChar = input[pos]
  }

  // Looks at the next character without consuming it
  const peek = () => input[pos + 1]

  const consumeInt = () => {
    let int = ''

    while (/[0-9]/.test(currentChar)) {
      int += currentChar
      consume()
    }

    return int
  }

  const consumeId = () => {
    let id = ''

    while (/[a-zA-Z0-9]/.test(currentChar)) {
      id += currentChar
      consume()
    }

    return id
  }

  const consumeString = () => {
    let string = ''
    consume()

    while (currentChar !== '"') {
      string += currentChar
      consume()
    }

    consume()

    return string
  }

  const skipWhitespaces = () => {
    while (/\s/.test(currentChar)) {
      if (currentChar === '\n') {
        line += 1
        column = 1
      }

      consume()
    }
  }

  const skipComment = () => {
    if (currentChar === '/' && peek() === '*') {
      consume()
      consume()

      // Typescript can't infer that there's been a side effect in `consume`
      // @ts-ignore
      while (!(currentChar === '*' && peek() === '/')) {
        // Typescript can't infer that there's been a side effect in `consume`
        // @ts-ignore
        if (currentChar === '\n') {
          line += 1
          column = 1
        }

        consume()
      }

      consume()
      consume()
    }
  }

  const unexpectedCharacterError = () => {
    throw new Error(
      `Unexpected char ${JSON.stringify(currentChar)} at line ${line} column ${column - 1}`,
    )
    // const lines = input.split('\n')

    // const errorMessage = [
    //   `Unexpected char ${JSON.stringify(currentChar)} at line ${line} column ${column - 1}`,
    //   `${lines[line - 2] !== undefined ? `    ${lines[line - 2]}` : ''}`,
    //   `    ${lines[line - 1]}`,
    //   `    ${' '.repeat(column - 2)}^`,
    //   `${lines[line] !== undefined ? `    ${lines[line]}` : ''}`,
    // ]
    //   .join('\n')
    //   .trim()

    // throw new Error(errorMessage)
  }

  return {
    tokens: () => tokens,

    nextToken: () => {
      while (currentChar !== undefined) {
        skipWhitespaces()

        if (currentChar === '/' && peek() === '*') {
          skipComment()
          continue
        }

        if (currentChar === undefined) {
          break
        }

        if (currentChar === '+') {
          consume()

          return pushAndTop({ type: 'PLUS', value: '+' })
        }

        if (currentChar === '-') {
          consume()

          return pushAndTop({ type: 'MINUS', value: '-' })
        }

        if (currentChar === '*') {
          consume()

          return pushAndTop({ type: 'ASTERISK', value: '*' })
        }

        if (currentChar === '/') {
          consume()

          return pushAndTop({ type: 'SLASH', value: '/' })
        }

        if (currentChar === '<' && peek() === '-') {
          consume()
          consume()

          return pushAndTop({ type: 'ASSIGN', value: '<-' })
        }

        if (currentChar === '<' && peek() === '=') {
          consume()
          consume()

          return pushAndTop({ type: 'LTE', value: '<=' })
        }

        if (currentChar === '<' && peek() === '>') {
          consume()
          consume()

          return pushAndTop({ type: 'NEQ', value: '<>' })
        }

        if (currentChar === '<') {
          consume()

          return pushAndTop({ type: 'LT', value: '<' })
        }

        if (currentChar === '=') {
          consume()

          return pushAndTop({ type: 'EQ', value: '=' })
        }

        if (currentChar === '>' && peek() === '=') {
          consume()
          consume()

          return pushAndTop({ type: 'GTE', value: '>=' })
        }

        if (currentChar === '>') {
          consume()

          return pushAndTop({ type: 'GT', value: '>' })
        }

        if (/[0-9]/.test(currentChar)) {
          return pushAndTop({ type: 'INT', value: consumeInt() })
        }

        if (currentChar === '"') {
          return pushAndTop({ type: 'STRING', value: consumeString() })
        }

        if (/[a-zA-Z0-9]/.test(currentChar)) {
          const id = consumeId()

          return pushAndTop({
            type: reservedKeywords.includes(id) ? (id as Token['type']) : 'ID',
            value: id,
          })
        }

        unexpectedCharacterError()
      }

      return pushAndTop({ type: 'EOF', value: 'EOF' })
    },
  }
}
