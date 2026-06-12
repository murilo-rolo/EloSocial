#!/bin/bash
# EloSocial - Script de setup rápido

echo "🚀 EloSocial - Setup"
echo "===================="

# 1. Frontend
echo ""
echo "📦 Instalando dependências do Frontend..."
cd frontend
npm install
echo "✅ Frontend pronto!"

# 2. Backend
echo ""
echo "📦 Configurando Backend..."
cd ../backend
if command -v python3 &> /dev/null; then
  if python3 -m pip --version &> /dev/null; then
    python3 -m pip install -r requirements.txt
    echo "✅ Backend pronto!"
  else
    echo "⚠️  pip do Python não encontrado."
    echo "   Instale com: sudo apt install python3-pip"
    echo "   Depois: cd backend && pip install -r requirements.txt"
  fi
else
  echo "⚠️  Python3 não encontrado."
fi

# 3. .env files
echo ""
echo "🔑 Configurando .env..."
cd ..
if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "   Criei frontend/.env — edite com suas chaves do Supabase"
fi
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "   Criei backend/.env — edite com suas chaves do Supabase"
fi

echo ""
echo "====================================="
echo "✅ Setup concluído!"
echo ""
echo "Para rodar o Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Para rodar o Backend:"
echo "  cd backend && uvicorn app.main:app --reload"
echo ""
echo "📖 Consulte README.md para instruções detalhadas."
echo "====================================="
