import { Parser } from './parser'
import { Interpreter } from './interpreter'

let output: string[] = []
// The interpreter prints to stdout, we have to intercept it to make assertions on the output
const spy = jest.spyOn(console, 'log').mockImplementation((message) => output.push(message))

const execute = (program: string) => {
  Interpreter(Parser(program))
}

const programs = [
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
  // @TODO: this test is incorrect, it should produce no output since there are no function calls.
  // Will be fixed once function calls will be implemented.
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
    output: '1\n2',
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
] as const

beforeEach(() => {
  output = []
})

afterAll(() => {
  spy.mockRestore()
})

for (let program of programs) {
  it(program.description, () => {
    execute(program.input)

    expect(output.join('\n')).toBe(program.output)
  })
}
