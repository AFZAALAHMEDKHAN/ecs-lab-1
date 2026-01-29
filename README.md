# Scaler Vulnersity

⚠️ **WARNING**: This is an INTENTIONALLY VULNERABLE application for educational purposes ONLY!

## Quick Start

1. Build all services:
   ```bash
   ./build.sh
   ```

2. Start all services:
   ```bash
   ./start.sh
   ```

3. Access the application:
   - Web UI: http://localhost
   - MailHog: http://localhost:8025

4. Test credentials:
   - Username: `student1`
   - Password: `student123`

## Commands

- `./build.sh` - Build all Docker images
- `./start.sh` - Start all services
- `./stop.sh` - Stop all services
- `./logs.sh [service-name]` - View logs
- `./test-api.sh` - Test all APIs

## Services

- Identity Service (Java): http://localhost:8080
- Course Service (Python): http://localhost:8081
- Commerce Service (Node.js): http://localhost:8082
- Community Service (Go): http://localhost:8083
- PostgreSQL: localhost:5432
- MongoDB: localhost:27017

## Vulnerabilities Included

- SQL Injection
- NoSQL Injection
- Broken Authentication
- BOLA (Broken Object Level Authorization)
- BFLA (Broken Function Level Authorization)
- Security Misconfiguration
- And more OWASP API Top 10 vulnerabilities...

## DO NOT

- Deploy to production
- Use real user data
- Expose to the internet
- Use for malicious purposes
