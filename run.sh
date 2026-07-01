#!/usr/bin/env bash
set -e

echo "===================================================="
echo "      Iniciando o EloSocial                         "
echo "===================================================="

./setup.sh

echo "===================================================="
echo "[*] Iniciando os containers Docker..."
echo "===================================================="

docker compose up --build
