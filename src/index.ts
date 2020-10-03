import readline from 'readline'
import util from 'util'
import { Lexer } from './lexer'
import { Parser } from './parser'
import { Interpreter } from './interpreter'
import { semanticAnalyzer } from './semanticAnalyzer'

const tokenize = (program: string) => {
  const lexer = Lexer(program)

  while (lexer.nextToken().type !== 'EOF');

  return lexer.tokens()
}

const debug = process.argv.includes('--debug')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const lines: string[] = []

console.log('Write your program (end it with a double NEWLINE and press CTRL+D to execute):')
rl.prompt()

rl.on('line', (line) => {
  lines.push(line)
})

rl.on('close', () => {
  const input = lines.join('\n')

  if (debug) {
    console.log('Debugging informations')

    console.log('Tokens:')
    console.log(tokenize(input))
    console.log('')

    const ast = Parser(Lexer(input))

    console.log('AST:')
    console.log(util.inspect(ast, { colors: true, depth: Infinity }))
    console.log('')

    console.log('Scopes:')
    console.log(semanticAnalyzer(ast))
    console.log('')
  }

  console.log('Output:')

  Interpreter(Parser(Lexer(input)))
})
