#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Scaler Vulnersity..."
docker-compose up -d
echo "Waiting for services to start (30 seconds)..."
sleep 30
echo ""
echo "✅ Scaler Vulnersity is running!"
echo ""
echo "Access at:"
echo "  Web UI:  http://localhost"
echo "  MailHog: http://localhost:8025"
echo ""
docker-compose ps
