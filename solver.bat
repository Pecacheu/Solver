@echo off
if %1x==oldx (node solverOld.mjs) else (node solver.mjs %*)