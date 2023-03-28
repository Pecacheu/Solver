![Solver Graph Demo](https://user-images.githubusercontent.com/3608878/224240966-a8b08462-39dc-48cf-9f33-0d01e19981f5.png)

# Pecacheu's Math Solver 3000
This started out as a joke when I told my friends "Bet I can just write a program that'll do my math homework for me."

It's been a while since then, and at this rate, it's getting complex! (Math pun? You decide :P) I'd say it's already surpassed the functionality of my TI-84+ and then some. Figured this monstrosity could use some version management, and maybe help a few other struggling students along the way, so here we are!

*Disclaimer: All formulas and techniques are created by my dumb Rai butt via textbooks and scouring the internet, so accuracy is not guaranteed, but I always test with as many crazy edge-cases as I can! (Sure, I could do all my homework by hand, and probably have **less** work on my plate than maintaining this... But c'mon, where's the fun in that?)*

### == NEW in v2.0 ==
- Arbitrary-precision float support for >64-bit accuracy. **To infinity and beyond!**
- Matrix and vector support! Matrix solver support coming soon. MATLAB can suck on my free and open-source Rai beans >:3

## Installation
Install [Git](https://git-scm.com) (or download the [latest release](https://github.com/Pecacheu/Solver/releases) directly), then in Linux Bash, or PowerShell on Windows, run the commands below. [AutoLoader](https://github.com/Pecacheu/AutoLoader) should install Node.js for you!
```bash
git clone --recurse-submodules https://github.com/Pecacheu/Solver
cd Solver
./solver.sh ? [Linux]
./solver ? [Windows]
```

## Usage
You can run commands directly, eg. `solver mp "x^2" "2x + 5"`, or just enter RUN mode with `solver`, then call another mode using the `` ` `` symbol. Try `` `mp "x^2" "2x + 5"`` or `` `g "(x/2-1)^2-1" 0 0 4``

### In RUN Mode (Default)
- Type `?` for command list & help
- Run multiple statements on the same line with `;` between them
- Run a command with `` `<cmd> [arg1] [arg2]...`` *(You can enclose args in quotes)*
- Set a variable (a-z) ex. `x = 2*3` -> `x = 6`
- Solve a formula ex. `(x^2 + 6)/3` -> `14`
- Simplify a formula ex. `x^3 + 4x^3` -> `5x^3`
- Numbers can also be in Scientific notation ex. `2.2e+4` -> `22000`
- `sv` = Toggle Substitute Variables *(Default: On)*
- `dec/frac` = Toggle Decimal/Fractional Results *(Default: Frac)*
- `deg` = Toggle Degrees/Radians Mode *(Default: Radians)*
- `js` = Code mode *(Allows direct eval of JavaScript)*
- `vars` = List Variables
- `del <x>` = Delete Var
- Type `q` to quit

### Functions *(Use in Polynomials)*
- `sqrt(x)` Square Root
- `cbrt(x)` Cube Root
- `abs(x)` or `|x|` Absolute Value
- `ln(x)` Natural Logarithm (Base e)
- `log(x,b=10)` Logarithm Base `b` *(Default 10)*
- `sin|cos|tan|sec|csc|cot(x)` Sine functions
- `asin|acos|atan(x)` Arcsine functions *(Inverse Sine)*
- `rad(x)` Convert degrees to radians
- `deg(x)` Convert radians to degrees

~~- `perm(n,r)` Permutation (`n!/(n-r)!`)~~\
~~- `comb(n,r)` Combination (`n!/(r!(n-r)!)`)~~\
~~- `x!` Factorial (Equivalent to perm where r=n-1)~~

- `P` = Pi (~3.14)
- `e` = Euler's number (~2.718)

### Matrix Functions
- `[a b-1 c; d (e^2 + 5) f; g h i]` Create a 3x3 Matrix *(MATLAB Syntax)*
- `tpose(m)` Transpose of m
- `dot(a,b)` Dot Product of vectors a and b *(Note: Matrix inputs to `dot()` are interpreted different to MATLAB. The dot product of two matrices multiplies each element to its matching element, equivalent to MATLAB's `.*` operator)*
- `dotPow(m,p)` Elementwise matrix power *(Equivalent to `m.^p` in MATLAB)*
- `sum(m)` Sum of all elements of m
- `det(m)` Determinant of m

~~- `inv(m)` Inverse of m~~

- `rref(m)` Row Reduced Echelon Form of m
- `rows(m)`/`cols(m)` Rows or columns of m *(Cols is also the length of a vector)*
- `norm(m,p=2)` **p**-norm (default 2) of m. Equivalent to `sum(abs(dotPow(m,p)))^(1/p)` *(2-norm is also the magnitude of a vector)*
- `eye(x)` Identity matrix I^x

### Graph Controls (In Graph Mode)
- `Up/Down` Move Y Axis
- `Right/Left` Move X Axis
- `+/-` Adjust Zoom Level
- `Home` or `Space` Recenter View
- `Esc` Exit Graph Mode

## So, you want to know how it works?
<details>
<summary>Details here</summary>
The architecture of PMS is complex and nuanced *(over 1000 lines in total!)*, but utilizes an Object Oriented structure that maximizes code reuse, allowing for a high degree of flexibility and extendability of the codebase. This makes it trivial to create new math functions and commands. On a basic level, mathematical formulas are stored in PMS using three key fundamental building blocks. `Poly` *(Polynomial, a list of terms that are added or subtracted)*, `Term` *(A set of SubTerms that are multiplied or divided)*, and `SubTerm` *(A representation of a single constant exponent value, variable, matrix/vector, or function)*.

SubTerms are the most flexible datatype. Not only can they store a variable, but also an entire child `Poly` object, representing an internal polynomial contained in parenthesis. When holding a function, each comma-separated argument is, itself, a `Poly`. SubTerms also each store a power value *(which may be a number, or another `Poly` itself)* and sign. The sign is stored separately because, for instance, `x^-2` is the same as `1/x^2`, hence a negative sign is representative of division and this information does not need to be stored separately. Another optimization is that SubTerms, in some situations, store a cached string representation of their value to speed up printing and string conversion.

Matrices are represented using a `Matrix` object stored inside its respective `SubTerm`. Their contents are stored as a two-dimensional array of `Poly` objects, though when printed they are output in MATLAB-style format, allowing them to be converted to and from strings in one line. When the only contents of the top-level `Poly` is a single matrix, this triggers pretty-print mode, drawing a more visually interesting and column-aligned representation of the matrix contents to the console.

The most important operation performed on these datatypes is the simplification operation, or `simp`, which recursively simplifies every `Poly`, `Term`, `SubTerm`, `Matrix`, and so on, backtracking and re-simplifying whenever needed, combining SubTerms and Terms at multiple levels, substituting variables that have defined values, finding the Greatest Common Denominator of fractions, and performing any other operations deemed necessary. When decimal output is enabled, `simp` performs a second, more thorough simplification which should typically result in a complete numerical answer, or as close as can be achieved given any undefined variables.

*Note:* Undefined variables are not actually considered an error in PMS's syntax language. These simply represent unknowns that may be solved later. Unknowns can be run through **ANY** function or operation within PMS and are left unchanged, with as much simplification occurring around them as possible. This makes PMS more powerful than any typical calculator, or even MATLAB, where, for instance, attempting to calculate `6yx/(2x) + 14y` simply produces an error such as *"Variables x and y are undefined!"*, rather than the expected result a mathematician would give you, `17y`.
</details>