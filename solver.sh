#!/bin/bash
if [ $1 -eq 'old' ]; then node solverOld.mjs
else node solver.mjs $@; fi