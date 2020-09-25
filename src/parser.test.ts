import { Parser } from './parser'

test('Returns an AST', () => {
  const ast = Parser('')

  expect(ast).toEqual({ type: 'Program', expressions: [] })
})
