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
  output?: string
}

const parserTests: Test[] = [
  {
    description: 'block_named',
    input: `
      BEGIN PROG
        1
      END
      `,
  },

  {
    description: 'block_args1',
    input: `
      BEGIN MAIN
        BEGIN ARG(ONE)
          1
        END
        1
      END
      `,
  },

  {
    description: 'block_args2',
    input: `
      BEGIN MAIN
        BEGIN ARG(ONE, TWO)
          1
        END
        1
      END
      `,
  },

  {
    description: 'block_nested',
    input: `
      BEGIN OUTER
        BEGIN INNER
          1
        END
        1
      END
      `,
  },

  {
    description: 'block_parallel',
    input: `
      BEGIN OUTER
        BEGIN ONE
          1
        END
        BEGIN TWO
          1
        END
        1
      END
      `,
  },

  {
    description: 'assignement',
    input: `
      BEGIN PROG
        X <- 1
      END
      `,
  },

  // {
  //   description: 'empty_assignement',
  //   input: `
  //     BEGIN PROG
  //       X <-
  //     END
  //     `,
  // },

  {
    description: 'exprstm',
    input: `
      BEGIN PROG
        1 + 2
      END
      `,
  },

  {
    description: 'if',
    input: `
      BEGIN PROG
        IF X < 1
          1
        END
      END
      `,
  },

  {
    description: 'ifelse',
    input: `
      BEGIN PROG
        IF X < 1
          1
        ELSE
          2
        END
      END
      `,
  },

  // {
  //   description: 'while',
  //   input: `
  //     BEGIN PROG
  //       WHILE X < 1
  //         1
  //       END
  //     END
  //     `,
  // },

  // {
  //   description: 'until',
  //   input: `
  //     BEGIN PROG
  //       UNTIL X < 1
  //         1
  //       END
  //     END
  //     `,
  // },

  {
    description: 'atoms',
    input: `
      BEGIN PROG
        X <- 1
        X <- "TEST"
        X <- A
        X <- .A
        X <- F(1)
        X <- F("ONE")
        X <- F(1, 2)
        X <- F("ONE", "TWO")
      END
      `,
  },

  {
    description: 'unary',
    input: `
      BEGIN PROG
        X <- -1
        X <- ~ 1
        X <- ~1
        X <- # 1
        X <- #1
      END
      `,
  },

  {
    description: 'binops',
    input: `
      BEGIN PROG
        X <- 1 + 2
        X <- 1 - 2
        X <- 1 / 2
        X <- 1 * 2
      END
      `,
  },

  {
    description: 'conds',
    input: `
      BEGIN PROG
        IF X < 1
          1
        END
        IF X <= 1
          1
        END
        IF X = 1
          1
        END
        IF X <> 1
          1
        END
        IF X >= 1
          1
        END
        IF X > 1
          1
        END
      END
      `,
  },

  {
    description: 'list',
    input: `
      BEGIN PROG
        X <- 1 2 3
        X <- "ONE" "TWO" "THREE"
        X <- 1 A F(1)
        X <- "ONE" A F("ONE")
      END
      `,
  },

  {
    description: 'expr_list',
    input: `
      BEGIN PROG
        X <- 1 2 + 3 4
        X <- 1 + # 2 3
        X <- 2 + ~ 1
      END
      `,
  },

  {
    description: 'expr_func',
    input: `
      BEGIN PROG
        X <- F(1 2)
        X <- 1 F(1) G (2)
      END
      `,
  },

  {
    description: 'expr_prec',
    input: `
      BEGIN PROG
        X <- 1 + 2 * 3
        X <- 1 ~ 2 * 3
        X <- 1 # 2 * 3
      END
      `,
  },

  {
    description: 'block_args0_call',
    input: `
      BEGIN PROG
        BEGIN ZERO
        1
        END
        ZERO()
      END
      `,
  },

  {
    description: 'empty_line_0',
    input: `
      BEGIN PROG

        1
        2
      END
      `,
  },

  {
    description: 'empty_line_1',
    input: `
      BEGIN PROG
        1

        2
      END
      `,
  },

  {
    description: 'empty_line_2',
    input: `
      BEGIN PROG
        1
        2

      END
      `,
  },

  {
    description: 'empty_line_if_0',
    input: `
      BEGIN MAIN
        IF X < 1

            1
        END
      END
      `,
  },

  {
    description: 'empty_line_if_1',
    input: `
      BEGIN MAIN
        IF X < 1
            1

        END
      END
      `,
  },

  // {
  //   description: 'empty_line_while_0',
  //   input: `
  //     BEGIN MAIN
  //       WHILE X < 1

  //           1
  //       END
  //     END
  //     `,
  // },

  // {
  //   description: 'empty_line_while_1',
  //   input: `
  //     BEGIN MAIN
  //       WHILE X < 1
  //           1

  //       END
  //     END
  //     `,
  // },

  // {
  //   description: 'empty_line_until_0',
  //   input: `
  //     BEGIN MAIN
  //       UNTIL X < 1

  //           1
  //       END
  //     END
  //     `,
  // },

  // {
  //   description: 'empty_line_until_1',
  //   input: `
  //     BEGIN MAIN
  //       UNTIL X < 1
  //           1

  //       END
  //     END
  //     `,
  // },

  {
    description: 'long_expr',
    input: 'BEGIN MAIN\n 1" + "+ 1" * 980 + "\n END\n',
  },
]

