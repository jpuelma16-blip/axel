#!/bin/bash
# Auto-configura el entorno para Codespaces
set -e

# Detecta si estamos en Codespaces
if [ -n "$CODESPACE_NAME" ]; then
  BASE_URL="https://${CODESPACE_NAME}-3000.app.github.dev"
  echo "NEXT_PUBLIC_BASE_URL=$BASE_URL" > .env.local
  echo "TWILIO_PHONE_NUMBER=+56922474974" >> .env.local
  echo "✅ Configurado para Codespaces: $BASE_URL"
else
  echo "NEXT_PUBLIC_BASE_URL=http://localhost:3000" > .env.local
  echo "TWILIO_PHONE_NUMBER=+56922474974" >> .env.local
  echo "✅ Configurado para desarrollo local"
fi

echo ""
echo "🚀 Axel Ruta Express listo"
echo "   Web:  http://localhost:3000"
echo "   Chat: http://localhost:3000/asistente"
echo ""
echo "Para activar WhatsApp: npm run bot"
