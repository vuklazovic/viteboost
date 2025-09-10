# VibeBoost - AI Product Image Generator

## Original Idea
<idea>
Build a saas platform called vibeboost. This platform will help users create bunch of images of their products for 
instagram, catalogs, website etc. So user can send one or multiple products, our system will use gemini flash 2.5 banana 
to create those images. Website must be clean, good looking and profesional with marketing hooks. i want to use fastapi on the backend. 
i dont have preference on frontend. for auth we will use supabase
</idea>

## MVP Development Plan

### Tech Stack
- Backend: FastAPI + Python
- Frontend: React + TypeScript
- AI: Google Gemini Flash 2.5
- Storage: Local/temporary file storage
- **Auth: Skip for MVP** (implement later)

### Core MVP Features
1. **Product Upload** - Simple drag & drop interface for product images
2. **AI Image Generation** - Gemini Flash 2.5 creates marketing variations
3. **Image Gallery** - Display generated images with download options
4. **Landing Page** - Clean marketing site with conversion hooks

### Project Structure
```
vibeboost/
├── backend/          # FastAPI app with upload & generation endpoints
├── frontend/         # React app with upload UI
└── requirements/     # Dependencies
```

for backend use conda
### how to implement gemini
This is tested way to use gemini to generate pictures, be sure to implement this as it is.
just load key from environemnt. you can make little changes to this code but never change model from gemini-2.5-flash-image-preview
use google-genai==1.35.0
<code>
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

client = genai.Client(api_key=key)

prompt = (
    "Create a picture of my cat eating a nano-banana in a "
    "fancy restaurant under the Gemini constellation",
)

image = Image.open("image.png")

response = client.models.generate_content(
    model="gemini-2.5-flash-image-preview",
    contents=[prompt, image],
)

for part in response.candidates[0].content.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = Image.open(BytesIO(part.inline_data.data))
        image.save("generated_image.png")
</code>

### User Flow (No Auth)
1. User visits landing page
2. User uploads product image via drag & drop
3. AI generates variations (e-commerce, Instagram, catalog styles)
4. User views generated images in gallery
5. User downloads desired images

### Development Tasks
- [ ] Set up project structure with FastAPI backend and frontend
- [ ] Create product image upload endpoint and storage
- [ ] Integrate Gemini Flash 2.5 for image generation
- [ ] Build basic frontend UI for upload and image display
- [ ] Create landing page with marketing hooks
- [ ] Set up basic deployment configuration

