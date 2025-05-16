import logging
from google import genai
from google.genai import types as google_config
from src.llm_config import genai_api_key, SAFE_SETTINGS, SYSTEM_INSTRUCTION


# Initialize the API client
class LlmClient:
    def __init__(self):
        try:
            self.client = genai.Client(api_key=genai_api_key)
            self.config = google_config.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                safety_settings=SAFE_SETTINGS,
                response_mime_type="application/json",
                top_k=1
            )
            logging.info("LLM component initialized successfully")
        except Exception as e:
            logging.error(f"Failed to configure LLM: {e}")

    def generate_content(self, content):
        try:
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=content,
                config=self.config,
            )
            logging.info("LLM response successfully generated")
            if response.text is None:
                logging.error("LLM response is None")
                return None
            return response
        except Exception as e:
            logging.error(f"Failed to generate content: {e}")
            return None
