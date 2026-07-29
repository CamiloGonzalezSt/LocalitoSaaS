@echo off
setlocal
set "ROOT=%~dp0.."
cd /d "%ROOT%"
docker compose up -d postgres

