import logging
from src.services.email_service import EmailService
from src.services.upwork_proposal_service import UpworkService
from src.services.message_service import MessageService
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="AI Content Generation API",
    description="API for generating email, message, and Upwork proposal content using AI.",
    version="1.0.0",
)

class Request(BaseModel):
    company_info: str

class Response(BaseModel):
    message: str
    goal: str
    status_code: int
    status: str
    error: str = None
    data: str = None

@app.post("/generate_email", response_model=Response)
async def generate_email(request: Request):
    try:
        email_service = EmailService()
        response = email_service.email_service(request.company_info)
        logging.info("Email generated successfully")
        if response is None:
            logging.error("Email generation returned None")
            return Response(
                message="Failed to generate email",
                goal="Generate an email",
                status_code=500,
                status="error",
                error="No response from LLM"
            )
        return Response(
            message="Email generated successfully",
            goal="Generate an email",
            status_code=200,
            status="success",
            data=response.text
        )
    except Exception as e:
        logging.error(f"Error generating email: {e}")
        return Response(
            message="Failed to generate email",
            goal="Generate an email",
            status_code=500,
            status="error",
            error=str(e)
        )

@app.post("/generate_upwork", response_model=Response)
async def generate_upwork(request: Request):
    try:
        service = UpworkService()
        response = service.upwork_service(request.company_info)
        logging.info("Upwork Proposal generated successfully")
        if response is None:
            logging.error("proposal generation returned None")
            return Response(
                message="Failed to generate proposal",
                goal="Generate an proposal",
                status_code=500,
                status="error",
                error="No response from LLM"
            )
        return Response(
            message="Upwork Proposal generated successfully",
            goal="Generate an email",
            status_code=200,
            status="success",
            data=response.text
        )
    except Exception as e:
        logging.error(f"Error generating proposal: {e}")
        return Response(
            message="Failed to generate proposal",
            goal="Generate an proposal",
            status_code=500,
            status="error",
            error=str(e)
        )

@app.post("/generate_message", response_model=Response)
async def generate_message(request: Request):
    try:
        service = MessageService()
        response = service.message_service(request.company_info)
        logging.info("Message generated successfully")
        if response is None:
            logging.error("Message generation returned None")
            return Response(
                message="Failed to generate Message",
                goal="Generate an Message",
                status_code=500,
                status="error",
                error="No response from LLM"
            )
        return Response(
            message="Message generated successfully",
            goal="Generate an email",
            status_code=200,
            status="success",
            data=response.text
        )
    except Exception as e:
        logging.error(f"Error generating message: {e}")
        return Response(
            message="Failed to generate message",
            goal="Generate an message",
            status_code=500,
            status="error",
            error=str(e)
        )

