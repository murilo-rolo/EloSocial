#!/usr/bin/env bash
set -e

echo "===================================================="
echo "      Setup do EloSocial                            "
echo "===================================================="

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "[+] backend/.env criado de backend/.env.example"
else
    echo "[✔] backend/.env já existe"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "[+] frontend/.env criado de frontend/.env.example"
else
    echo "[✔] frontend/.env já existe"
fi

if [ ! -f docker-compose.yml ]; then
    cp docker-compose.example.yml docker-compose.yml
    echo "[+] docker-compose.yml criado de docker-compose.example.yml"
else
    echo "[✔] docker-compose.yml já existe"
fi

if [ ! -f backend/Dockerfile ]; then
    cp backend/Dockerfile.example backend/Dockerfile
    echo "[+] backend/Dockerfile criado de backend/Dockerfile.example"
else
    echo "[✔] backend/Dockerfile já existe"
fi

if [ ! -f frontend/Dockerfile ]; then
    cp frontend/Dockerfile.example frontend/Dockerfile
    echo "[+] frontend/Dockerfile criado de frontend/Dockerfile.example"
else
    echo "[✔] frontend/Dockerfile já existe"
fi

echo "===================================================="
echo " Setup concluído!"
echo " Configure as chaves nos arquivos:"
echo "   - backend/.env"
echo "   - frontend/.env"
echo " Depois execute: docker compose up --build"
echo "===================================================="
