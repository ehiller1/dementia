# Vercel Deployment Guide

## Issue: 404 NOT_FOUND Error

The error occurs because this is a **monorepo** with both backend and frontend. Vercel needs explicit configuration to know:
- Which directory contains the Next.js app (`frontend/`)
- Where to run build commands
- How to handle the project structure

---

## Solution Options

### Option 1: Deploy Frontend Only (Recommended for Quick Start)

**Step 1: Create New Vercel Project**

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repo: `ehiller1/dementia`

**Step 2: Configure Root Directory**

When setting up the project in Vercel:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend` ⬅️ **IMPORTANT**
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

**Step 3: Environment Variables**

Add in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

**Step 4: Deploy**

Click **"Deploy"** - Vercel will now build only the frontend directory.

---

### Option 2: Use vercel.json (Already Created)

I've created `vercel.json` at the root with configuration that tells Vercel to:
- Build from the `frontend/` directory
- Use Next.js framework
- Output to `frontend/.next`

**Commit and push the vercel.json:**

```bash
cd /Users/erichillerbrand/CascadeProjects/windsurf-project-3
git add vercel.json VERCEL_DEPLOYMENT.md
git commit -m "Add Vercel configuration for frontend deployment"
git push
```

Then redeploy in Vercel (it should auto-deploy on push).

---

### Option 3: Separate Repositories (Production Best Practice)

For production, consider:

1. **Frontend Repo**: Deploy to Vercel
   - Contains only `frontend/` contents
   - Clean Next.js deployment
   
2. **Backend Repo**: Deploy to Railway, Render, or Fly.io
   - Contains only `backend/` contents
   - Python/FastAPI deployment

**To split the repo:**

```bash
# Create frontend-only repo
cd ~/temp
git clone https://github.com/ehiller1/dementia.git dementia-frontend
cd dementia-frontend
# Keep only frontend directory
mv frontend/* .
rm -rf frontend backend
git add .
git commit -m "Frontend only"
git push

# Create backend-only repo
cd ~/temp
git clone https://github.com/ehiller1/dementia.git dementia-backend
cd dementia-backend
# Keep only backend directory
mv backend/* .
rm -rf frontend backend
git add .
git commit -m "Backend only"
git push
```

---

## Backend Deployment (Required for Full Functionality)

Your frontend needs the backend API running. Options:

### Railway (Easiest for Python)

1. Go to https://railway.app
2. **New Project** → **Deploy from GitHub**
3. Select `ehiller1/dementia`
4. **Root Directory**: `backend`
5. Railway auto-detects Python/FastAPI
6. Set environment variables (DATABASE_URL, OPENAI_API_KEY, etc.)
7. Deploy

### Render

1. Go to https://render.com
2. **New** → **Web Service**
3. Connect GitHub repo
4. **Root Directory**: `backend`
5. **Build Command**: `pip install -r requirements.txt`
6. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Set environment variables
8. Deploy

### Fly.io

```bash
cd backend
fly launch
fly deploy
```

---

## Current Project Structure

```
windsurf-project-3/
├── frontend/          ← Next.js app (deploy to Vercel)
│   ├── app/
│   ├── package.json
│   └── next.config.js
├── backend/           ← FastAPI app (deploy to Railway/Render)
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── vercel.json        ← Tells Vercel to use frontend/
└── README.md
```

---

## Quick Fix Steps

**1. Commit vercel.json:**
```bash
git add vercel.json VERCEL_DEPLOYMENT.md
git commit -m "Add Vercel configuration"
git push
```

**2. In Vercel Dashboard:**
- Go to your project settings
- **General** → **Root Directory**
- Set to: `frontend`
- Click **Save**

**3. Redeploy:**
- **Deployments** tab
- Click **"..."** on latest deployment
- Click **"Redeploy"**

---

## Environment Variables for Vercel

Add these in **Vercel Dashboard → Settings → Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Once backend is deployed (Railway/Render), update this URL.

---

## Expected Results

✅ **Frontend on Vercel**: 
- URL: `https://dementia-xyz.vercel.app`
- All pages render
- UI fully functional
- API calls will fail until backend is deployed

✅ **Backend on Railway/Render**:
- URL: `https://dementia-backend.railway.app`
- API responds to requests
- Database connected
- CrewAI agents operational

✅ **Connect Them**:
- Update `NEXT_PUBLIC_API_URL` in Vercel
- Frontend can now call backend API
- Full system operational

---

## Testing After Deployment

**Frontend Test:**
```
Visit: https://your-app.vercel.app
Should see: Home page with 3 main cards
```

**Backend Test:**
```bash
curl https://your-backend-url.com/
# Should return: {"status":"healthy","service":"Memory Care Companion API"}
```

**Full Integration Test:**
```
1. Visit frontend
2. Click "Elder (MVP Mode)"
3. Start a ritual
4. Speak or type
5. Should get AI response (if backend connected)
```

---

## Common Vercel Errors

### Error: "No Next.js app found"
**Fix**: Set Root Directory to `frontend` in Vercel settings

### Error: "Build failed: npm not found"
**Fix**: Ensure `package.json` exists in root directory specified

### Error: "API calls failing (CORS)"
**Fix**: Backend needs CORS configuration:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Recommended Production Setup

**Frontend**: Vercel (free tier works)
- Automatic deployments on push
- Global CDN
- Perfect for Next.js

**Backend**: Railway (starts free, scales easily)
- Python/FastAPI optimized
- PostgreSQL included
- Easy environment variable management

**Database**: Railway PostgreSQL or Supabase
- Production-ready
- Automated backups
- Easy scaling

---

## Summary

**Immediate Fix:**
1. ✅ Created `vercel.json` (commit & push)
2. ✅ Set Root Directory to `frontend` in Vercel dashboard
3. ✅ Redeploy

**Next Steps:**
1. Deploy backend to Railway/Render
2. Update `NEXT_PUBLIC_API_URL` in Vercel
3. Test full system

**Need Help?**
Check Vercel deployment logs for specific errors:
- Vercel Dashboard → Your Project → Deployments → Click deployment → View logs
