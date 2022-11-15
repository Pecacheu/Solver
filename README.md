# Pecacheu's Math Solver 3000
Welp this basically started out as a joke when I told my friends "Bet I can just write a program that'll do my math homework for me."

It's been a while since then, and at this rate it's actually getting pretty complex! I'd say it's already surpassed the functionality of my TI-84+ and then some. I figured that this program had evolved enough past a joke that it could use some version management, so here we are!

Btw any formulas in here are 100% figured out by my dumb Rai butt as I read through online sources and textbooks, so accuracy is *not* guaranteed, but I do test things with as many crazy examples as I can come up with! *(Yeah, I like to joke how this is anti-cheating, the reverse of cheating. At this rate I'm literally having to make up 50 times as much homework for myself just to test bugs. Sure, I could just do it manually and have way less work on my plate... But c'mon, where's the fun in that?)*

## Installation
First install the latest [Node.js](https://nodejs.org), then clone the repo:
```
git clone https://github.com/Pecacheu/Solver
cd Solver
solver ? [Windows]
- OR -
./solver.sh ? [Linux]
```

## Usage
You can run commands directly, eg. `solver mp "x^2" "2x + 5"`, or just enter RUN mode with `solver`, then call another mode using the `` ` `` symbol. Try `` `mp "x^2" "2x + 5"`` or `` `g "(x/2-1)^2-1" 0 0 4``

### In RUN Mode (Default; SX = On)
- Type `?` for command list & help
- Run a command with `` `<cmd> [arg1] [arg2]...`` *(You can enclose args in quotes)*
- Set a variable (a-z) ex `x = 2*3` -> `x = 6`
- Delete a variable with `del <name>`
- Solve a formula ex `(x^2 + 6)/3` -> 14
- Enable Simplify mode with `simp`
- Then simplify a formula ex `x^3 + 4x^3` -> `5x^3`
- `sx` = Simplify X mode *(Simp mode but with substitution for X)*
- `code` = Code mode *(Allows direct eval of JavaScript)*
- Type `q` to quit

### Special Functions (Use in any Poly)
- `sqrt(x)` = Square Root
- `cbrt(x)` = Cube Root
- `abs(x)` or `|x|` = Absolute Value
- `ln(x)` = Natural Logarithm (Base e)
- `log(x)` = Common Logarithm (Base 10)
- `logb(x)` = Logarithm (Ex. `log4(x)`)
- `sin|cos|tan|sec|csc|cot(x)` Sine functions (rad)
- `asin|acos|atan(x)` Arcsine functions (rad)
- `rad(x)` Convert degrees to radians
- `perm(n,r)` Permutation (`n!/(n-r)!`)
- `comb(n,r)` Combination (`n!/(r!(n-r)!)`)
- `x!` Factorial (Equivalent to perm where r=n-1)
- `p` = Pi (~3.14)
- `e` = Euler's number (~2.718)

### Graph Controls (In Graph Mode)
- `Up/Down` Move Y Axis
- `Right/Left` Move X Axis
- `+/-` Adjust Zoom Level
- `Home` or `Space` Recenter View
- `Esc` Exit Graph Mode