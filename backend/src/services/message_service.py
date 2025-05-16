import logging
from src.services import MESSAGE_SERVICE_PROMPT
from src.llm_config.config import LlmClient


class MessageService(LlmClient):

    def message_service(self, comapany_info:str):
        try:
            response = self.generate_content(
                content=MESSAGE_SERVICE_PROMPT + comapany_info
            )
            return response.text
        except Exception as e:
            logging.error(f"Failed to generate message service content: {e}")
            return None
