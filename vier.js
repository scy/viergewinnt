"use strict";

/*

This variation of the game has different winning formations: Instead of four tokens in a straight line, these
constellations win:

  X X     X X       X         X
X X         X X     X X     X X
                      X     X

More documentation to follow.

 */

const SYMBOL_A = 'X';
const SYMBOL_B = 'O';
const SYMBOL_EMPTY = '-';

class GameError extends Error {
    constructor(msg) {
        super(msg);
        this.name = this.constructor.name;
    }
}

class InvalidArgumentError extends GameError { }

class ColumnFullError extends GameError { }

class Field {
    constructor(rows, columns) {
        if (rows < 3 || columns < 3) {
            throw new InvalidArgumentError("the field has to be at least 3x3 in size");
        }
        this._spaces = [];
        for (let i = 0; i < columns; i++) {
            this._spaces.push(new Array(rows).fill(SYMBOL_EMPTY));
        }
    }
    get columnCount() {
        return this._spaces.length;
    }
    get rowCount() {
        return this._spaces[0].length;
    }
    getSpace(row, column) {
        if (!this.isValidColumn(column)) {
            throw new InvalidArgumentError(`there is no column ${column}`);
        }
        if (typeof this._spaces[column][row] === "undefined") {
            throw new InvalidArgumentError(`there is no row ${row}`);
        }
        return this._spaces[column][row];
    }
    getWinner() {
        for (let x = this.columnCount - 3; x >= 0; x--) {
            for (let y = this.rowCount - 2; y >= 0; y--) {
                let ref = this.getSpace(y, x + 1);
                if (ref !== SYMBOL_EMPTY && this.getSpace(y, x + 2) === ref && this.getSpace(y + 1, x) === ref && this.getSpace(y + 1, x + 1) === ref) {
                    return ref;
                }
                ref = this.getSpace(y, x);
                if (ref !== SYMBOL_EMPTY && this.getSpace(y, x + 1) === ref && this.getSpace(y + 1, x + 1) === ref && this.getSpace(y + 1, x + 2) === ref) {
                    return ref;
                }
            }
        }
        for (let x = this.columnCount - 2; x >= 0; x--) {
            for (let y = this.rowCount - 3; y >= 0; y--) {
                let ref = this.getSpace(y, x);
                if (ref !== SYMBOL_EMPTY && this.getSpace(y + 1, x) === ref && this.getSpace(y + 1, x + 1) === ref && this.getSpace(y + 2, x + 1) === ref) {
                    return ref;
                }
                ref = this.getSpace(y, x + 1);
                if (ref !== SYMBOL_EMPTY && this.getSpace(y + 1, x) === ref && this.getSpace(y + 1, x + 1) === ref && this.getSpace(y + 2, x) === ref) {
                    return ref;
                }
            }
        }
        return null;
    }
    insert(column, symbol) {
        if (!this.isValidColumn(column)) {
            throw new InvalidArgumentError(`there is no column ${column}`);
        }
        if (symbol !== SYMBOL_A && symbol !== SYMBOL_B) {
            throw new InvalidArgumentError(`"${symbol}" is not a valid symbol to insert`);
        }
        for (let row = this._spaces[column].length - 1; row >= 0; row--) {
            if (this._spaces[column][row] === SYMBOL_EMPTY) {
                this._spaces[column][row] = symbol;
                return;
            }
        }
        throw new ColumnFullError(`column ${column} is full`);
    }
    isFull() {
        return this._spaces.reduce((prev, col) => prev && (col[0] !== SYMBOL_EMPTY), true);
    }
    isValidColumn(column) {
        return typeof this._spaces[column] !== "undefined";
    }
    toString() {
        let lines = [];
        for (let row = 0; row < this.rowCount; row++) {
            lines.push(this._spaces.map(column => column[row]).join(" "));
        }
        return lines.join("\n");
    }
}

class Game {
    constructor(rows, columns) {
        this._field = new Field(rows, columns);
        this._currentPlayer = SYMBOL_A;
        this._readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }
    async doValidInsert() {
        while (true) {
            try {
                this._field.insert(await this.readColumn(), this._currentPlayer);
                return;
            } catch (err) {
                if (err instanceof InvalidArgumentError || err instanceof ColumnFullError) {
                    console.error(`Error: ${err.message}`);
                }
            }
        }
    }
    async ask(question) {
        return new Promise((res) => {
            this._readline.question(question, answer => res(answer));
        });
    }
    nextPlayer() {
        this._currentPlayer = (this._currentPlayer === SYMBOL_A) ? SYMBOL_B : SYMBOL_A;
    }
    async readColumn() {
        return await this.ask(`Which column do you want to play (0-${this._field.columnCount - 1})? `);
    }
    showField() {
        let numbers = Array.from(new Array(this._field.columnCount), (_, k) => k);
        let numberlines = [];
        for (let pos = Math.floor(Math.log10(numbers.length - 1)); pos >= 0; pos--) {
            numberlines.push(numbers.map(num => {
                let str = String(num);
                return (pos > str.length - 1) ? " " : str[str.length - pos - 1];
            }).join(" "));
        }
        console.log("\x1b[2JField:\n" +
            this._field.toString() + "\n" +
            numberlines.join("\n")
        );
    }
    showPlayer() {
        console.log(`\nIt's your turn, ${this._currentPlayer}!\n`)
    }
    async run() {
        while (true) {
            this.showField();
            this.showPlayer();
            await this.doValidInsert();
            if (this._field.isFull()) {
                this.showField();
                console.log("\nThe field is full, nobody won!");
                return;
            }
            let winner = this._field.getWinner();
            if (winner !== null) {
                this.showField();
                console.log(`\nCongratulations, ${winner}, you won!`);
                return;
            }
            this.nextPlayer();
        }
    }
}

let g = new Game(9, 10);
g.run().then(() => process.exit());
