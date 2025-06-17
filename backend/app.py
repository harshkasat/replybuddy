# pylint: skip-file
import logging
import os
from fastapi import FastAPI, Request, HTTPException
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.services.email_service import EmailService
from src.services.upwork_proposal_service import UpworkService
from src.services.message_service import MessageService
from src.services.find_email_service import FindEmailService
from src.services.llm_query_service import LLMQueryService
from src.utils.pydantic_schema import UserRequest, AIResponse

load_dotenv()


app = FastAPI(
    title="AI Content Generation API",
    description="API for generating email, message, and Upwork proposal content using AI.",
    version="1.0.0",
)


origins = [
    "http://localhost:3000",
]

prod_url = os.environ.get('PROD_URL')
if prod_url:
    origins.append(prod_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def block_postman(request: Request, call_next):
    origin = request.headers.get("origin")
    # If no Origin header, block (likely Postman or curl)
    if origin is None and not os.environ.get('ALLOW_POSTMAN'):
        return JSONResponse(status_code=403, content="Forbidden: Origin")
    response = await call_next(request)
    return response


@app.get("/")
async def check_homepage():
    try:
        return JSONResponse(
            content="server running good",
            status_code=200
        )
    except Exception as e:
        return JSONResponse(
            content=f"Internal Error: {e}",
            status_code=500
        )


@app.get("/health")
async def check_health():
    try:
        return JSONResponse(
            content="server running good",
            status_code=200
        )
    except Exception as e:
        return JSONResponse(
            content=f"Internal Error: {e}",
            status_code=500
        )


@app.post("/query")
async def query(request: UserRequest):
    try:
        logging.info(f"Received request: {request}")
        llm_service = LLMQueryService()
        response = llm_service.query_llm(prompt=request.company_info,
                                      prev_conservation=request.prev_conservation)
        if response is None:
            logging.error("Query Response returned None")
            return JSONResponse(
                status_code=500,
                content=AIResponse(
                    message="Failed to LLm query",
                    goal="Query the LLM",
                    status="error",
                    error="No response from LLM"
                ).model_dump()
            )

        return JSONResponse(
            status_code=200,
            content=AIResponse(
                message="LLM query successful",
                goal=response['response']['goal'],
                status="success",
                data=response['response']['message']
            ).model_dump()
        )
    except Exception as e:
        logging.error(f"Error searching email: {e}")
        return JSONResponse(
            status_code=500,
            content=AIResponse(
                message="Failed to search email",
                goal="Search for an email",
                status="error",
                error=str(e)
            ).model_dump()
        )


@app.post("/generate_email")
async def generate_email(request: UserRequest):
    try:
        email_service = EmailService()
        response = await email_service.email_service(comapany_info=request.company_info,
                                               prev_conservation=request.prev_conservation)
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
                data=response['response']['message']
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
        response = await service.upwork_service(comapany_info=request.company_info,
                                          prev_conservation=request.prev_conservation)
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
                goal=response['response']['goal'],
                status="success",
                data=response['response']['message']
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
        response = await service.message_service(comapany_info=request.company_info,
                                           prev_conservation=request.prev_conservation)
        logging.info("Message generated successfully")
        if response is None:
            logging.error("Message generation returned None")
            return JSONResponse(
                status_code=500,
                content=AIResponse(
                    message="Failed to generate message",
                    goal="Generate a message",
                    status="error",
                    error="No response from LLM",
                ).model_dump()
            )
        return JSONResponse(
            status_code=200,
            content=AIResponse(
                message="Message generated successfully",
                goal=response['response']['goal'],
                status="success",
                data=response['response']['message']
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


@app.post('/search_email')
async def search_email(request: UserRequest):
    try:
        service = FindEmailService()
        response = service.find_email(query=request.company_info,
                                      prev_conservation=request.prev_conservation)
        if response is None:
            logging.error("Email search returned None")
            return JSONResponse(
                status_code=500,
                content=AIResponse(
                    message="Failed to search email",
                    goal="Search for an email",
                    status="error",
                    error="No response from LLM"
                ).model_dump()
            )

        return JSONResponse(
            status_code=200,
            content=AIResponse(
                message="Email search successful",
                goal=response['response']['goal'],
                status="success",
                data=response['response']['message']
            ).model_dump()
        )
    except Exception as e:
        logging.error(f"Error searching email: {e}")
        return JSONResponse(
            status_code=500,
            content=AIResponse(
                message="Failed to search email",
                goal="Search for an email",
                status="error",
                error=str(e)
            ).model_dump()
        )

if __name__ == "__main__":
    import uvicorn
    logging.basicConfig(level=logging.INFO)
    uvicorn.run(app, host="0.0.0", port=8000)