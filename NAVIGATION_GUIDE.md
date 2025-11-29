# Navigation Guide - Memory Care Companion

## Main Routes & Access Points

### 🏠 Homepage (`/`)
**Access:** Direct URL or click "Memory Care" logo in navigation
- 4 main cards:
  - **For Patients** → `/patient`
  - **Caregiver Dashboard** → `/caregiver`
  - **Family Training** (MOBILE OPTIMIZED) → `/training`
  - **Storylines** → `/marketplace`

### 👤 Patient Interface (`/patient`)
**Access:** Click "For Patients" card from homepage
- Main chat interface with AI companion
- Quick action links:
  - Play Activities → `/patient/activities`
  - View Memories → `/patient/memories`

### 👨‍👩‍👧 Caregiver Dashboard (`/caregiver`)
**Access:** Click "Caregiver Dashboard" card from homepage
- Patient cards with "Details" button (opens modal)
- Quick actions:
  - Family Training → `/training` (with NEW badge)
  - Manage Reminders → `/caregiver/reminders`
  - Memory Book → `/caregiver/memories`
  - Reports → `/caregiver/reports`
  - Settings → `/caregiver/settings`

### 📚 Family Training Module (`/training`)
**Access Multiple Ways:**
1. Click "Family Training" card on homepage (MOBILE OPTIMIZED badge)
2. Click "Family Training" in top navigation bar
3. From caregiver dashboard quick actions
4. From patient details modal

**Features:**
- ✅ Mobile responsive design
- Practice conversations with AI feedback
- Learn SPECAL principles
- View good/bad examples
- 7-minute ideal visit guide

### 📊 Caregiver Sub-Pages

#### Reminders (`/caregiver/reminders`)
- Add/edit/delete reminders
- Daily schedule view
- Quick add common reminders
- Medication, meals, hydration, activities

#### Memory Book (`/caregiver/memories`)
- Upload photos and stories
- Tag and categorize memories
- Search functionality

#### Reports (`/caregiver/reports`)
- Weekly activity charts
- Sentiment analysis
- Top conversation topics
- Engagement insights

#### Settings (`/caregiver/settings`)
- Profile information
- Notification preferences
- Voice settings
- Privacy controls

### 🎨 Patient Sub-Pages

#### Activities (`/patient/activities`)
- Listen to Music
- Memory Games
- Story Time
- Art & Colors
- Relaxation
- Daily Routine

#### Memories (`/patient/memories`)
- Photo gallery view
- View memory details
- Related memories

## Global Navigation Bar

**Desktop:**
- Home | For Patients | Caregivers | **Family Training** | Storylines

**Mobile:**
- Hamburger menu with all routes
- Family Training button highlighted

## Quick Access Summary

### For Family Members Learning to Care:
1. **Homepage** → Click "Family Training" (purple gradient card)
2. **Top Nav** → Click "Family Training" button
3. **Mobile** → Menu → "Family Training (Mobile Optimized)"

### For Caregivers Managing Care:
1. **Homepage** → Click "Caregiver Dashboard"
2. **Patient Details** → Click any "Details" button
3. **Quick Actions** → Access all sub-features

### For Patients:
1. **Homepage** → Click "For Patients"
2. **Chat Interface** → Start talking
3. **Quick Actions** → Activities or Memories

## Troubleshooting

### 404 Errors
If you get 404 errors:
1. **Restart dev server:** Stop (Ctrl+C) and run `npm run dev` again
2. **Clear cache:** Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
3. **Check URL:** Ensure correct path (e.g., `/caregiver/reports` not `/reports`)

### Navigation Not Showing
- Navigation bar is added to all pages via `layout.tsx`
- If missing, check that app is running from `/frontend` directory
