import logging
import json
from src.llm_config.config import LlmClient
from src.utils.pydantic_schema import PrevConservation
from src.services import LLM_QUERY_PROMPT

class LLMQueryService(LlmClient):
    def query_llm(self, prompt: str, prev_conservation: PrevConservation = None):
        try:
            if prev_conservation:
                prompt = LLM_QUERY_PROMPT.format(prev_conservations=prev_conservation)

            response = self.generalize_content(content=LLM_QUERY_PROMPT + prompt)
            logging.info("LLM response successfully generated")
            return json.loads(response.text)
        except Exception as e:
            logging.error(f"Failed to query LLM: {e}")
            return None
        