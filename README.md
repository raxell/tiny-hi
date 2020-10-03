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

## Descrizione

Il progetto è strutturato in 4 componenti principali:

```
          +-------+               +--------+            +-------------------+                     +-------------+
input --> | Lexer | -- tokens --> | Parser | -- AST --> | Semantic Analyzer | --    AST &     --> | Interpreter | --> output
          +-------+               +--------+            +-------------------+    symbol table     +-------------+
```

Breve overview dei componenti, maggiori info sono scritte nelle sezioni corrispondenti:

- `Lexer` prende in input una sequenza di caratteri e restituisce due metodi `nextToken` e `peek` per accedere/consumare in modo lazy il prossimo token.
- `Parser` prende in input il lexer e restituisce un AST, la cui struttura dei nodi può essere vista più in dettagli nel sorgente del parser.
- `semanticAnalyzer` prende in input l'AST e restituisce una specie di symbol table che è sostanzialmente una mappa che associa a ciascuna funzione definita le corrispettive informazioni sul suo scope (parametri, variabili, ecc...). Questa mappa è usata sia dallo stesso `semanticAnalyzer` per fare analisi statica ad esempio sul non poter riassegnare il parametro di una funzione, sia dall'interprete per recuperare "il corpo" della funzione da eseguire.
- `Interpreter` prende in input l'AST e lo usa per eseguire il programma e produrre output

