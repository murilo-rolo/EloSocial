import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
print(f"Key loaded: {key[:5]}... (length: {len(key) if key else 0})")

if key:
    genai.configure(api_key=key)
    try:
        print("Available models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
    except Exception as e:
        print(f"Error: {str(e)}")
else:
    print("No key found in environment")
