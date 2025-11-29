# Quick Start Guide

Get the Memory Care Companion running in under 10 minutes.

## Prerequisites

Make sure you have installed:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [OpenAI API Key](https://platform.openai.com/api-keys)

## Step 1: Clone and Configure (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd windsurf-project-3

# Copy environment template
cp .env.example .env
```

## Step 2: Add Your OpenAI API Key (1 minute)

Edit `.env` file and add your OpenAI API key:

```bash
# Required - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-key-here

# Generate a secret key (run: openssl rand -hex 32)
SECRET_KEY=your-secret-key-here
```

**Note**: The other settings have sensible defaults for development.

## Step 3: Start Services (3 minutes)

```bash
# Start all services with Docker Compose
docker-compose up -d

# Wait for services to be healthy (check status)
docker-compose ps

# View logs to ensure everything is running
docker-compose logs -f backend
```

You should see:
```
✓ postgres - healthy
✓ redis - healthy  
✓ backend - healthy
✓ frontend - running
```

## Step 4: Initialize Database (1 minute)

```bash
# Run database migrations
docker-compose exec backend alembic init alembic
docker-compose exec backend alembic revision --autogenerate -m "Initial schema"
docker-compose exec backend alembic upgrade head
```

## Step 5: Access the Application (1 minute)

Open your browser:

- **Home Page**: http://localhost:3000
- **Patient Interface**: http://localhost:3000/patient
- **Caregiver Dashboard**: http://localhost:3000/caregiver
- **API Documentation**: http://localhost:8000/docs

## Step 6: Try It Out! (2 minutes)

### Test the Patient Interface

1. Go to http://localhost:3000/patient
2. Click "Start Talking"
3. Type: "Hello, how are you?"
4. See the AI respond with a personalized message
5. Try: "Tell me about my day" or "What time is it?"

### Test the Caregiver Dashboard

1. Go to http://localhost:3000/caregiver
2. View mock patient data and analytics
3. Explore conversation history
4. Check alert system

## Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution**: Ensure PostgreSQL is running
```bash
docker-compose up -d postgres
docker-compose logs postgres
```

### Issue: "OpenAI API error"

**Solution**: Check your API key in `.env`
```bash
# Verify key is set
grep OPENAI_API_KEY .env

# Restart backend
docker-compose restart backend
```

### Issue: "Frontend won't load"

**Solution**: Check Node.js dependencies
```bash
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Issue: "Port already in use"

**Solution**: Change ports in `docker-compose.yml`
```yaml
frontend:
  ports:
    - "3001:3000"  # Change 3000 to 3001
    
backend:
  ports:
    - "8001:8000"  # Change 8000 to 8001
```

## What's Next?

### For Development

1. **Add test patient data**
   ```bash
   docker-compose exec backend python scripts/seed_data.py
   ```

2. **Enable hot reload**
   - Backend: Already enabled with `--reload` flag
   - Frontend: Already enabled with `npm run dev`

3. **View logs**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f backend
   ```

### For Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Production environment setup
- Security hardening
- Monitoring and alerting
- Backup procedures

### For Testing

1. **Create test users**
   ```bash
   # Patient account
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "patient@test.com",
       "password": "test123",
       "full_name": "Test Patient",
       "role": "patient"
     }'
   
   # Caregiver account
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "caregiver@test.com",
       "password": "test123",
       "full_name": "Test Caregiver",
       "role": "family_caregiver"
     }'
   ```

2. **Test API endpoints**
   - Interactive docs: http://localhost:8000/docs
   - Try each endpoint with the built-in test UI

3. **Test safety features**
   - In patient interface, type: "I feel very sad"
   - Check caregiver dashboard for alert

## Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove all data (careful!)
docker-compose down -v
```

## Getting Help

- **Documentation**: See [README.md](README.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **API Reference**: http://localhost:8000/docs
- **Issues**: Open a GitHub issue

## System Requirements

### Minimum
- 2 CPU cores
- 4 GB RAM
- 10 GB disk space
- Internet connection (for OpenAI API)

### Recommended
- 4 CPU cores
- 8 GB RAM
- 20 GB disk space
- Fast internet connection

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:

```bash
# Edit backend/app/main.py - changes apply immediately
# Edit frontend/app/page.tsx - browser refreshes automatically
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U memorycare -d memorycare

# Run SQL queries
\dt  # List tables
SELECT * FROM users;
\q   # Quit
```

### Redis Access

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Check keys
KEYS *
GET key_name
QUIT
```

### Reset Everything

```bash
# Nuclear option: delete everything and start fresh
docker-compose down -v
docker system prune -a
docker-compose up -d
```

## API Quick Reference

### Authentication
```bash
# Register
POST /api/auth/register

# Login
POST /api/auth/login

# Get current user
GET /api/auth/me
```

### Conversations
```bash
# WebSocket (real-time chat)
WS /ws/conversation/{patient_id}

# Get conversation history
GET /api/conversations/{id}
```

### Caregiver
```bash
# Get dashboard
GET /api/caregiver/dashboard?caregiver_id=1

# Get patient alerts
GET /api/caregiver/patient/{id}/alerts

# Acknowledge alert
POST /api/caregiver/alert/{id}/acknowledge
```

---

**You're all set!** 🎉

The Memory Care Companion is now running locally. Start exploring the patient interface or caregiver dashboard to see the system in action.

For detailed information about features, architecture, and deployment, see the other documentation files.
