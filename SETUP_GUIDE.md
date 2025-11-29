# Complete Setup Guide: Environment & Database

This guide walks you through setting up your development environment, API keys, and Supabase database step-by-step.

---

## 🚨 IMPORTANT SECURITY NOTE

**Your `.env.example` file contains an exposed OpenAI API key!** This key should be immediately rotated at https://platform.openai.com/api-keys

Never commit real API keys to version control. The `.env.example` should only contain placeholder values.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup (.env)](#environment-setup)
3. [Supabase Database Setup](#supabase-database-setup)
4. [API Keys & Services](#api-keys--services)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- [x] **Node.js** (v18+) - For frontend
- [x] **Python** (3.11+) - For backend
- [x] **PostgreSQL** (15+) - Database (via Supabase or local)
- [x] **Redis** (7+) - For caching (optional but recommended)

### Required Accounts

1. **OpenAI** - https://platform.openai.com
2. **Supabase** - https://supabase.com (free tier available)
3. **Twilio** - https://www.twilio.com (for SMS alerts, optional)

---

## Environment Setup

### Step 1: Create Your .env File

```bash
cd /Users/erichillerbrand/CascadeProjects/windsurf-project-3
cp .env.example .env
```

**Important**: The `.env` file is gitignored and will NOT be committed to version control.

---

### Step 2: Configure Database Connection

#### Option A: Supabase (Recommended for Production)

We'll set this up in detail below, but for now, leave this placeholder:

```env
# Database (will be filled after Supabase setup)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

#### Option B: Local PostgreSQL (For Development)

```env
DATABASE_URL=postgresql://localhost:5432/memorycare
```

If using local PostgreSQL, create the database:

```bash
# Open PostgreSQL
psql postgres

# Create database
CREATE DATABASE memorycare;

# Exit
\q
```

---

### Step 3: Configure Redis (Optional but Recommended)

#### Option A: Local Redis

```env
REDIS_URL=redis://localhost:6379
```

Start Redis locally:

```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### Option B: Redis Cloud (Free Tier)

1. Sign up at https://redis.com/try-free/
2. Create a free database
3. Copy connection URL

```env
REDIS_URL=redis://default:[password]@[endpoint]:6379
```

---

### Step 4: Get OpenAI API Key

1. **Go to OpenAI Platform**: https://platform.openai.com/api-keys

2. **Sign in** or create account

3. **Create API Key**:
   - Click "+ Create new secret key"
   - Name: "MemoryCare Platform - Dev"
   - Permissions: All
   - Copy the key (you won't see it again!)

4. **Add to .env**:
   ```env
   OPENAI_API_KEY=sk-proj-[YOUR_ACTUAL_KEY_HERE]
   OPENAI_MODEL=gpt-4-turbo-preview
   ```

5. **Set up billing** (required for API access):
   - Go to Settings → Billing
   - Add payment method
   - Set usage limits (recommended: $50/month for development)

---

### Step 5: Generate Secret Key for Authentication

```bash
# Generate a secure random secret key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and add to `.env`:

```env
SECRET_KEY=[YOUR_GENERATED_SECRET_HERE]
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

### Step 6: Configure Twilio (Optional - for SMS Alerts)

If you want SMS alerts for caregivers:

1. **Sign up**: https://www.twilio.com/try-twilio
   - Free trial includes $15 credit

2. **Get credentials** from Console:
   - Account SID
   - Auth Token
   - Buy a phone number ($1/month)

3. **Add to .env**:
   ```env
   TWILIO_ACCOUNT_SID=AC[your_sid]
   TWILIO_AUTH_TOKEN=[your_auth_token]
   TWILIO_PHONE_NUMBER=+1234567890
   ```

**Skip Twilio?** Leave as placeholders - alerts will be logged instead of sent.

---

### Step 7: Configure Email (Optional - for Email Alerts)

#### Option A: Gmail

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" → "MemoryCare"
   - Copy the 16-character password

3. **Add to .env**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=[16_char_app_password]
   ```

#### Option B: SendGrid (Recommended for Production)

1. Sign up: https://sendgrid.com
2. Create API key
3. Use SendGrid SMTP settings

**Skip Email?** Leave as placeholders - alerts will be logged.

---

### Step 8: Frontend Environment Variables

Create frontend `.env.local`:

```bash
cd frontend
cp .env.example .env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MVP_MODE=false
```

---

## Supabase Database Setup

### Step 1: Create Supabase Project

1. **Go to**: https://supabase.com
2. **Sign up** / Sign in
3. **Create New Project**:
   - Organization: Create new or select existing
   - Name: `memorycare-platform`
   - Database Password: **SAVE THIS!** (Strong password, 20+ chars)
   - Region: Choose closest to you (e.g., `us-west-1`)
   - Pricing: Free tier (500MB database, 2GB bandwidth)
   - Click "Create new project"

4. **Wait 2-3 minutes** for project to provision

---

### Step 2: Get Database Connection String

1. **In Supabase Dashboard**, go to:
   - Settings (gear icon) → Database

2. **Connection String** section:
   - Mode: **Transaction**
   - Copy the connection string

3. **It looks like**:
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```

4. **Replace `[PASSWORD]`** with your database password from Step 1

5. **Add to `.env`**:
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```

---

### Step 3: Enable Required Extensions

1. **In Supabase Dashboard**, go to:
   - Database → Extensions

2. **Enable these extensions**:
   - ✅ `pgvector` - For vector embeddings (memory search)
   - ✅ `uuid-ossp` - For UUID generation
   - ✅ `pg_trgm` - For fuzzy text search

3. **Click enable** for each

---

### Step 4: Run Database Migrations

Now we'll create all the tables using Alembic migrations.

```bash
# Go to backend directory
cd /Users/erichillerbrand/CascadeProjects/windsurf-project-3/backend

# Activate virtual environment (if you have one)
# source venv/bin/activate

# Install dependencies (if not already done)
pip install -r requirements.txt

# Run migrations
alembic upgrade head
```

**Expected output**:
```
INFO  [alembic.runtime.migration] Running upgrade -> abc123, Initial tables
INFO  [alembic.runtime.migration] Running upgrade abc123 -> def456, Add storyline tables
...
```

**Verify in Supabase**:
- Go to Table Editor
- You should see tables: `users`, `patients`, `conversations`, `storylines`, etc.

---

### Step 5: Seed Initial Data (Optional)

Create a first user and patient for testing:

```bash
cd backend

# Create seed script
python scripts/seed_dev_data.py
```

Or manually via SQL in Supabase SQL Editor:

```sql
-- Create a test user
INSERT INTO users (email, hashed_password, full_name, role, is_active)
VALUES (
  'test@example.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eDzxN8YQgT8u', -- password: "test123"
  'Test User',
  'family_member',
  true
);

-- Create a test patient
INSERT INTO patients (user_id, dementia_stage, product_mode)
VALUES (
  (SELECT id FROM users WHERE email = 'test@example.com'),
  'moderate',
  'daily_ritual'
);
```

---

### Step 6: Set Up Row Level Security (RLS)

For production, enable Row Level Security:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables

-- Example policy: Users can only see their own data
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);
```

**For development**, you can disable RLS:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
-- etc.
```

---

### Step 7: Configure Supabase Storage (For Photos/Files)

1. **In Supabase Dashboard**, go to:
   - Storage

2. **Create new bucket**:
   - Name: `storyline-content`
   - Public: `No` (private bucket)
   - Click "Create bucket"

3. **Set up policies**:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'storyline-content');
   
   -- Allow users to view their own uploads
   CREATE POLICY "Users can view own files"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'storyline-content' AND owner = auth.uid());
   ```

4. **Update .env** with storage URL:
   ```env
   SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   SUPABASE_ANON_KEY=[your-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   ```

   Get these keys from: Settings → API

---

## API Keys & Services

### Complete .env Checklist

Here's your complete `.env` file template:

```env
# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
REDIS_URL=redis://localhost:6379

# ============================================================================
# AI & LLM
# ============================================================================
OPENAI_API_KEY=sk-proj-[YOUR_KEY]
OPENAI_MODEL=gpt-4-turbo-preview

# ============================================================================
# AUTHENTICATION & SECURITY
# ============================================================================
SECRET_KEY=[YOUR_GENERATED_SECRET_32_CHARS]
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ============================================================================
# SUPABASE
# ============================================================================
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# ============================================================================
# TWILIO (Optional - SMS Alerts)
# ============================================================================
TWILIO_ACCOUNT_SID=AC[your_sid]
TWILIO_AUTH_TOKEN=[your_token]
TWILIO_PHONE_NUMBER=+1234567890

# ============================================================================
# EMAIL (Optional - Email Alerts)
# ============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=[app_password_16_chars]

# ============================================================================
# SAFETY & MONITORING
# ============================================================================
CRISIS_KEYWORDS=["suicide", "kill myself", "end it all", "want to die", "hurt myself"]
DISTRESS_KEYWORDS=["fell", "can't breathe", "lost", "pain", "help me", "scared"]
MAX_INACTIVITY_HOURS=12

# ============================================================================
# VOICE & SPEECH (Optional)
# ============================================================================
WHISPER_MODEL=whisper-1
TTS_VOICE=alloy
TTS_SPEED=0.85

# ============================================================================
# FEATURE FLAGS
# ============================================================================
ENABLE_VOICE_RECORDING=false
ENABLE_OFFLINE_MODE=false
ENABLE_SMART_HOME_INTEGRATION=false

# ============================================================================
# REGULATORY & COMPLIANCE
# ============================================================================
REQUIRE_EXPLICIT_CONSENT=true
LOG_RETENTION_DAYS=90

# ============================================================================
# MVP MODE SETTINGS
# ============================================================================
MVP_MODE=false
MVP_STORE_TRANSCRIPTS=false
MVP_DEFAULT_RITUAL_DURATION=10
MVP_DEFAULT_RITUAL_TIME=09:00

# ============================================================================
# FRONTEND
# ============================================================================
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MVP_MODE=false
```

---

## Verification

### Step 1: Test Database Connection

```bash
cd backend

# Test connection
python -c "
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('✅ Database connected!')
"
```

---

### Step 2: Test OpenAI API

```bash
python -c "
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

response = client.chat.completions.create(
    model='gpt-3.5-turbo',
    messages=[{'role': 'user', 'content': 'Say hello!'}],
    max_tokens=10
)
print('✅ OpenAI connected!')
print(f'Response: {response.choices[0].message.content}')
"
```

---

### Step 3: Test Redis (if configured)

```bash
python -c "
import redis
import os
from dotenv import load_dotenv

load_dotenv()
r = redis.from_url(os.getenv('REDIS_URL'))
r.ping()
print('✅ Redis connected!')
"
```

---

### Step 4: Start Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test in browser**: http://localhost:8000/docs (API documentation)

---

### Step 5: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

**Expected output**:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Test in browser**: http://localhost:3000

---

## Troubleshooting

### Database Connection Errors

**Error**: `FATAL: password authentication failed`

**Solution**:
- Double-check password in `DATABASE_URL`
- Make sure you replaced `[PASSWORD]` with actual password
- Try resetting password in Supabase Settings → Database

---

**Error**: `could not connect to server`

**Solution**:
- Check your internet connection
- Verify Supabase project is running (green dot in dashboard)
- Try using direct connection string instead of pooler

---

### OpenAI API Errors

**Error**: `Incorrect API key provided`

**Solution**:
- Check that key starts with `sk-proj-` or `sk-`
- Regenerate key at https://platform.openai.com/api-keys
- Make sure no extra spaces in `.env` file

---

**Error**: `You exceeded your current quota`

**Solution**:
- Add billing info: https://platform.openai.com/account/billing
- Add credit to account
- Check usage limits

---

### Migration Errors

**Error**: `alembic.util.exc.CommandError: Can't locate revision`

**Solution**:
```bash
# Reset alembic
rm -rf alembic/versions/*.py
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

---

**Error**: `relation "users" already exists`

**Solution**:
```bash
# Drop all tables in Supabase SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Re-run migrations
alembic upgrade head
```

---

### Port Already in Use

**Error**: `Address already in use`

**Solution**:
```bash
# Find process using port 8000
lsof -ti:8000

# Kill the process
kill -9 [PID]

# Or use different port
uvicorn app.main:app --port 8001
```

---

## Next Steps

Once setup is complete:

1. ✅ **Create your first user** via API or SQL
2. ✅ **Test patient interaction** at http://localhost:3000/elder
3. ✅ **Explore API docs** at http://localhost:8000/docs
4. ✅ **Review agent architecture** in `CREWAI_AGENT_ARCHITECTURE.md`
5. ✅ **Set up storyline marketplace** following `STORYLINE_MARKETPLACE.md`

---

## Security Reminders

- ❌ **Never commit** `.env` to git
- ✅ **Rotate** the exposed OpenAI key in `.env.example`
- ✅ **Use strong passwords** for Supabase (20+ characters)
- ✅ **Enable RLS** in production
- ✅ **Set usage limits** on OpenAI to prevent unexpected charges
- ✅ **Backup** your database regularly (Supabase does this automatically)

---

## Cost Estimates (Monthly)

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| **Supabase** | 500MB DB, 2GB bandwidth | $0 (or $25/mo Pro) |
| **OpenAI API** | N/A | $20-50 (depends on usage) |
| **Redis Cloud** | 30MB | $0 (or local) |
| **Twilio** | $15 credit | ~$5/mo |
| **Total** | | **$25-75/mo** |

---

**Setup Complete!** 🎉

Your Memory Care Platform is now ready for development.
