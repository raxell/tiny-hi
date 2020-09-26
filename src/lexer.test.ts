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
    input: `
      BEGIN
      END
     `,
    output: [
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'END', value: 'END' },
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
      { type: 'END', value: 'END' },
      { type: 'IF', value: 'IF' },
      { type: 'ELSE', value: 'ELSE' },
      { type: 'WHILE', value: 'WHILE' },
      { type: 'UNTIL', value: 'UNTIL' },
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
      { type: 'ID', value: 'ENDING' },
      { type: 'ID', value: 'SHERIF' },
      { type: 'ID', value: 'A_B' },
      { type: 'ID', value: 'X_' },
      { type: 'ID', value: 'N0' },
      { type: 'ID', value: 'N_0' },
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
      { type: 'INT', value: '-1' },
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
      { type: 'MINUS', value: '-' },
      { type: 'ASTERISK', value: '*' },
      { type: 'SLASH', value: '/' },
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
      { type: 'LTE', value: '<=' },
      { type: 'EQ', value: '=' },
      { type: 'GTE', value: '>=' },
      { type: 'GT', value: '>' },
      { type: 'NEQ', value: '<>' },
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
      { type: 'HASH', value: '#' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  // @TODO: fix wrong column value, don't look at it now since the introduction of
  // the NEWLINE token could change how column count is calculated
  // {
  //   description: 'Throws on unexpected characters (unknown character, multiple line  s)',
  //   input: `/*
  //       comment
  //     */
  //     BEGIN
  //       "text" %
  //     END
  //   `,
  //   output: new Error('Unexpected char "%" at line 5 column 16'),
  // },

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
