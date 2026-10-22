@echo off
title BloodSync Application (Latest)
cd /d "%~dp0latest_project"
echo ========================================================
echo Starting BloodSync Application on http://localhost:3001
echo ========================================================
node ./node_modules/tsx/dist/cli.mjs server.ts
pause
