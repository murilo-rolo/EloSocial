@echo off
echo ====================================================
echo       Iniciando o EloSocial
echo ====================================================

call setup.bat

echo ====================================================
echo [*] Iniciando os containers Docker...
echo ====================================================

docker compose up --build
pause
