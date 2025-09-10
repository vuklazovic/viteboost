# VibeBoost Frontend

A modern, professional React application for AI-powered product image transformation. Built with cutting-edge technologies and a beautiful design system.

## ✨ Features

- **AI-Powered Image Generation**: Upload product images and generate professional marketing variations
- **Dynamic Prompts**: AI analyzes your product and creates contextual prompts automatically  
- **Parallel Processing**: Generate up to 10 images simultaneously for maximum speed
- **Professional UI**: Built with ShadCN UI components and Tailwind CSS
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern Architecture**: TypeScript, React Query for state management, and Vite for development

## 🚀 Getting Started

### Prerequisites

Make sure your VibeBoost backend is running on `http://127.0.0.1:8000` with:
- `NUM_IMAGES=10` in your `.env` file
- Gemini API key configured

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

### Build for Production

```bash
npm run build
npm run preview
```

## 🎯 How It Works

1. **Upload**: Drag & drop or select your product image
2. **AI Analysis**: Our backend analyzes the image and generates dynamic prompts
3. **Generation**: Creates 10 professional variations using parallel processing
4. **Download**: Download individual images or view them in full resolution

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + ShadCN UI components
- **State Management**: TanStack Query
- **Build Tool**: Vite
- **File Upload**: React Dropzone
- **HTTP Client**: Axios
- **Notifications**: Sonner
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # ShadCN UI components
│   ├── Hero.tsx       # Landing page hero
│   ├── UploadSection.tsx  # File upload & generation
│   └── ImageGallery.tsx   # Generated images display
├── pages/             # Page components
├── lib/               # API clients and utilities
├── hooks/             # Custom React hooks
└── assets/            # Static assets
```

## 🎨 Design System

The application uses a professional design system with:
- **Colors**: Blue-purple gradient theme
- **Typography**: Inter font family
- **Components**: ShadCN UI with Radix primitives
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first approach

## 🔧 Configuration

The frontend automatically connects to your VibeBoost backend. Make sure:
- Backend is running on port 8000
- CORS is configured for frontend domain
- All required environment variables are set in backend

## 📱 Features

- **Drag & Drop Upload**: Intuitive file upload experience
- **Real-time Progress**: Shows generation progress with animated indicators
- **Image Preview**: Preview uploaded images before processing
- **Batch Download**: Download all generated images
- **Copy Prompts**: Copy AI-generated prompts to clipboard
- **Responsive Gallery**: Beautiful grid layout for all screen sizes
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🎯 Pro Tips

The application includes built-in marketing guidance:
- A/B test different styles across platforms
- Use variations for different social media channels
- Perfect for seasonal campaigns and promotions

Built with modern web technologies and professional UX patterns for the best possible user experience.