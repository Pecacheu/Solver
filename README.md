# Pecacheu's Math Solver 3000
This started out as a joke when I told my friends "Bet I can just write a program that'll do my math homework for me."

It's been a while since then, and at this rate, it's getting complex! (Math pun? You decide :P) I'd say it's already surpassed the functionality of my TI-84+ and then some. Figured this monstrosity could use some version management, and maybe help a few other struggling students along the way, so here we are!

*Disclaimer: All formulas and techniques are created by my dumb Rai butt via textbooks and scouring the internet, so accuracy is not guaranteed, but I always test with as many crazy edge-cases as I can! (Sure, I could do all my homework by hand, and probably have **less** work on my plate than maintaining this... But c'mon, where's the fun in that?)*

**NEW:** Now with arbitrary-precision number support for >64-bit accuracy. **To infinity and beyond!**

**NEW:** Matrix and vector support! Matrix solver support coming soon. MATLAB can suck on my free-and-open-source Rai beans >:3

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

### In RUN Mode (Default)
- Type `?` for command list & help
- Run a command with `` `<cmd> [arg1] [arg2]...`` *(You can enclose args in quotes)*
- Set a variable (a-z) ex. `x = 2*3` -> `x = 6`
- Solve a formula ex. `(x^2 + 6)/3` -> 14
- Enable Simplify mode with `simp`
- Then simplify a formula ex. `x^3 + 4x^3` -> `5x^3`
- `sv` = Toggle Substitute Variables *(Default: On)*
- `dec/frac` = Toggle Decimal/Fractional Results *(Default: Frac)*
- `deg` = Toggle Degrees/Radians Mode *(Default: Radians)*
- `js` = Code mode *(Allows direct eval of JavaScript)*
- `vars` = List Variables
- `del <x>` = Delete Var
- Type `q` to quit

### Special Functions (Use in any Poly)
- `sqrt(x)` Square Root
- `cbrt(x)` Cube Root
- `abs(x)` or `|x|` Absolute Value

~~- `ln(x)` Natural Logarithm (Base e)~~\
~~- `log(x)` Common Logarithm (Base 10)~~\
~~- `log(x,b)` Logarithm Base `b`~~\
~~- `sin|cos|tan|sec|csc|cot(x)` Sine functions (rad)~~\
~~- `asin|acos|atan(x)` Arcsine functions (rad)~~

- `rad(x)` Convert degrees to radians
- `deg(x)` Convert radians to degrees

~~- `perm(n,r)` Permutation (`n!/(n-r)!`)~~\
~~- `comb(n,r)` Combination (`n!/(r!(n-r)!)`)~~\
~~- `x!` Factorial (Equivalent to perm where r=n-1)~~\
~~- `P` = Pi (~3.14)~~\
~~- `e` = Euler's number (~2.718)~~

### Matrix Functions
- `[a b-1 c; d (e^2 + 5) f; g h i]` Create a 3x3 Matrix *(MATLAB Syntax)*
- `tpose(m)` Transpose of m
- `det(m)` Determinant of m
~~- `inv(m)` Inverse of m~~
- `rref(m)` Row Reduced Echelon Form of m
- `eye(x)` Identity matrix I^x

### Graph Controls (In Graph Mode)
Not currently available (coming again soon!)

~~- `Up/Down` Move Y Axis~~\
~~- `Right/Left` Move X Axis~~\
~~- `+/-` Adjust Zoom Level~~\
~~- `Home` or `Space` Recenter View~~\
~~- `Esc` Exit Graph Mode~~