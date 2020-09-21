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
    description: 'String',
    input: `
      BEGIN
        "lorem ipsum"
      END
    `,
    output: [
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'STRING', value: 'lorem ipsum' },
      { type: 'END', value: 'END' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Int',
    input: `
      BEGIN
        13
      END
    `,
    output: [
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'INT', value: '13' },
      { type: 'END', value: 'END' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Assignment',
    input: `
      BEGIN
        X <- 1
      END
    `,
    output: [
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'ID', value: 'X' },
      { type: 'ASSIGN', value: '<-' },
      { type: 'INT', value: '1' },
      { type: 'END', value: 'END' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Arithmetic operators',
    input: `
      BEGIN
        1 + 2
        1 - 2
        1 * 2
        1 / 2
      END
    `,
    output: [
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'INT', value: '1' },
      { type: 'PLUS', value: '+' },
      { type: 'INT', value: '2' },
      { type: 'INT', value: '1' },
      { type: 'MINUS', value: '-' },
      { type: 'INT', value: '2' },
      { type: 'INT', value: '1' },
      { type: 'ASTERISK', value: '*' },
      { type: 'INT', value: '2' },
      { type: 'INT', value: '1' },
      { type: 'SLASH', value: '/' },
      { type: 'INT', value: '2' },
      { type: 'END', value: 'END' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Relational operators',
    input: `
      BEGIN
        1 < 2
        1 <= 2
        1 = 2
        1 >= 2
        1 > 2
        1 <> 2
      END
    `,
    output: [
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'INT', value: '1' },
      { type: 'LT', value: '<' },
      { type: 'INT', value: '2' },
      { type: 'INT', value: '1' },
      { type: 'LTE', value: '<=' },
      { type: 'INT', value: '2' },
      { type: 'INT', value: '1' },
      { type: 'EQ', value: '=' },
      { type: 'INT', value: '2' },
      { type: 'INT', value: '1' },
      { type: 'GTE', value: '>=' },
      { type: 'INT', value: '2' },
      { type: 'INT', value: '1' },
      { type: 'GT', value: '>' },
      { type: 'INT', value: '2' },
      { type: 'INT', value: '1' },
      { type: 'NEQ', value: '<>' },
      { type: 'INT', value: '2' },
      { type: 'END', value: 'END' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Conditionals',
    input: `
      BEGIN
        IF X < 1
          1
        ELSE
          2
        END
      END
    `,
    output: [
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'IF', value: 'IF' },
      { type: 'ID', value: 'X' },
      { type: 'LT', value: '<' },
      { type: 'INT', value: '1' },
      { type: 'INT', value: '1' },
      { type: 'ELSE', value: 'ELSE' },
      { type: 'INT', value: '2' },
      { type: 'END', value: 'END' },
      { type: 'END', value: 'END' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  // It's not responsibility of the lexer to check the program structure
  {
    description: 'Nonsense sequence of valid tokens',
    input: `
      END
      BEGIN
      "str"
    `,
    output: [
      { type: 'END', value: 'END' },
      { type: 'BEGIN', value: 'BEGIN' },
      { type: 'STRING', value: 'str' },
      { type: 'EOF', value: 'EOF' },
    ],
  },

  {
    description: 'Throws on unexpected characters',
    input: `/*
        comment
      */
      BEGIN
        "text" %
      END
    `,
    // prettier-ignore
    output: new Error([
      'Unexpected char "%" at line 5 column 16',
      // '          BEGIN',
      // '            "text" %',
      // '                   ^',
      // '          END',
    ].join('\n')),
  },

  {
    description: 'Throws on unexpected characters 2',
    input: '"text" %',
    // prettier-ignore
    output: new Error([
      'Unexpected char "%" at line 1 column 7',
      // '    "text" %',
      // '           ^',
    ].join('\n')),
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
