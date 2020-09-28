import { Parser } from './parser'

test('Returns an AST', () => {
  const ast = Parser(`
    BEGIN PROG
      1
    END
  `)

  expect(ast).toEqual({
    type: 'Program',
    block: {
      type: 'FunctionDefinition',
      global: false,
      name: 'PROG',
      formalParams: [],
      statements: [
        {
          type: 'OutputExpression',
          expression: {
            type: 'Vector',
            elements: [{ type: 'Int', value: 1 }],
          },
        },
      ],
    },
  })
})

test('Global function parameter', () => {
  expect(() => {
    Parser(`
      BEGIN MAIN
        BEGIN FUN(.X)
          1
        END
      END
    `)
  }).toThrow(new Error('Unexpected global function parameter'))
})
