#!/usr/bin/env bash
# Rebrand script for Enruta
# Usage: ./scripts/rebrand.sh "AppName" "#COLOR" "#COLOR_SECONDARY" "com.client.delivery"

APP_NAME=${1:-"Enruta"}
PRIMARY=${2:-"#7C3AED"}
SECONDARY=${3:-"#A3E635"}
PACKAGE=${4:-"com.enruta.app"}

echo "Rebranding app to: $APP_NAME"

# Update app.json
sed -i "s/\"Enruta\"/\"$APP_NAME\"/g" app.json
sed -i "s/com.enruta.app/$PACKAGE/g" app.json

# Update tailwind config
sed -i "s/#7C3AED/$PRIMARY/g" tailwind.config.js
sed -i "s/#A3E635/$SECONDARY/g" tailwind.config.js

# Build production
eas build --platform all --profile production

echo "Done! App rebranded to $APP_NAME"