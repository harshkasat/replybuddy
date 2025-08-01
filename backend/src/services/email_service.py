import logging
import json
from src.services import EMAIL_SERVICE_PROMPT
from src.llm_config.config import LlmClient
from src.utils.pydantic_schema import PrevConservation

INSTRUCTION = """<instructions> tell more how my project can algin with this company tell more project to make connection between company <instruction/>"""

class EmailService(LlmClient):

    async def email_service(
        self, comapany_info: str, prev_conservation: PrevConservation = None
    ):
        try:
            with open("src/llm_config/guide.md", "r") as file:
                breif_intro = file.read()
        except FileNotFoundError:
            logging.warning("guide.md file not found, using empty brief intro")
            breif_intro = ""
        try:
            if prev_conservation:
                prev_conservation = EMAIL_SERVICE_PROMPT.format(
                    prev_conservations=prev_conservation, breif_intro=breif_intro
                )
            email_service_prompt = EMAIL_SERVICE_PROMPT.format(
                breif_intro=breif_intro, prev_conservations=prev_conservation
            )
            response = await self.generate_content(
                content=email_service_prompt + comapany_info + INSTRUCTION,
            )
            return json.loads(response.text)
        except Exception as e:
            logging.error(f"Failed to generate email service content: {e}")
            return None
