# TinyHi Interpreter

## Setup

**Requires [Node.js](https://nodejs.org/en/) installed in the local machine, container or wherever you want to execute this code.**

Install the dependencies:

```
npm i -D
```

Build the sources:

```
npm run build
```

## Usage

Run the tests:

```
npm test
```

Execute custom programs by printing them to stdin:

```
npm start
```

Use `--debug` to also print debugging informations (tokens, AST):

```
npm start -- --debug
```
