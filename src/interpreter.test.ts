import { Lexer } from './lexer'
import { Parser } from './parser'
import { Interpreter } from './interpreter'

let output: string[] = []
// The interpreter prints to stdout, we have to intercept it to make assertions on the output
const spy = jest.spyOn(console, 'log').mockImplementation((message) => output.push(message))

const execute = (program: string) => {
  Interpreter(Parser(Lexer(program)))
}

type Test = {
  description: string
  input: string
  output: string | Error
}

// @TODO: Some of those tests do not belong to the interpreter but should be part of the
// parser/semanticAnalyzer test suites, move them there.

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

  {
    description: 'Global variables',
    input: `
      BEGIN MAIN
        BEGIN FUNC
          .A <- 3
        END
        FUNC() /* this does NOT produce output since the function does not return any value */
        .A
      END
    `,
    output: '3',
  },

  {
    description: 'Global variables without value',
    input: `
      BEGIN MAIN
        .A
        BEGIN FUNC
          .A <- 3
        END
      END
    `,
    output: new Error('Uninitialized global variable ".A"'),
  },

  // Subscript
  {
    description: 'Subscript',
    input: `
      BEGIN MAIN
        A <- 3 2 1
        A[1]
        A <- "TEXT"
        A[1 4]
        A <- "TE" "XT"
        A[1 4]
        BEGIN SET_X
          .X <- 3
        END
        SET_X() /* this does NOT produce output since the function does not return any value */
        A[.X]
      END
    `,
    output: '3\nTT\nTT\nX',
  },

  // Strings
  {
    description: 'Base string',
    input: `
      BEGIN MAIN
        "text"
      END
    `,
    output: 'text',
  },

  {
    description: 'String assignment to variable',
    input: `
      BEGIN MAIN
        A <- "text"
        A
      END
    `,
    output: 'text',
  },

  {
    description: 'String concatenation',
    input: `
      BEGIN MAIN
        A <- "ab"
        B <- "cd"
        A B
        A <- A "ab"
        A <- A "ab"
        A
        "ab" "cd"
      END
    `,
    output: 'abcd\nababab\nabcd',
  },

  {
    description: 'String length',
    input: `
      BEGIN MAIN
        #"text"
        A <- "lorem"
        #A
        #A A
      END
    `,
    output: '4\n5\n10',
  },

  // If-else
  {
    description: 'If expression',
    input: `
      BEGIN MAIN
        IF 1 < 2
          3
        END
      END
    `,
    output: '3',
  },

  {
    description: 'If expression inside function',
    input: `
      BEGIN MAIN
        BEGIN F
          IF 1 < 2
            3
          END
        END
        F() /* this does NOT produce output since the function does not return any value */
      END
    `,
    output: '3',
  },

  {
    description: 'If-else expression',
    input: `
      BEGIN MAIN
        IF 1 > 2
          3
        ELSE
          4
        END
      END
    `,
    output: '4',
  },

  {
    description: 'If-else expression on strings',
    input: `
      BEGIN MAIN
        IF "ab" = "ab"
          3
        END

        IF "ab" <> "ab"
          3
        ELSE
          4
        END

        AB <- "ab"
        IF AB "cd" = AB "cd"
          5
        END
      END
    `,
    output: '3\n4\n5',
  },

  // While/Until
  {
    description: 'While',
    input: `
      BEGIN MAIN
        X <- 0
        WHILE X < 10
          X <- X + 1
        END
        X
      END
    `,
    output: '10',
  },

  {
    description: 'Until',
    input: `
      BEGIN MAIN
        X <- 10
        UNTIL X <= 0
          X <- X - 1
        END
        X
      END
    `,
    output: '0',
  },

  // Function calls
  {
    description: 'Function call without arguments',
    input: `
      BEGIN PROG
        BEGIN F
          7 /* the output comes from here */
        END
        F() /* not here */
      END
    `,
    output: '7',
  },

  {
    description: 'Function call with one argument',
    input: `
      BEGIN PROG
        BEGIN F(X)
          X /* the output comes from here */
        END
        F(7) /* not here */
      END
    `,
    output: '7',
  },

  {
    description: 'Function call with multiple arguments',
    input: `
      BEGIN PROG
        BEGIN F(X, Y)
          X
          Y
        END
        F(7, 8)
      END
    `,
    output: '7\n8',
  },

  {
    description: 'Function call with variable argument',
    input: `
      BEGIN PROG
        BEGIN F(X)
          X
        END
        A <- 8
        F(A)
      END
    `,
    output: '8',
  },

  {
    description: 'Global function',
    input: `
      BEGIN MAIN
        .F2()
        BEGIN F1
          BEGIN .F2
            3
          END
        END
      END
    `,
    output: '3',
  },

  {
    description: 'Function return value',
    input: `
      BEGIN PROG
        BEGIN F
          F <- 3
        END
        F() /* the output comes from here since the function returns a value */
      END
    `,
    output: '3',
  },

  {
    description: 'Function return value 2',
    input: `
      BEGIN PROG
        BEGIN F
          F <- "world"
        END
        "hello " F() /* the output comes from here since the function returns a value */
      END
    `,
    output: 'hello world',
  },

  {
    description: 'Function partial return value',
    input: `
      BEGIN PROG
        BEGIN F
          IF 1 > 2
            F <- 3
          END
        END
        F() /* this produces no output since the IF condition will never be met */
      END
    `,
    output: '',
  },

  {
    description: 'Function partial return value 2',
    input: `
      BEGIN PROG
        BEGIN F
          IF 1 < 2
            F <- 3
          END
        END
        F()
      END
    `,
    output: '3',
  },

  {
    description: 'Function with no return value in vector print',
    input: `
      BEGIN PROG
        BEGIN F
          "world"
        END
        "hello " F()
      END
    `,
    output: new Error('Vector error, vector elements cannot be undefined'),
  },

  {
    description: 'Function with no return value in vector operation',
    input: `
      BEGIN PROG
        BEGIN F
          3
        END
        1 + 2 F()
      END
    `,
    output: new Error('Vector error, vector elements cannot be undefined'),
  },

  {
    description: 'Assignment is not a valid output expression',
    input: `
      BEGIN PROG
        BEGIN F
          F <- 3
        END
        Y <- F()
      END
    `,
    output: '',
  },

  // Various programs
  {
    description: 'Factorial',
    input: `
      BEGIN FACTORIAL
        BEGIN FACT(N)
          IF N = 0
            FACT <- 1
          ELSE
            FACT <- N * FACT(N - 1)
          END
        END

        FACT(5)
      END
    `,
    output: '120',
  },

  {
    description: 'Factorial (with accumulator)',
    input: `
      BEGIN FACTORIAL
        BEGIN FACT(N)
          BEGIN FACT_(N, ACC)
            IF N = 0
              FACT_ <- ACC
            ELSE
              FACT_ <- FACT_(N - 1, ACC * N)
            END
          END
          FACT <- FACT_(N, 1)
        END

        FACT(5)
      END
    `,
    output: '120',
  },

  {
    description: 'Fibonacci',
    input: `
      BEGIN FIBONACCI
        BEGIN FIB(N)
          IF N = 0
            FIB <- 0
          ELSE
            IF N = 1
              FIB <- 1
            ELSE
              FIB <- FIB(N - 1) + FIB(N - 2)
            END
          END
        END

        FIB(20)
      END
    `,
    output: '6765',
  },

  {
    description: 'Anagram',
    input: `
      BEGIN MAIN
        BEGIN ANAGRAM(WORD)
          LENGTH <- #WORD
          I <- 1
          ANAGRAM <- 1
          WHILE I <= LENGTH / 2
            IF ANAGRAM = 1
              IF WORD[I] <> WORD[LENGTH + 1 - I]
                ANAGRAM <- 0
              END
            END
            I <- I + 1
          END
        END

        ANAGRAM("A")
        ANAGRAM("anna")
        ANAGRAM("annna")
        ANAGRAM("Anna")
        ANAGRAM("text")
      END
    `,
    output: '1\n1\n1\n0\n0',
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
    description: 'Undefined variable 2',
    input: `
      BEGIN MAIN
        BEGIN F
          A <- 1
        END
        A
      END
    `,
    output: new Error('Undefined variable "A"'),
  },

  {
    description: 'Undefined variable 3',
    input: `
      BEGIN MAIN
        A <- "text"
        A[I]
      END
    `,
    output: new Error('Undefined variable "I"'),
  },

  {
    description: 'Variable deallocation',
    input: `
      BEGIN MAIN
        X <- 1
        IF 1 < 2
          X <-
        END
        X
      END
    `,
    output: new Error('Undefined variable "X"'),
  },

  // I can access global vars everywhere before they're defined but I still need to define them
  {
    description: 'Undefined global variable',
    input: `
      BEGIN MAIN
        /* this is valid */
        .B
        .B <- 3
        /* this is not, since .A has not been defined anywhere */
        .A
      END
    `,
    output: new Error('Undefined variable ".A"'),
  },

  {
    description: 'Undefined variable in function call',
    input: `
      BEGIN PROG
        BEGIN F(X)
          X
        END
        F(B)
      END
    `,
    output: new Error('Undefined variable "B"'),
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

  // Cannot reassign to function parameter
  {
    description: 'Reassignment to function parameter',
    input: `
      BEGIN MAIN
        BEGIN F(X)
          X <- 2
        END
        F(3)
      END
    `,
    output: new Error('Cannot reassign to function parameter "X"'),
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

  // Vector type mismatch
  {
    description: 'Negation operator on string vector',
    input: `
      BEGIN MAIN
        ~"text"
      END
    `,
    output: new Error('Type mismatch, operator "~" is only applicable to a vector of integers'),
  },

  {
    description: 'Length operator on heterogeneous vectors',
    input: `
      BEGIN MAIN
        #1 "text" 2
      END
    `,
    output: new Error('Vector error, vector elements must be of the same type'),
  },

  {
    description: 'Output expression on heterogeneous vectors',
    input: `
      BEGIN MAIN
        "ab" 1 2
      END
    `,
    output: new Error('Vector error, vector elements must be of the same type'),
  },

  {
    description: 'Binary operation on heterogeneous vectors',
    input: `
      BEGIN MAIN
        1 + "lorem"
      END
    `,
    output: new Error(`Type mismatch, operator "ADD" can only be applied to vectors of integers`),
  },

  {
    description: 'Relational operation on heterogeneous vectors',
    input: `
      BEGIN MAIN
        IF 1 < "text"
          3
        END
      END
    `,
    output: new Error(
      'Type mismatch, operator "LT" can only be computed on vectors of the same type',
    ),
  },

  // Subscript out of range
  {
    description: 'Subscript out of range',
    input: `
      BEGIN MAIN
        A <- "TEXT"
        A[5]
      END
    `,
    output: new Error('Subscript out of range'),
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

  {
    description: 'Maximum call stack 2',
    input: `
      BEGIN PROG
        BEGIN A
          .B()
        END
        /* Global to make it possible for A to reference it */
        BEGIN .B
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
