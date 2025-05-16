import logging
import os
from src.services.email_service import EmailService
from src.services.upwork_proposal_service import UpworkService
from src.services.message_service import MessageService
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()


app = FastAPI(
    title="AI Content Generation API",
    description="API for generating email, message, and Upwork proposal content using AI.",
    version="1.0.0",
)

app = FastAPI()

origins = [
    "https://mywebsite.com",
    "https://new-allowed-site.com",  # <-- add new origin here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserRequest(BaseModel):
    company_info: str

class AIResponse(BaseModel):
    message: str
    goal: str
    status: str
    data: dict = None
    error: str = None


@app.middleware("http")
async def block_postman(request: Request, call_next):
    origin = request.headers.get("origin")
    # If no Origin header, block (likely Postman or curl)
    if origin is None and not os.environ.get('ALLOW_POSTMAN'):
        return JSONResponse(status_code=403, content="Forbidden: Origin")
    response = await call_next(request)
    return response



@app.post("/generate_email")
async def generate_email(request: UserRequest):
    try:
        email_service = EmailService()
        response = email_service.email_service(request.company_info)
        print(f"resposne type: {type(response)}")
        logging.info("Email generated successfully")
        if response is None:
            logging.error("Email generation returned None")
            return JSONResponse(
                status_code=500,
                content=AIResponse(
                    message="Failed to generate email",
                    goal="Generate an email",
                    status="error",
                    error="No response from LLM"
                ).model_dump()
            )
        return JSONResponse(
            status_code=200,
            content=AIResponse(
                message="Email generated successfully",
                goal="Generate an email",
                status="success",
                data=response
            ).model_dump()
        )
    except Exception as e:
        logging.error(f"Error generating email: {e}")
        return JSONResponse(
            status_code=500,
            content=AIResponse(
                message="Failed to generate email",
                goal="Generate an email",
                status="error",
                error=str(e)
            ).model_dump()
        )

@app.post("/generate_upwork")
async def generate_upwork(request: UserRequest):
    try:
        service = UpworkService()
        response = service.upwork_service(request.company_info)
        logging.info("Upwork Proposal generated successfully")
        if response is None:
            logging.error("proposal generation returned None")
            return JSONResponse(
                status_code=500,
                content=AIResponse(
                    message="Failed to generate proposal",
                    goal="Generate a proposal",
                    status="error",
                    error="No response from LLM"
                ).model_dump()
            )
        return JSONResponse(
            status_code=200,
            content=AIResponse(
                message="Upwork Proposal generated successfully",
                goal="Generate a proposal",
                status="success",
                data=response
            ).model_dump()
        )
    except Exception as e:
        logging.error(f"Error generating proposal: {e}")
        return JSONResponse(
            status_code=500,
            content=AIResponse(
                message="Failed to generate proposal",
                goal="Generate a proposal",
                status="error",
                error=str(e)
            ).model_dump()
        )

@app.post("/generate_message")
async def generate_message(request: UserRequest):
    try:
        service = MessageService()
        response = service.message_service(request.company_info)
        logging.info("Message generated successfully")
        if response is None:
            logging.error("Message generation returned None")
            return JSONResponse(
                status_code=500,
                content=AIResponse(
                    message="Failed to generate message",
                    goal="Generate a message",
                    status="error",
                    error="No response from LLM"
                ).model_dump()
            )
        return JSONResponse(
            status_code=200,
            content=AIResponse(
                message="Message generated successfully",
                goal="Generate a message",
                status="success",
                data=response
            ).model_dump()
        )
    except Exception as e:
        logging.error(f"Error generating message: {e}")
        return JSONResponse(
            status_code=500,
            content=AIResponse(
                message="Failed to generate message",
                goal="Generate a message",
                status="error",
                error=str(e)
            ).model_dump()
        )
