import logging
import json
from src.services import EMAIL_SERVICE_PROMPT
from src.llm_config.config import LlmClient
from src.utils.pydantic_schema import PrevConservation


class EmailService(LlmClient):

    def email_service(self, comapany_info:str, prev_conservation:PrevConservation = None):
        try:
            if prev_conservation:
                prev_conservation = EMAIL_SERVICE_PROMPT.format(
                    prev_conservations=prev_conservation)
            response = self.generate_content(
                content=EMAIL_SERVICE_PROMPT + comapany_info
            )
            return json.loads(response.text)
        except Exception as e:
            logging.error(f"Failed to generate email service content: {e}")
            return None
