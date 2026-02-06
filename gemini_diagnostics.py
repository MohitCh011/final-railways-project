import os
import google.generativeai as genai
from dotenv import load_dotenv

def diagnose():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key or api_key == "your_api_key_here":
        print("ERROR: No API key found in .env")
        return

    print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}")
    
    try:
        genai.configure(api_key=api_key)
        
        print("\n--- Listing Available Models ---")
        models = genai.list_models()
        available_names = []
        for m in models:
            available_names.append(m.name)
            print(f"- {m.name} (Supports: {m.supported_generation_methods})")
            
        print("\n--- Testing Model Initialization ---")
        test_model_names = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'models/gemini-1.5-flash']
        
        for name in test_model_names:
            try:
                print(f"Testing {name}...")
                model = genai.GenerativeModel(name)
                response = model.generate_content("Hi")
                print(f"SUCCESS: {name} generated: {response.text[:20]}...")
            except Exception as e:
                print(f"FAILED: {name} - {e}")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    diagnose()
