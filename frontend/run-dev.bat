@echo off
cd /d "%~dp0"
echo Cleaning .next cache...
node scripts\clean-next.js
echo Starting Next.js on http://localhost:3000 ...
npm run dev
pause
