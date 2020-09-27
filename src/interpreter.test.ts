import { Parser } from './parser'
import { Interpreter } from './interpreter'

let output: string[] = []
// The interpreter prints to stdout, we have to intercept it to make assertions on the output
const spy = jest.spyOn(console, 'log').mockImplementation((message) => output.push(message))

const execute = (program: string) => {
  Interpreter(Parser(program))
}

type Test = {
  description: string
  input: string
  output: string | Error
}

const tests: Test[] = [
  // Basic arithmetic
  {
    description: '1',
    input: `
      BEGIN PROG
        1
      END
    `,
    output: '1',
  },

  {
    description: '1 + 2',
    input: `
      BEGIN PROG
        1 + 2
      END
    `,
    output: '3',
  },

  {
    description: '1 - 2',
    input: `
      BEGIN PROG
        1 - 2
      END
    `,
    output: '-1',
  },

  {
    description: '1 * 2',
    input: `
      BEGIN PROG
        1 * 2
      END
    `,
    output: '2',
  },

  {
    description: '1 / 2',
    input: `
      BEGIN PROG
        1 / 2
      END
    `,
    output: '0',
  },

  {
    description: '1 + 2 * 3',
    input: `
      BEGIN PROG
        1 + 2 * 3
      END
    `,
    output: '7',
  },

  {
    description: '(1 + 2) * 3',
    input: `
      BEGIN PROG
        (1 + 2) * 3
      END
    `,
    output: '9',
  },

  // Length operator
  {
    description: '#2',
    input: `
      BEGIN PROG
        #2
      END
    `,
    output: '1',
  },

  {
    description: '# 2',
    input: `
      BEGIN PROG
        # 2
      END
    `,
    output: '1',
  },

  {
    description: '#(3 4)',
    input: `
      BEGIN PROG
        #(3 4)
      END
    `,
    output: '2',
  },

  {
    description: '#((3 4))',
    input: `
      BEGIN PROG
        #((3 4))
      END
    `,
    output: '2',
  },

  {
    description: '#9 8 7',
    input: `
      BEGIN PROG
        #9 8 7
      END
    `,
    output: '3',
  },

  {
    description: '# 9 8 7',
    input: `
      BEGIN PROG
        # 9 8 7
      END
    `,
    output: '3',
  },

  // Negation operator
  {
    description: '~1',
    input: `
      BEGIN PROG
        ~1
      END
    `,
    output: '-1',
  },

  {
    description: '~ 1',
    input: `
      BEGIN PROG
        ~ 1
      END
    `,
    output: '-1',
  },

  {
    description: '~1 2 3',
    input: `
      BEGIN PROG
        ~1 2 3
      END
    `,
    output: '-1 -2 -3',
  },

  {
    description: '~ 1 2 3',
    input: `
      BEGIN PROG
        ~ 1 2 3
      END
    `,
    output: '-1 -2 -3',
  },

  {
    description: '~(1 2)',
    input: `
      BEGIN PROG
        ~(1 2)
      END
    `,
    output: '-1 -2',
  },

  // Vector Arithmetic
  {
    description: '1 + 1 2',
    input: `
      BEGIN PROG
        1 + 1 2
      END
    `,
    output: '2 3',
  },

  {
    description: '1 - 1 2',
    input: `
      BEGIN PROG
        1 - 1 2
      END
    `,
    output: '0 1',
  },

  {
    description: '2 * 1 2',
    input: `
      BEGIN PROG
        2 * 1 2
      END
    `,
    output: '2 4',
  },

  {
    description: '2 / 1 2',
    input: `
      BEGIN PROG
        2 / 1 2
      END
    `,
    output: '0 1',
  },

  {
    description: '1 2 + 2 3',
    input: `
      BEGIN PROG
        1 2 + 2 3
      END
    `,
    output: '3 5',
  },

  {
    description: '1 2 + ~1 2',
    input: `
      BEGIN PROG
        1 2 + ~1 2
      END
    `,
    output: '0 0',
  },

  {
    description: '1 2 - 2 3',
    input: `
      BEGIN PROG
        -1 -1
      END
    `,
    output: '-1 -1',
  },

  {
    description: '1 2 * 2 3',
    input: `
      BEGIN PROG
        1 2 * 2 3
      END
    `,
    output: '2 6',
  },

  {
    description: '1 2 / 2 3',
    input: `
      BEGIN PROG
        1 2 / 2 3
      END
    `,
    output: '0 0',
  },

  // Mixed
  {
    description: '1 + #2 3 * 4',
    input: `
      BEGIN PROG
        1 + #2 3 * 4
      END
    `,
    output: '9',
  },

  {
    description: '1 + #~2 3 * 4',
    input: `
      BEGIN PROG
        1 + #~2 3 * 4
      END
    `,
    output: '9',
  },

  {
    description: '1 + #(2 3) * 4',
    input: `
      BEGIN PROG
        1 + #(2 3) * 4
      END
    `,
    output: '9',
  },

  {
    description: '1 + #2 (3 * 4)',
    input: `
      BEGIN PROG
        1 + #2 (3 * 4)
      END
    `,
    output: '3',
  },

  // Nested blocks
  {
    description: 'Nested blocks',
    input: `
      BEGIN PROG
        BEGIN A
          1
        END
        BEGIN B
          2
        END
      END
    `,
    output: '',
  },

  // Variables
  {
    description: 'Variable assignment and reference',
    input: `
      BEGIN PROG
        X <- 1
        1 + X 2 X
      END
    `,
    output: '2 3 2',
  },

  // Function calls
  {
    description: 'Function call without arguments',
    input: `
      BEGIN PROG
        BEGIN F
          7
        END
        F()
      END
    `,
    output: '7',
  },

  {
    description: 'Function call with one argument',
    input: `
      BEGIN PROG
        BEGIN F(X)
          X
        END
        F(7)
      END
    `,
    output: '7',
  },

  {
    description: 'Assignment is a valid return expression',
    input: `
      BEGIN PROG
        BEGIN F
          X <- 3
        END
        F()
      END
    `,
    output: '3',
  },

  {
    description: 'Assignment is not a valid output expression',
    input: `
      BEGIN PROG
        BEGIN F
          X <- 3
        END
        Y <- F()
      END
    `,
    output: '',
  },

  {
    description: 'The last statement of a function is not an output expression',
    input: `
      BEGIN PROG
        BEGIN F
          8
        END
        X <- F()
      END
    `,
    output: '',
  },

  // Undefined symbols
  {
    description: 'Undefined variables',
    input: `
      BEGIN PROG
        X
      END
    `,
    output: new Error('Undefined variable "X"'),
  },

  {
    description: 'Undefined function',
    input: `
      BEGIN PROG
        X()
      END
    `,
    output: new Error('Undefined function "X"'),
  },

  // Function already defined
  {
    description: 'Function already defined',
    input: `
      BEGIN PROG
        BEGIN A
          BEGIN B
            1
          END
        END
        BEGIN B
          2
        END
      END
    `,
    output: new Error('Function "B" has already been defined'),
  },

  // Function parameters mismatch
  {
    description: 'Too many arguments',
    input: `
      BEGIN PROG
        BEGIN F
          1
        END
        F(2)
      END
    `,
    output: new Error('Parameters mismatch, expected 0 arguments for function "F" but got 1'),
  },

  {
    description: 'Too few arguments',
    input: `
      BEGIN PROG
        BEGIN F(X)
          1
        END
        F()
      END
    `,
    output: new Error('Parameters mismatch, expected 1 arguments for function "F" but got 0'),
  },

  // Maximum call stack
  {
    description: 'Maximum call stack',
    input: `
      BEGIN PROG
        BEGIN A
          A()
        END
        A()
      END
    `,
    output: new Error('Maximum call stack exceeded'),
  },
]

beforeEach(() => {
  output = []
})

afterAll(() => {
  spy.mockRestore()
})

for (let test of tests) {
  it(test.description, () => {
    if (test.output instanceof Error) {
      expect(() => {
        execute(test.input)
      }).toThrow(test.output)

      return
    }

    execute(test.input)
    expect(output.join('\n')).toBe(test.output)
  })
}
