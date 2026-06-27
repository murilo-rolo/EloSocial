#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "===================================================="
echo "      Iniciando Configuração do EloSocial           "
echo "===================================================="

# Check and copy backend .env
if [ ! -f backend/.env ]; then
    echo "[!] Arquivo backend/.env não encontrado. Copiando do exemplo..."
    cp backend/.env.example backend/.env
    echo "[+] backend/.env criado!"
else
    echo "[✔] backend/.env já existe."
fi

# Check and copy frontend .env
if [ ! -f frontend/.env ]; then
    echo "[!] Arquivo frontend/.env não encontrado. Copiando do exemplo..."
    cp frontend/.env.example frontend/.env
    echo "[+] frontend/.env criado!"
else
    echo "[✔] frontend/.env já existe."
fi

echo "----------------------------------------------------"
echo "[!] ATENÇÃO: Lembre-se de configurar as suas chaves "
echo "    do Supabase nos arquivos backend/.env e"
echo "    frontend/.env antes ou depois de iniciar."
echo "----------------------------------------------------"
echo "[*] Iniciando os containers Docker..."
echo "===================================================="

docker compose up --build
