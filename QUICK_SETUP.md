# Quick Setup Reference Card

**⚡ Fast track setup guide - bookmark this page!**

---

## 🔐 Required API Keys

### 1. OpenAI API Key
```
URL: https://platform.openai.com/api-keys
Cost: ~$20-50/month
Steps:
  1. Sign up / login
  2. Click "+ Create new secret key"
  3. Copy key (starts with sk-proj- or sk-)
  4. Add billing info + set $50 limit
  
.env variable: OPENAI_API_KEY=sk-proj-...
```

### 2. Supabase Database
```
URL: https://supabase.com
Cost: FREE (500MB) or $25/mo (8GB)
Steps:
  1. Create account
  2. "New Project" → name it "memorycare-platform"
  3. Choose region (us-west-1)
  4. Set strong password (SAVE IT!)
  5. Wait 2 minutes for provisioning
  
Get 3 values from Settings → Database & API:
  - DATABASE_URL (Transaction mode)
 
```

### 3. Secret Key (Generate Locally)
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

.env variable: SECRET_KEY=[output]
```

---

## ⚙️ .env Setup (10 minutes)

### Minimal .env (MVP Mode)
```env
# Required
DATABASE_URL=postgresql://postgres.[ref]:[pass]@....supabase.com:5432/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=[key]
OPENAI_API_KEY=sk-proj-[key]
SECRET_KEY=[generated_secret]

# Defaults (can use as-is)
REDIS_URL=redis://localhost:6379
OPENAI_MODEL=gpt-4-turbo-preview
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
MVP_MODE=false
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Optional Services
```env
# Twilio SMS (skip for now)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Gmail Alerts (skip for now)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=[app_password]
```

---

## 🗄️ Supabase Database Setup (5 minutes)

### 1. Enable Extensions
```
Dashboard → Database → Extensions
Enable:
  ✅ pgvector
  ✅ uuid-ossp
  ✅ pg_trgm
```

### 2. Run Migrations
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
```

### 3. Create Storage Bucket
```
Dashboard → Storage → New Bucket
  Name: storyline-content
  Public: No
```

---

## 🚀 Start Application

### Terminal 1: Backend
```bash
cd backend
uvicorn app.main:app --reload
# → http://localhost:8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## ✅ Quick Tests

### Test 1: Database
```bash
cd backend
python -c "from app.database import engine; from sqlalchemy import text; engine.connect().execute(text('SELECT 1')); print('✅ DB OK')"
```

### Test 2: OpenAI
```bash
python -c "from openai import OpenAI; import os; from dotenv import load_dotenv; load_dotenv(); OpenAI(api_key=os.getenv('OPENAI_API_KEY')).chat.completions.create(model='gpt-3.5-turbo', messages=[{'role':'user','content':'Hi'}], max_tokens=5); print('✅ OpenAI OK')"
```

### Test 3: API Docs
```
Open: http://localhost:8000/docs
Should see: FastAPI Swagger UI
```

### Test 4: Frontend
```
Open: http://localhost:3000
Should see: Home page
```

---

## 🔍 Where to Find Keys

| What | Where |
|------|-------|
| **OpenAI Key** | platform.openai.com/api-keys |
| **Supabase URL** | Dashboard → Settings → API → Project URL |
| **Supabase Anon Key** | Dashboard → Settings → API → anon public |
| **Supabase Service Key** | Dashboard → Settings → API → service_role (secret) |
| **Database URL** | Dashboard → Settings → Database → Connection string (Transaction) |
| **Gmail App Password** | myaccount.google.com/apppasswords |
| **Twilio Credentials** | console.twilio.com → Account Info |

---

## 🆘 Common Issues

### "Password authentication failed"
- Check DATABASE_URL password matches Supabase
- Reset password: Supabase → Settings → Database → Reset

### "Incorrect API key"
- Key must start with `sk-proj-` or `sk-`
- Regenerate at platform.openai.com/api-keys
- Check for spaces in .env

### "Port 8000 already in use"
```bash
lsof -ti:8000 | xargs kill -9
```

### "Module not found"
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### "Alembic can't locate revision"
```bash
cd backend
rm -rf alembic/versions/*.py
alembic revision --autogenerate -m "Initial"
alembic upgrade head
```

---

## 📋 Setup Checklist

- [ ] Created Supabase project
- [ ] Got DATABASE_URL from Supabase
- [ ] Enabled pgvector, uuid-ossp, pg_trgm extensions
- [ ] Created OpenAI account + API key
- [ ] Added billing to OpenAI (required!)
- [ ] Generated SECRET_KEY locally
- [ ] Created `.env` file (copy from `.env.example`)
- [ ] Filled in all required keys in `.env`
- [ ] Created `frontend/.env.local`
- [ ] Ran `pip install -r requirements.txt`
- [ ] Ran `alembic upgrade head`
- [ ] Tested database connection
- [ ] Tested OpenAI API
- [ ] Started backend (port 8000)
- [ ] Started frontend (port 3000)
- [ ] Accessed http://localhost:8000/docs
- [ ] Accessed http://localhost:3000

---

## 💰 Cost Calculator

**Minimum (Development)**:
- Supabase: $0 (free tier)
- OpenAI: ~$20/mo (light testing)
- **Total: $20/mo**

**Recommended (Development)**:
- Supabase Pro: $25/mo (more DB space)
- OpenAI: ~$50/mo (moderate testing)
- Redis Cloud: $0 (free tier)
- **Total: $75/mo**

**Production (100 patients)**:
- Supabase Pro: $25/mo
- OpenAI: $200-500/mo (depends on usage)
- Twilio: ~$50/mo
- Redis: $15/mo
- **Total: $290-590/mo**

---

## 📚 Next Steps

After setup complete:

1. Read: `SETUP_GUIDE.md` (full detailed guide)
2. Read: `CREWAI_AGENT_ARCHITECTURE.md` (how agents work)
3. Read: `STORYLINE_MARKETPLACE.md` (upsell modules)
4. Test: Create a user via API
5. Test: Try `/elder` page (MVP ritual interface)
6. Explore: API docs at `/docs`

---

**Setup time: ~30 minutes** ⏱️

**Need help?** See full `SETUP_GUIDE.md` for detailed troubleshooting.
