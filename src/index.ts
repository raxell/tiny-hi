import readline from 'readline'
import { Parser } from './parser'
import { Interpreter } from './interpreter'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const evaluate = () => {
  rl.question('calculator > ', (expression) => {
    const ast = Parser(expression)
    // console.log(JSON.stringify(ast, null, '  '))
    const result = Interpreter(ast)

    console.log(result)

    evaluate()
  })
}

evaluate()
