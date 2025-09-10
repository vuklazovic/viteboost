import requests
import json

# Test basic connection
try:
    response = requests.get("http://127.0.0.1:8000/")
    print("Backend connection:", response.json())
except Exception as e:
    print("Backend connection failed:", e)

# Test upload endpoint with a simple test
try:
    # Create a small test image file
    from PIL import Image
    img = Image.new('RGB', (100, 100), color='red')
    img.save('test_image.jpg')
    
    # Try to upload it
    with open('test_image.jpg', 'rb') as f:
        files = {'file': ('test_image.jpg', f, 'image/jpeg')}
        response = requests.post("http://127.0.0.1:8000/upload", files=files)
        print("Upload response:", response.status_code, response.text)
        
        if response.status_code == 200:
            file_id = response.json()['file_id']
            # Test generation
            gen_response = requests.post(f"http://127.0.0.1:8000/generate?file_id={file_id}")
            print("Generate response:", gen_response.status_code, gen_response.text)
        
except Exception as e:
    print("Upload test failed:", e)