Ciascun componente è una closure che mantiene uno stato locale e ritorna una struttura (esempio l'AST per il parser) o un oggetto con dei metodi, esempio:

```js
const Lexer = (input) => {
  // private variables and functions, not exported
  const pos = 0
  const currentChar = input[pos]
  const consumeInt = () => {}
  const consumeId = () => {}
  const skipWhitespaces = () => {}

  // exported methods
  return {
    peek: () => {}
    nextToken: () => {}
  }
}

const lexer = Lexer('BEGIN MAIN')
// I can only use the exported methods
lexer.nextToken()
lexer.peek()
```

Per quanto riguarda le strutture restituite (es. token, nodi dell'AST), sono tutti oggetti JS con una chiave `type`. Questo in typescript permette di simulare uno pseudo pattern matching sulla struttura degli oggetti, cosa estremamente comoda. Esempio:

```ts
type BinaryOpNode = { type: 'BinaryOp'; op: '+'; left: Node; right: Node }
type UnaryOp = { type: 'UnaryOp'; op: '#'; value: Node }
type Node = BinaryOp | UnaryOp

const sampleFunc = (node: Node) => {
  if (node.type === 'BinaryOp') {
    // Here I know that `node` is a `BinaryOpNode`, so it has the keys `op`, `left`, `right`
    console.log(node.left, node.right)
  }
}
```

### Lexer

Il lexer è molto semplice, prende una sequenza di caratteri e restituisce una sequenza di token (dove ciascun token è un oggetto JS nel tipo `{ type: 'COMMA', value: ',' }`). Per essere più precisi non viene restituita l'intera sequenza di token ma viene restituito un oggetto con dei metodi per ottenere il token in modo lazy (come fosse un iterator), esempio:

```js
const input = 'BEGIN MAIN' // input to tokenize
const lexer = Lexer(input)
// lexer has 2 main methods:
// - nextToken() which returns the next token and consumes it
// - peek() which returns the next token without consuming it (this is useful to make lookahead in the parser)
console.log(lexer.nextToken()) // { type: 'BEGIN', value: 'BEGIN' }
console.log(lexer.peek()) // { type: 'ID', value: 'MAIN' }
console.log(lexer.nextToken()) // { type: 'ID', value: 'MAIN' }
console.log(lexer.nextToken()) // { type: 'EOF', value: 'EOF' }
```

Dall'esempio si nota anche che il lexer restituisce EOF come ultimo token, a segnalare la fine dell'input.
Un'altra cosa rilevante è la gestione di whitespaces e newline chars. Gli spazi sono stati ignorati (la grammatica è stata scritta in modo da non averne bisogno per individuare la concatenazione) mentre i newline sono gestiti in modo da ignorare gli a capo multipli, una sequenza di newline viene gestita come unico token `{ type: 'NEWLINE', value: '\n' }`. I commenti sono ignorati (che siano single line o multi line) e i newline dentro i commenti sono anch'essi ignorati.
Per quanto riguarda il modo in cui è stata gestita la tokenizzazione, non sono state usate regex per fare matching di sottostringhe. I motivi di questa scelta sono principalmente 2:

- maggior controllo sulla gestione delle posizioni (numero di linea, colonna, ecc...)
- non era necessario scomodare le espressioni regolari, per identificare tutti i token della grammatica è sufficiente guardare al più 2 caratteri, il corrente e il successivo. Esempio per identificare il token `LTE` basta verificare che il carattere corrente sia `<` e il successivo `=`. Ovviamente si è dovuta prestare attenzione alle precedenze, ossia il token `LTE` deve essere matchato prima del token `LT` per evitare di tokenizzare `<=` come due token distinti `<` e `=`.

Per quanto riguarda la gestione degli errori, il lexer restituisce un generico "Unexpected char "X" at line Y column Z".

### Parser

Nel commento del codice è scritto che il parser è di tipo ricorsivo discendente, ma ad essere più precisi è un parser LL(1). Ci sono 2 motivi principali per cui ho scelto questa strada:

1. Primo, un parse LL(1) è estremamente semplice sia a livello concettuale che implementativo, un generico parser per la grammatica ambigua fornita nel documento avrebbe richiesto un implementazione molto più complessa e con una marea di dettagli in più che non sarei mai riuscito a sviluppare in tempi ragionevoli.
2. Secondo e più ovvio motivo, un parser LL(1) è estremamente più efficiente. Si ha un tempo lineare vs un tempo potenzialmente esponenziale (come minimo cubico) per un parser CF. Non che sarebbe stato un grosso problema vista la dimensione dei programmi di esempio usati, ma era comunque una cosa da prendere in considerazione.

Avere un parser LL(1) ha richiesto di riscrivere la grammatica in modo da eliminare le ambiguità e avere produzioni nella forma `A -> aB`, `A -> a` (ossia che iniziano con un terminale). La parte più critica della grammatica fornita era la parte delle espressioni. Come è possibile vedere dalla storia dei commit sono partito definendo/implementando grammatica e parser per le espressioni e poi ho man mano ampliato aggiungendo gli altri costrutti (variabili, assegnamenti, funzioni, selezione, iterazione).
Per risolvere l'ambiguità sulle espressioni ho usato un metodo abbastanza standard (almeno dal punto di vista pratico) che è quello di definire una tabella di precedenza degli operatori, esempio:

| priorità | operatori      |
| -------- | -------------- |
| 4        | >= > = <> < <= |
| 3        | + -            |
| 2        | \* /           |
| 1        | # ~            |
| 0        | concat         |

In questo caso maggiore è il numero minore è la priorità. Per ogni riga viene definita una regola nella grammatica, che viene usata nella regola di priorità subito minore. Questa dipendenza d'uso delle regole fa si che le regole con priorità più alta finiscano più in basso nell'albero di parsing, portando quindi a gestirle prima.

Altra cosa rilevante riguardo il parser è che non restituisce un albero di parsing che combacia con la struttura della grammatica ma restituisce un AST che è una rappresentazione intermedia che elimina tutti i dettagli irrilevanti. La precisa strutture dei nodi dell'AST può essere vista nel sorgente del parser.

### Semantic Analyzer

L'analizzatore semantico prende in input l'AST e fa un paio di cose:

- Costruisce una tabella degli scope, che contiene informazioni sullo scope di ciascuna funzione. Esempio: quali parametri accetta, quali variabili sono state definite, ecc... Questa tabella è implementata con una mappa indicizzata per nome della funzione. Ho scelto una mappa per via dell'assunzione che non possono essere definite funzioni con lo stesso nome, in caso contrario avrei dovuto usare probabilmente una struttura ad albero per mantenere le relazioni tra gli scope innestati.
- Fa controlli sulla semantica di determinate operazioni (in fase di compilazione, qui il programma non ha ancora iniziato ad essere eseguito) e solleva errori in caso di operazioni non permesse. Esempio, viene sollevato errore in caso di assegnamento a parametro, in caso di uso di una variabile/funzione non definita, parametri mancanti, ecc...

Altra cosa rilevante da far presente è la gestione delle variabili/funzioni globali. Queste sono memorizzate sempre nella stessa mappa con una chiave arbitraria che non appartiene ai possibili nomi delle funzioni. Per non segnalare come non definite le variabili globali l'analizzatore semantico effettua prima una visita a parte dell'AST per costruire lo scope globale `buildGlobalScope` e poi ne effettua un'altra per effettuare i check sopra menzionati.
L'output dell'analizzatore semantico è la tabella degli scope che sarà poi usata dall'interprete.

### Interpreter

Prende in input l'AST, usa l'analizzatore semantico e poi esegue il programma.
Le cose più rilevanti sull'interprete sono le seguenti:

- Internamente esistono i tipi di dato stringa e "intero" (che in JS è gestito come IEEE754), ma tutte le operazioni sono gestite come operazioni su vettori per comodità. Quindi esempio, la somma di due interi `1 + 1` è gestita come somma di vettori `[1] + [1]`.
- Ho assunto che i vettori contengano dati omogenei al loro interno e che le operazioni lavorino su vettori dello stesso tipo, in caso contrario viene sollevato un errore. Il motivo di questa scelta è dovuto al fatto che operazioni tipo `1 + "text"` o `"text" > 1` non hanno molto senso. Stesso discorso si applica a operazioni su dati indefiniti, esempio variabili deallocate, funzioni senza valore di ritorno.
- La gestione delle chiamate di funzione avviene tramite call stack, nel momento in cui viene chiamata una funzione viene pushato sul call stack uno stack frame che conterrà le variabili locali della funzione. Quando la funzione termina lo stack frame viene tolto dal call stack liberando la memoria. Stack frame e call stack sono implementate con strutture del linguaggio ospite JS, quindi l'effettiva allocazione e deallocazione è gestita dal motore che esegue javascript (V8 nel caso di nodejs) e non è sotto il controllo diretto dell'interprete (si potrebbe teoricamente forzare il GC a deallocare ma sarebbe probabilmente molto meno efficiente). Le variabili globali sono memorizzate in uno stack frame dedicato pushato come primo prima di iniziare l'esecuzione del programma.
