@echo off
echo ====================================================
echo       Setup do EloSocial
echo ====================================================

if not exist "backend\.env" (
    copy backend\.env.example backend\.env
    echo [+] backend\.env criado de backend\.env.example
) else (
    echo [x] backend\.env ja existe
)

if not exist "frontend\.env" (
    copy frontend\.env.example frontend\.env
    echo [+] frontend\.env criado de frontend\.env.example
) else (
    echo [x] frontend\.env ja existe
)

if not exist "docker-compose.yml" (
    copy docker-compose.example.yml docker-compose.yml
    echo [+] docker-compose.yml criado de docker-compose.example.yml
) else (
    echo [x] docker-compose.yml ja existe
)

if not exist "backend\Dockerfile" (
    copy backend\Dockerfile.example backend\Dockerfile
    echo [+] backend\Dockerfile criado de backend\Dockerfile.example
) else (
    echo [x] backend\Dockerfile ja existe
)

if not exist "frontend\Dockerfile" (
    copy frontend\Dockerfile.example frontend\Dockerfile
    echo [+] frontend\Dockerfile criado de frontend\Dockerfile.example
) else (
    echo [x] frontend\Dockerfile ja existe
)

echo ====================================================
echo Setup concluido!
echo Configure as chaves nos arquivos:
echo   - backend\.env
echo   - frontend\.env
echo Depois execute: docker compose up --build
echo ====================================================
pause
