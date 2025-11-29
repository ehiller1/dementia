# Frontend Setup Guide

## Prerequisites

Make sure you have npm installed via Homebrew:

```bash
# Check if npm is installed
which npm
# Should show: /opt/homebrew/bin/npm (or /usr/local/bin/npm on Intel Macs)

# Check npm version
npm --version
# Should be version 8.0.0 or higher
```

If npm is not installed:
```bash
brew install node
```

---

## Setup Instructions

### 1. Navigate to Frontend Directory

```bash
cd /Users/erichillerbrand/CascadeProjects/windsurf-project-3/frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Radix UI components
- Lucide icons
- And all other dependencies

**Note**: This may take 2-3 minutes on first install.

### 3. Start Development Server

```bash
npm run dev
```

The frontend will start on **http://localhost:3000**

---

## Available Routes

Once running, you can access:

### MVP Mode (Daily Ritual)
- **Elder Interface**: http://localhost:3000/elder
  - One-button "Start My Visit" interface
  - Large text, voice-first design

### Comprehensive Mode
- **Home Page**: http://localhost:3000
- **Patient Interface**: http://localhost:3000/patient
  - Full conversation interface
- **Caregiver Dashboard**: http://localhost:3000/caregiver
  - Analytics, alerts, patient management

---

## Troubleshooting

### Issue: "Cannot find module 'react'"

**Solution**: Run `npm install` in the frontend directory

```bash
cd frontend
npm install
```

### Issue: Port 3000 already in use

**Solution**: Kill the existing process or use a different port

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# OR use a different port
npm run dev -- -p 3001
```

### Issue: TypeScript errors

**Solution**: These will auto-resolve after npm install. If they persist:

```bash
npm run build
# Check for any actual errors
```

### Issue: Homebrew npm not found

**Solution**: Add Homebrew to your PATH

```bash
# For Apple Silicon Macs (M1/M2/M3)
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For Intel Macs
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## Development Workflow

### Hot Reload
The dev server supports hot reload. Changes to files will automatically refresh the browser.

### File Watching
- Edit any `.tsx`, `.ts`, `.css` file
- Save the file
- Browser auto-refreshes

### Backend Integration
The frontend is configured to connect to the backend at:
- **API URL**: http://localhost:8000

Make sure the backend is running:
```bash
cd ../backend
uvicorn app.main:app --reload
```

---

## Scripts Reference

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MVP_MODE=false
```

These override the defaults in `next.config.js`.

---

## Quick Start (All Commands)

```bash
# 1. Install dependencies
cd /Users/erichillerbrand/CascadeProjects/windsurf-project-3/frontend
npm install

# 2. Start dev server
npm run dev

# 3. Open browser
open http://localhost:3000
```

---

## Verifying Setup

Once `npm run dev` is running, you should see:

```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

Then visit:
- http://localhost:3000 → Home page ✓
- http://localhost:3000/elder → MVP interface ✓
- http://localhost:3000/patient → Patient interface ✓
- http://localhost:3000/caregiver → Caregiver dashboard ✓

---

## Common Next.js Dev Commands

```bash
# Clear Next.js cache
rm -rf .next

# Fresh install
rm -rf node_modules package-lock.json
npm install

# Check for outdated packages
npm outdated

# Update packages
npm update
```

---

## Performance Tips

### Faster Rebuilds
Next.js 14 uses Turbopack by default in dev mode for faster builds.

### Memory Issues
If you encounter memory issues:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

---

## IDE Integration

### VS Code
The project includes TypeScript and ESLint configs. VS Code will:
- Show type errors inline
- Auto-format with Prettier (if installed)
- Provide autocomplete for React/Next.js

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier

---

## Need Help?

If `npm run dev` doesn't work:

1. **Check npm installation**:
   ```bash
   which npm
   npm --version
   ```

2. **Check Node.js version** (should be 18+):
   ```bash
   node --version
   ```

3. **Clear everything and reinstall**:
   ```bash
   rm -rf node_modules .next package-lock.json
   npm install
   npm run dev
   ```

4. **Check for port conflicts**:
   ```bash
   lsof -i :3000
   ```

---

**You're all set!** 🚀

Run `npm run dev` and the frontend will be available at http://localhost:3000
