@echo off
echo ====================================================
echo       Iniciando Configuracao do EloSocial
echo ====================================================

:: Check and copy backend .env
if not exist "backend\.env" (
    echo [!] Arquivo backend\.env nao encontrado. Copiando do exemplo...
    copy backend\.env.example backend\.env
    echo [+] backend\.env criado!
) else (
    echo [x] backend\.env ja existe.
)

:: Check and copy frontend .env
if not exist "frontend\.env" (
    echo [!] Arquivo frontend\.env nao encontrado. Copiando do exemplo...
    copy frontend\.env.example frontend\.env
    echo [+] frontend\.env criado!
) else (
    echo [x] frontend\.env ja existe.
)

echo ----------------------------------------------------
echo [!] ATENCAO: Lembre-se de configurar as suas chaves
echo     do Supabase nos arquivos backend\.env e
echo     frontend\.env antes ou depois de iniciar.
echo ----------------------------------------------------
echo [*] Iniciando os containers Docker...
echo ====================================================

docker compose up --build
pause
