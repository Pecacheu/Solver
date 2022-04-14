# Pecacheu's Math Solver 3000
Welp this basically started out as a joke when I told my friends "Bet I can just write a program that'll do my math homework for me."

But, while still a single-file Node.js program with no depends, at this point it's starting to get complex enough that I could use some version management, so here we are lol.

Btw any formulas in here are 100% figured out by my dumb Rai butt as I read through my textbooks, so accuracy is *not* guaranteed, but I do test things with as many weird examples as I can come up with. (Yeah... At this point you could say it's more work than just doing my homework, and you'd be right! But c'mon where's the fun in that?)

#### In RUN Mode (Default)
- Type `?` for command list
- Run a command with `` `<cmd> [arg1] [arg2]...`` *(Can enclose args in quotes)*
- Set a variable (a-z) ex `x = 2*3` -> `x = 6`
- Delete a variable with `del <name>`
- Solve a formula ex `(x^2 + 6)/3` -> 14
- Enable Simplify mode with `simp`
- Then simplify a formula ex `x^3 + 4x^3` -> `5x^3`
- `sx` = Simplify X mode *(Simp mode but with substitution for X)*
- `code` = Code mode *(Allows direct eval of JavaScript)*
- Type `q` to quit

#### Special Functions (Use in any Poly)
- `sqrt(x)` = Square Root
- `abs(x)` = Absolute Value
- `ln(x)` = Natural Logarithm (Base e)
- `log(x)` = Common Logarithm (Base 10)
- `logb(x)` = Logarithm (Ex. `log4(x)`)
- `sin|cos|tan|sec|csc|cot(x)` Sine functions
- `asin|acos|atan(x)` Arcsine functions
- `p` = Pi (~3.14)
- `e` = Euler's number (~2.718)