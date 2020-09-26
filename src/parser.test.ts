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
