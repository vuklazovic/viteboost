import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# Test API key and basic text generation
key = os.getenv("GEMINI_API_KEY")
print(f"API Key exists: {bool(key)}")
print(f"API Key (first 10 chars): {key[:10] if key else 'None'}...")

try:
    client = genai.Client(api_key=key)
    
    # Test basic text generation first
    response = client.models.generate_content(
        model="gemini-2.0-flash-exp",
        contents="Say hello"
    )
    print("Text generation works:", response.text if hasattr(response, 'text') else "No text")
    
except Exception as e:
    print(f"Basic API test failed: {e}")

# Test with image if text works
try:
    from PIL import Image
    # Create a small test image
    img = Image.new('RGB', (100, 100), color='red')
    img.save('simple_test.jpg')
    
    with open('simple_test.jpg', 'rb') as f:
        image_data = f.read()
    
    response = client.models.generate_content(
        model="gemini-2.0-flash-exp",
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part(text="What color is this image?"),
                    types.Part(
                        inline_data=types.Blob(
                            mime_type="image/jpeg",
                            data=image_data
                        )
                    )
                ]
            )
        ]
    )
    print("Image analysis result:", response.text if hasattr(response, 'text') else str(response))
    
except Exception as e:
    print(f"Image test failed: {e}")