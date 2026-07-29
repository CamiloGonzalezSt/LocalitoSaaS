@echo off
setlocal
set "ROOT=%~dp0.."
set "PATH=C:\Program Files\nodejs;%PATH%"
set "NODE_OPTIONS=--use-system-ca"
cd /d "%ROOT%"
call "C:\Program Files\nodejs\npm.cmd" run dev:web

