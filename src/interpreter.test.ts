import { Parser } from './parser'
import { Interpreter } from './interpreter'

const execute = (program: string) => {
  const ast = Parser(program)

  return Interpreter(ast)
}

test('Expressions', () => {
  expect(execute('')).toBeNull()

  // Basic Arithmetic
  expect(execute('1')).toBe('1')
  expect(execute('1 + 2')).toBe('3')
  expect(execute('1 - 2')).toBe('-1')
  expect(execute('1 * 2')).toBe('2')
  expect(execute('1 / 2')).toBe('0')
  expect(execute('1 + 2 * 3')).toBe('7')
  expect(execute('(1 + 2) * 3')).toBe('9')

  // Length operator
  expect(execute('#2')).toBe('1')
  expect(execute('# 2')).toBe('1')
  expect(execute('#(3 4)')).toBe('2')
  expect(execute('#((3 4))')).toBe('2')
  expect(execute('#9 8 7')).toBe('3')
  expect(execute('# 9 8 7')).toBe('3')

  // Negation operator
  expect(execute('~1')).toBe('-1')
  expect(execute('~ 1')).toBe('-1')
  expect(execute('~1 2 3')).toBe('-1 -2 -3')
  expect(execute('~ 1 2 3')).toBe('-1 -2 -3')
  expect(execute('~(1 2)')).toBe('-1 -2')

  // Vector Arithmetic
  expect(execute('1 + 1 2')).toBe('2 3')
  expect(execute('1 - 1 2')).toBe('0 1')
  expect(execute('2 * 1 2')).toBe('2 4')
  expect(execute('2 / 1 2')).toBe('0 1')
  expect(execute('1 2 + 2 3')).toBe('3 5')
  expect(execute('1 2 + ~1 2')).toBe('0 0')
  expect(execute('1 2 - 2 3')).toBe('-1 -1')
  expect(execute('1 2 * 2 3')).toBe('2 6')
  expect(execute('1 2 / 2 3')).toBe('0 0')

  // Mixed
  expect(execute('1 + #2 3 * 4')).toBe('9')
  expect(execute('1 + #~2 3 * 4')).toBe('9')
  expect(execute('1 + #(2 3) * 4')).toBe('9')
  expect(execute('1 + #2 (3 * 4)')).toBe('3')
})
