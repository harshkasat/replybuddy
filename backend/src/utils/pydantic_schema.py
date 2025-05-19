from typing import Literal, Optional
from pydantic import BaseModel

class PrevConservation(BaseModel):
    conservation_id: str
    role: Literal["user", "assistant"]
    message:str
    timestamp: str

class UserRequest(BaseModel):
    company_info: str
    prev_conservation: Optional[PrevConservation] = None


class AIResponse(BaseModel):
    message: str
    goal: str
    status: str
    data: str = None
    error: str = None
