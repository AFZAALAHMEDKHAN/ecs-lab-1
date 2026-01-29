#!/bin/bash
cd ~/scaler-vulnersity
echo "Building all Docker images..."
docker-compose build
echo "✅ Build complete!"
