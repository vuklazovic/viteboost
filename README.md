# VibeBoost - AI Product Image Generator

Transform your product photos into stunning marketing visuals with AI-powered generation using Google Gemini Flash 2.5.

## 🚀 Features

- **Drag & Drop Upload**: Simple product image upload interface
- **AI Image Generation**: Creates 3 professional variations:
  - 🛍️ **E-Commerce Style**: Clean white background, perfect for online stores
  - 📸 **Instagram Style**: Trendy lifestyle shots for social media
  - 📋 **Catalog Style**: Professional documentation and brochures
- **Image Gallery**: Display and download generated images
- **Clean UI**: Professional marketing-focused interface

## 🛠️ Tech Stack

- **Backend**: FastAPI + Python (Conda environment)
- **Frontend**: React + TypeScript + Vite
- **AI**: Google Gemini Flash 2.5
- **Storage**: Local file storage

## 📋 Prerequisites

- **Conda/Anaconda** installed
- **Node.js** and npm installed
- **Google Gemini API Key** (get from [Google AI Studio](https://aistudio.google.com/app/apikey))

## 🔧 Quick Setup

### Option 1: Automated Setup (Windows)

1. **Run the setup script:**
   ```batch
   setup.bat
   ```

2. **Add your Gemini API key:**
   - Edit `backend/.env`
   - Add: `GEMINI_API_KEY=your_actual_api_key_here`

3. **Start the application:**
   ```batch
   start.bat
   ```

### Option 2: Manual Setup

1. **Create conda environment:**
   ```bash
   conda env create -f backend/environment.yml
   conda activate vibeboost
   ```

2. **Set up environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

4. **Start backend:**
   ```bash
   cd backend
   conda activate vibeboost
   python main.py
   ```

5. **Start frontend (new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

## 🌐 Usage

1. Visit `http://localhost:3000`
2. Drag and drop your product image
3. Click "Generate AI Marketing Images"
4. Download your professional variations

## 📁 Project Structure

```
vibeboost/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── image_generator.py   # Gemini integration
│   ├── environment.yml      # Conda dependencies
│   └── .env.example        # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.tsx        # Main app
│   │   └── main.tsx       # Entry point
│   └── package.json       # NPM dependencies
├── setup.bat              # Automated setup
└── start.bat             # Application launcher
```

## 🔑 Environment Variables

Create `backend/.env` with:
```
GEMINI_API_KEY=your_gemini_api_key_here
INITIAL_CREDITS=100
CREDIT_COST_PER_IMAGE=1
NUM_IMAGES=3
```

## 🗄️ Supabase Setup (Credits)

Run the migration SQL in your Supabase SQL editor:

- File: `backend/db/migrations/001_create_user_credits.sql`
- This creates `public.user_credits` with `user_id uuid primary key`, `credits integer`, timestamps, and enables RLS (no anon access).
- The backend uses the Service Role key to manage balances.

On backend startup, a warning is logged if the table is missing with the path to this migration.

## 🐛 Troubleshooting

**Backend not starting:**
- Ensure conda environment is activated: `conda activate vibeboost`
- Check if GEMINI_API_KEY is set in backend/.env

**Frontend connection errors:**
- Make sure backend is running on port 8000
- Check browser console for CORS errors

**Gemini API errors:**
- Verify your API key is valid
- Check API quota and billing status

## 🎯 User Flow

1. User visits landing page
2. User uploads product image via drag & drop
3. AI generates 3 variations (e-commerce, Instagram, catalog styles)
4. User views generated images in gallery
5. User downloads desired images

## 📝 Notes

- Uses exact Gemini implementation as specified
- Model: `gemini-2.5-flash-image-preview`
- Package: `google-genai==1.35.0`
- No authentication required for MVP