const interpreterTests: Required<Test>[] = [
  {
    description: 'fact',
    input: `
      BEGIN TEST
        BEGIN DOIT(N)
            BEGIN FACT(N)
                IF N = 0
                    FACT <- 1
                ELSE
                    FACT <- N * FACT(N - 1)
                END
            END
            DOIT <- FACT(2 * N)
        END
        DOIT(3)
      END
      `,
    output: '720',
  },

  // {
  //   description: 'bagl',
  //   input: `
  //     BEGIN PROG
  //       A <- "ALGEBRA"
  //       A[5 1 3 2]
  //     END
  //     `,
  //   output: 'BAGL',
  // },

  // {
  //   description: 'gcf',
  //   input: `
  //     BEGIN MAIN
  //         BEGIN MOD(A, B)
  //             MOD <- A-B*(A/B)
  //         END
  //         BEGIN GCF(XD, YD)
  //             X <- XD
  //             Y <- YD
  //             IF X < Y
  //                 T <- X
  //                 X <- Y
  //                 Y <- T
  //                 T <-
  //             END
  //             R <- Y
  //             WHILE R > 0
  //                 R <- MOD(X, Y)
  //                 X <- Y
  //                 Y <- R
  //             END
  //             GCF <- X
  //         END
  //         GCF(2*3*5*5*7,2*2*3*5)
  //     END
  //     `,
  //   output: '30',
  // },

  {
    description: 'no_args',
    input: `
      BEGIN PROG
        BEGIN NOARG
          1
          NOARG <- -1
        END
        TEMP <- NOARG()
      END
      `,
    output: '1',
  },

  {
    description: 'inner_call',
    input: `
      BEGIN PROG
        BEGIN FUNC(X)
          BEGIN CALL(Y)
            0
            CALL <- "CALL"
          END
          TEMP <- CALL(0)
          1
          FUNC <- "FUNC"
        END
        TEMP <- FUNC(0)
        2
      END
      `,
    output: '0\n1\n2',
  },

  {
    description: 'no_inner_call',
    input: `
      BEGIN PROG
        BEGIN FUNC(X)
          BEGIN NEVER(Y)
            0
            NEVER <- "NEVER"
          END
          1
          FUNC <- "FUNC"
        END
        TEMP <- FUNC(0)
        2
      END
      `,
    output: '1\n2',
  },

  {
    description: 'concat_0',
    input: `
      BEGIN MAIN
        A <- 1 2
        A <- A 3 4
        A
      END
      `,
    output: '1 2 3 4',
  },

  // {
  //   description: 'concat_1',
  //   input: `
  //     BEGIN MAIN
  //       A <- 1 2
  //       B <- A[1] A[2]
  //       B
  //     END
  //     `,
  //   output: '1 2',
  // },

  {
    description: 'vecsum',
    input: `
      BEGIN MAIN
        1 2 3 + 4 5 6
      END
      `,
    output: '5 7 9',
  },

  {
    description: 'strcat_0',
    input: `
      BEGIN MAIN
        "AB" "CD"
      END
      `,
    output: 'ABCD',
  },

  {
    description: 'strcat_1',
    input: `
      BEGIN MAIN
        A <- "AB"
        B <- "CD"
        A B
      END
      `,
    output: 'ABCD',
  },

  {
    description: 'bcast',
    input: `
      BEGIN MAIN
        1 + 4 5 6
      END
      `,
    output: '5 6 7',
  },

  {
    description: 'bcast_1',
    input: `
      BEGIN MAIN
        #5 73 -1
      END
      `,
    output: '3',
  },

  {
    description: 'vecdis_0',
    input: `
      BEGIN MAIN
        IF 1 2 < 3 4
          1
        ELSE
          0
        END
      END
      `,
    output: '1',
  },

  {
    description: 'vecdis_1',
    input: `
      BEGIN MAIN
        IF 1 2 > 3 4
          1
        ELSE
          0
        END
      END
      `,
    output: '0',
  },

  {
    description: 'veceq_0',
    input: `
      BEGIN MAIN
        IF 1 2 = 1 2
          1
        ELSE
          0
        END
      END
      `,
    output: '1',
  },

  {
    description: 'veceq_1',
    input: `
      BEGIN MAIN
        IF 1 2 <> 1 2
          1
        ELSE
          0
        END
      END
      `,
    output: '0',
  },

  // {
  //   description: 'loopscope_0',
  //   input: `
  //     BEGIN MAIN
  //       I <- 1
  //       WHILE I < 10
  //         I <- I + 1
  //         R <- I
  //       END
  //       R
  //     END
  //     `,
  //   output: '10',
  // },
]

beforeEach(() => {
  output = []
})

afterAll(() => {
  spy.mockRestore()
})

for (let test of parserTests) {
  it(test.description, () => {
    expect(() => {
      Parser(test.input)
    }).not.toThrow()
  })
}

for (let test of interpreterTests) {
  it(test.description, () => {
    execute(test.input)
    expect(output.join('\n')).toBe(test.output)
  })
}
