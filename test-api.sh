#!/bin/bash

echo "Testing Scaler Vulnersity APIs"
echo "=============================="
echo ""

echo "1. Get Courses:"
curl -s http://localhost:8081/api/v1/courses | jq '.'
echo ""

echo "2. Login:"
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"student123"}' | jq '.'
echo ""

echo "3. Get Products:"
curl -s http://localhost:8082/api/v1/products | jq '.'
echo ""

echo "4. Get Forums:"
curl -s http://localhost:8083/api/v1/forums | jq '.'
echo ""
