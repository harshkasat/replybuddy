import logging
from src.services import UPWORK_SERVICE_PROMPT
from src.llm_config.config import LlmClient


class UpworkService(LlmClient):

    def upwork_service(self, comapany_info:str):
        try:
            response = self.generate_content(
                content=UPWORK_SERVICE_PROMPT + comapany_info
            )
            return response.text
        except Exception as e:
            logging.error(f"Failed to generate upwork service content: {e}")
            return e
