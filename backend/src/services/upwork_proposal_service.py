import logging
import json
from src.services import UPWORK_SERVICE_PROMPT
from src.llm_config.config import LlmClient
from src.utils.pydantic_schema import PrevConservation



class UpworkService(LlmClient):

    def upwork_service(self, comapany_info:str, prev_conservation:PrevConservation = None):
        try:
            if prev_conservation:
                prev_conservation = UPWORK_SERVICE_PROMPT.format(
                    prev_conservations=prev_conservation)
            response = self.generate_content(
                content=UPWORK_SERVICE_PROMPT + comapany_info
            )
            return json.loads(response.text)
        except Exception as e:
            logging.error(f"Failed to generate upwork service content: {e}")
            return None
