import { Lexer, Token } from './lexer'

// Helper function to consume all the tokens
const tokenize = (input: string) => {
  const lexer = Lexer(input)

  while (lexer.nextToken().type !== 'EOF');

  return lexer.tokens()
}

type Test = {
  description: string
  input: string
  output: Token[] | Error
}

const tests: Test[] = [
  {
    description: 'Empty program',
    input: '',
    output: [{ type: 'EOF', value: 'EOF' }],
  },

  {
    description: 'Whitespaces program',
    input: ' \n \n\n  ',
    output: [{ type: 'EOF', value: 'EOF' }],
  },

  {
    description: 'Comment only program',
    input: `
      /* comment 1 */
      /* comment 2 */
    `,
    output: [{ type: 'EOF', value: 'EOF' }],
  },

  {
    description: 'Multiline comment',
    input: `/*
      comment
    */`,
    output: [{ type: 'EOF', value: 'EOF' }],
  },

  {
    description: 'Ignores leading and trailing whitespaces',
    input: [
      ' ',
      `
      BEGIN
      END
     `,
    ].join(''),
    output: [
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'END', value: 'END' },
      { type: 'NEWLINE', value: '\n' }, // NB: this should not be considered a trailing whitespace
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Ignores subsequent newline characters',
    input: `
      BEGIN

      END
    `,
    output: [
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'END', value: 'END' },
      { type: 'NEWLINE', value: '\n' }, // NB: this should not be considered a trailing whitespace
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Reserved keywords',
    input: `
      BEGIN
      END
      IF
      ELSE
      WHILE
      UNTIL
    `,
    output: [
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'END', value: 'END' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'IF', value: 'IF' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'ELSE', value: 'ELSE' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'WHILE', value: 'WHILE' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'UNTIL', value: 'UNTIL' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Identifiers',
    input: `
      A
      ENDING
      SHERIF
      A_B
      X_
      N0
      N_0
    `,
    output: [
      { type: 'ID', value: 'A' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'ID', value: 'ENDING' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'ID', value: 'SHERIF' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'ID', value: 'A_B' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'ID', value: 'X_' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'ID', value: 'N0' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'ID', value: 'N_0' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'String',
    input: `
      "lorem ipsum"
    `,
    output: [
      { type: 'STRING', value: 'lorem ipsum' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Int',
    input: `
      13
      -1
    `,
    output: [
      { type: 'INT', value: '13' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'INT', value: '-1' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Assignment',
    input: `
      <-
    `,
    output: [
      { type: 'ASSIGN', value: '<-' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Arithmetic operators',
    input: `
      +
      -
      *
      /
    `,
    output: [
      { type: 'PLUS', value: '+' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'MINUS', value: '-' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'ASTERISK', value: '*' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'SLASH', value: '/' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Relational operators',
    input: `
      <
      <=
      =
      >=
      >
      <>
    `,
    output: [
      { type: 'LT', value: '<' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'LTE', value: '<=' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'EQ', value: '=' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'GTE', value: '>=' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'GT', value: '>' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'NEQ', value: '<>' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Unary operators',
    input: `
      ~
      #
    `,
    output: [
      { type: 'TILDE', value: '~' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'HASH', value: '#' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Throws on unexpected characters (unknown character, multiple line  s)',
    input: `/*
        comment
      */
      BEGIN
        "text" %
      END
    `,
    output: new Error('Unexpected char "%" at line 5 column 16'),
  },

  {
    description: 'Throws on unexpected characters (unknown character, single line)',
    input: '"text" %',
    output: new Error('Unexpected char "%" at line 1 column 8'),
  },

  {
    description: 'Throws on unexpected characters (known character, invalid position)',
    input: '_A',
    output: new Error('Unexpected char "_" at line 1 column 1'),
  },
]

for (let test of tests) {
  it(test.description, () => {
    if (test.output instanceof Error) {
      expect(() => {
        tokenize(test.input)
      }).toThrow(test.output)

      return
    }

    expect(tokenize(test.input)).toEqual(test.output)
  })
}

test('peek', () => {
  const lexer = Lexer(`
    X <- 1
  `)

  expect(lexer.nextToken()).toEqual({ type: 'ID', value: 'X' })
  expect(lexer.peek()).toEqual({ type: 'ASSIGN', value: '<-' })
  expect(lexer.tokens().slice(-1)[0]).toEqual({ type: 'ID', value: 'X' })
  expect(lexer.peek()).toEqual({ type: 'ASSIGN', value: '<-' })
  expect(lexer.tokens().slice(-1)[0]).toEqual({ type: 'ID', value: 'X' })
  expect(lexer.nextToken()).toEqual({ type: 'ASSIGN', value: '<-' })
  expect(lexer.nextToken()).toEqual({ type: 'INT', value: '1' })
})
