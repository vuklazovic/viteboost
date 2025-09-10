import os
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO
from pathlib import Path
import uuid
from typing import List
import asyncio
import concurrent.futures
import time

GENERATED_DIR = Path("generated")

async def analyze_image_and_generate_prompts(client, image_path: str, num_prompts: int) -> List[str]:
    """Analyze the uploaded image and generate dynamic prompts based on its content"""
    try:
        image = Image.open(image_path)
        
        analysis_prompt = f"""Analyze this image carefully and identify:
1. What type of product this is
2. The style/aesthetic of the product
3. Key visual characteristics
4. Potential target audience/market

Based on your analysis, create {num_prompts} different image generation prompts that would be perfect for marketing this specific product. Each prompt should:
- Be specific to the product type and style you identified
- Target different marketing contexts (e.g., lifestyle, product showcase, social media, e-commerce, advertising, catalog, artistic, minimalist, luxury, casual)
- Include relevant styling, lighting, and background suggestions
- Be optimized for creating appealing marketing visuals
- Be diverse and offer different creative approaches

Return only the {num_prompts} prompts, one per line, without any additional text or numbering."""

        response = client.models.generate_content(
            model="gemini-2.5-flash-image-preview",
            contents=[analysis_prompt, image]
        )
        
        if response.text:
            prompts = [prompt.strip() for prompt in response.text.strip().split('\n') if prompt.strip()]
            # Ensure we have exactly the requested number of prompts
            if len(prompts) >= num_prompts:
                return prompts[:num_prompts]
            elif len(prompts) > 0:
                # If we got fewer prompts, pad with variations
                while len(prompts) < num_prompts:
                    prompts.append(prompts[len(prompts) % len(prompts)])  # Cycle through existing prompts
                return prompts[:num_prompts]
        
    except Exception as e:
        print(f"Error analyzing image for prompts: {e}")
    
    # Fallback to generic prompts if analysis fails
    generic_prompts = [
        "Create a professional product photo with clean background and studio lighting",
        "Create a lifestyle photo showing this product in use in a natural, appealing setting",
        "Create an Instagram-style aesthetic photo with trendy background and natural lighting",
        "Create a minimalist product shot with elegant composition and soft shadows",
        "Create an e-commerce catalog photo with multiple angles and detailed view",
        "Create an artistic product photo with creative lighting and unique perspective",
        "Create a luxury brand style photo with premium feel and sophisticated background",
        "Create a casual everyday use photo showing the product in real-life context",
        "Create a social media ready photo with vibrant colors and eye-catching composition",
        "Create a marketing advertisement style photo with professional presentation"
    ]
    
    # Return the requested number of generic prompts
    while len(generic_prompts) < num_prompts:
        generic_prompts.extend(generic_prompts[:num_prompts - len(generic_prompts)])
    
    return generic_prompts[:num_prompts]

async def generate_images(image_path: str, file_id: str) -> List[dict]:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY environment variable is required")
    
    # Get number of images from environment variable, default to 3
    num_images = int(os.getenv("NUM_IMAGES", "3"))
    print(f"Generating {num_images} images...")
    
    try:
        client = genai.Client(api_key=key)
        
        # First test basic API connectivity
        test_response = client.models.generate_content(
            model="gemini-2.5-flash-image-preview",
            contents="Say hello"
        )
        print(f"API test successful: {test_response.text}")
        
    except Exception as e:
        print(f"API connection failed: {e}")
        # Return mock data for now
        mock_files = []
        for i in range(num_images):
            mock_files.append({
                "filename": f"{file_id}_mock_{i+1}.png",
                "url": f"/generated/{file_id}_mock_{i+1}.png",
                "style": f"style_{i+1}",
                "description": f"Mock image {i+1} - API unavailable"
            })
        return mock_files
    
    # Generate dynamic prompts based on image analysis
    prompts = await analyze_image_and_generate_prompts(client, image_path, num_images)
    print("=== Generated Dynamic Prompts ===")
    for i, prompt in enumerate(prompts, 1):
        print(f"Prompt {i}: {prompt}")
    print("===============================")
    
    def generate_single_image_sync(prompt: str, index: int):
        """Synchronous function to generate a single image"""
        try:
            # Create a separate client for each thread to avoid conflicts
            thread_client = genai.Client(api_key=key)
            image = Image.open(image_path)
            
            print(f"Starting generation for image {index+1}...")
            start_time = time.time()
            
            response = thread_client.models.generate_content(
                model="gemini-2.5-flash-image-preview",
                contents=[prompt, image],
            )
            
            for part in response.candidates[0].content.parts:
                if part.text is not None:
                    print(f"Generated text response: {part.text}")
                elif part.inline_data is not None:
                    generated_image = Image.open(BytesIO(part.inline_data.data))
                    
                    filename = f"{file_id}_generated_{index+1}.png"
                    output_path = GENERATED_DIR / filename
                    generated_image.save(output_path)
                    
                    elapsed = time.time() - start_time
                    print(f"Generated image {index+1}: {filename} (took {elapsed:.2f}s)")
                    return {
                        "filename": filename,
                        "url": f"/generated/{filename}",
                        "style": f"style_{index+1}",
                        "description": prompt
                    }
        
        except Exception as e:
            print(f"Error generating image {index+1}: {str(e)}")
            return None
    
    # Use ThreadPoolExecutor for true parallel execution
    print(f"Starting parallel generation of {len(prompts)} images...")
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(prompts), 10)) as executor:
        # Submit all tasks
        future_to_index = {executor.submit(generate_single_image_sync, prompt, i): i 
                          for i, prompt in enumerate(prompts)}
        
        generated_files = []
        for future in concurrent.futures.as_completed(future_to_index):
            result = future.result()
            if result:
                generated_files.append(result)
    
    total_time = time.time() - start_time
    print(f"All {len(generated_files)} images generated in {total_time:.2f}s (parallel execution)")
    
    return generated_files