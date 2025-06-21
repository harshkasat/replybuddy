import logging
from google import genai
from google.genai import types as google_config
from src.llm_config import genai_api_key, SAFE_SETTINGS, SYSTEM_INSTRUCTION


# Custom Exception Classes
class LlmInitializationError(RuntimeError):
    """Custom exception for LLM client initialization errors."""
    pass


class LlmGenerationError(Exception):
    """Custom exception for errors during LLM content generation."""
    pass

# Initialize the API client
class LlmClient:
    def __init__(self):
        try:
            try:
                with open("src\llm_config\guide.md", "r") as file:
                    breif_intro = file.read()
            except FileNotFoundError:
                logging.warning("guide.md file not found, using empty brief intro")
                breif_intro = ""
            self.client = genai.Client(api_key=genai_api_key)
            self.config = google_config.GenerateContentConfig(
                # system_instruction=SYSTEM_INSTRUCTION.format(breif_intro=breif_intro),
                safety_settings=SAFE_SETTINGS,
                response_mime_type="application/json",
                top_k=1
            )
            logging.info("LLM component initialized successfully")
        except Exception as e:
            logging.error(f"Failed to configure LLM: {e}")
            raise LlmInitializationError("Failed to initialize LLM client") from e

    async def generate_content(self, content):
        try:
            response = await self.client.aio.models.generate_content(
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
            raise LlmGenerationError("Failed to generate content from LLM") from e


    async def generalize_content(self, content):
        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-2.0-flash",
                contents=content,
                config=google_config.GenerateContentConfig(
                    response_mime_type="application/json",
                    safety_settings=SAFE_SETTINGS,
                )
            )
            logging.info("LLM response successfully generated")
            if response.text is None:
                logging.error("LLM response is None")
                return None
            return response
        except Exception as e:
            logging.error(f"Failed to generate content: {e}")
            raise LlmGenerationError("Failed to generalize content from LLM") from e
