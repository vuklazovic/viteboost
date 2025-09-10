# VibeBoost Frontend V2 🚀

The most advanced React frontend for AI-powered product image transformation. Built with cutting-edge technologies and an aggressive, conversion-focused design system.

## ✨ Features

- **AI-Powered Image Generation**: Upload product images and get professional marketing variations
- **Dynamic Prompts**: AI analyzes your product and creates contextual prompts automatically  
- **Parallel Processing**: Generate up to 10 images simultaneously for maximum speed
- **Aggressive Design**: Built for conversions with bold CTAs and sales-focused messaging
- **Professional UI**: ShadCN UI components with custom variants and animations
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern Architecture**: TypeScript, React Query, and Vite for optimal performance

## 🎨 Design Philosophy

This frontend is designed with **conversion optimization** in mind:
- Bold, aggressive messaging that addresses pain points
- Strong CTAs that drive action
- Social proof and metrics prominently displayed  
- Professional yet approachable aesthetic
- Clear value propositions throughout the user journey

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
2. **AI Analysis**: Backend analyzes the image and generates dynamic prompts
3. **Generation**: Creates 10 professional variations using parallel processing  
4. **Download**: Download individual images or view them in full resolution
5. **Convert**: Use images across marketing channels to boost sales

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
│   ├── HeroSection.tsx    # Landing page hero
│   ├── UploadSection.tsx  # File upload & generation
│   ├── ImageGallery.tsx   # Generated images display
│   ├── ShowcaseSection.tsx # Before/after showcase
│   ├── FeaturesSection.tsx # Feature highlights
│   ├── TestimonialsSection.tsx # Social proof
│   ├── PricingSection.tsx # Pricing plans
│   └── CTASection.tsx     # Call-to-action
├── pages/             # Page components
├── lib/               # API clients and utilities
├── hooks/             # Custom React hooks
└── assets/            # Static assets & images
```

## 🎨 Design System

### Colors
- **Primary**: Purple-blue gradient system (`hsl(239 84% 67%)`)
- **Secondary**: Light purple gradients for backgrounds
- **Accent**: Pink accents for highlights

### Typography
- **Headings**: Bold, large text with gradient effects
- **Body**: Clean, readable text with proper contrast
- **CTAs**: Strong, action-oriented language

### Components
- **Buttons**: Multiple variants (hero, cta, premium) with hover effects
- **Cards**: Soft shadows with hover animations
- **Gradients**: Custom CSS gradients throughout the design

## 🔧 Configuration

The frontend automatically connects to your VibeBoost backend. Make sure:
- Backend is running on port 8000
- CORS is configured for frontend domain  
- All required environment variables are set in backend

## 📱 Key Features

### Upload Experience
- **Drag & Drop**: Smooth, intuitive file upload
- **Real-time Preview**: Immediate image preview after upload
- **Progress Tracking**: Animated progress bars during generation
- **Error Handling**: User-friendly error messages

### Gallery Experience  
- **Professional Layout**: Grid-based image gallery
- **Style Badges**: Clear labeling of image variations
- **Quick Actions**: Download and preview buttons
- **Prompt Display**: Show AI-generated prompts with copy functionality

### Conversion Features
- **Strong CTAs**: Multiple call-to-action buttons throughout
- **Social Proof**: Stats, testimonials, and success metrics
- **Urgency**: Time-sensitive language and scarcity messaging
- **Trust Signals**: Professional design and credibility indicators

## 🎯 Marketing Focus

This frontend is optimized for **sales conversion**:
- Addresses key pain points (expensive photography, time constraints)
- Emphasizes ROI and business benefits
- Uses aggressive, action-oriented language
- Includes clear value propositions
- Features social proof and success stories

## 💡 Pro Tips

- **A/B Testing**: Built-in support for testing different variations
- **Multi-Platform**: Optimized for social media, e-commerce, and advertising
- **Seasonal Campaigns**: Perfect for holiday and promotional periods
- **Analytics Ready**: Easy to integrate with tracking and analytics tools

## 🚀 Performance

- **Fast Loading**: Optimized images and lazy loading
- **Responsive**: Works on all devices and screen sizes  
- **Accessible**: Built with accessibility best practices
- **SEO Friendly**: Semantic HTML and meta tags

Built with modern web technologies and aggressive conversion optimization for maximum business impact.