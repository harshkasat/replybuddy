## ReplyBuddy: AI-Powered Content Generation

**A FastAPI application that leverages AI to generate emails, messages, and Upwork proposals.**

This project, `replybuddy`, provides a RESTful API built with FastAPI for generating various types of content using an AI model (the specific model isn't specified in the provided code, but it's likely a large language model).  It handles requests, interacts with the AI, and returns the generated content.  The frontend (React, based on the file names) interacts with this backend API.

**Key Features:**

* **Email Generation:** Generates professional emails based on provided company information and previous conversation context.
* **Message Generation:** Creates concise and effective messages tailored to specific contexts.
* **Upwork Proposal Generation:** Generates compelling Upwork proposals to increase chances of project acceptance.
* **Email Search:** Searches for emails based on provided information (likely leveraging an external email service, not detailed in the provided code).
* **LLM Query:** Allows general queries to the underlying LLM.

**Functions/Code (Backend - `app.py`):**

The backend uses FastAPI to define API endpoints.  Here are some examples:


* **`/query` (POST):**  This endpoint accepts a `UserRequest` (a Pydantic model likely defining `company_info` and `prev_conservation` fields) and sends a prompt to the LLM using `LLMQueryService`. It returns an `AIResponse` containing the LLM's response, along with status and goal information.

```python
@app.post("/query")
async def query(request: UserRequest):
    try:
        llm_service = LLMQueryService()
        response = llm_service.query_llm(prompt=request.company_info, prev_conservation=request.prev_conservation)
        # ... (error handling and response formatting) ...
    except Exception as e:
        # ... (error handling) ...
```

* **`/generate_email` (POST):** This endpoint uses `EmailService` to generate an email.  The structure is similar to the `/query` endpoint.

```python
@app.post("/generate_email")
async def generate_email(request: UserRequest):
    try:
        email_service = EmailService()
        response = email_service.email_service(comapany_info=request.company_info, prev_conservation=request.prev_conservation)
        # ... (error handling and response formatting) ...
    except Exception as e:
        # ... (error handling) ...
```

Similar endpoints exist for `/generate_upwork` and `/generate_message`, each utilizing a dedicated service class.  The `/search_email` endpoint uses `FindEmailService`.

**Setup and Usage:**

1. **Backend:**
    * Install dependencies: `pip install -r backend/requirements.txt`
    * Set environment variables (likely including API keys for the LLM and potentially email services).  The code uses `python-dotenv` to load these from a `.env` file.
    * Run the application: `uvicorn app:app --host 0.0.0.0 --port 8000` (from the `backend` directory).

2. **Frontend:**
   The provided file names suggest a React frontend.  Instructions for setting up and running the frontend are not included in the provided code snippets.  This would likely involve installing Node.js, npm or yarn, and then running build and start commands.

3. **Interaction:**
   The frontend would make POST requests to the backend endpoints (`/query`, `/generate_email`, etc.) to send prompts and receive generated content.


**Missing Information:**

The provided code snippets don't detail the implementation of the service classes (`EmailService`, `UpworkService`, `MessageService`, `FindEmailService`, `LLMQueryService`).  The specifics of how the AI model is integrated and the implementation of the frontend are also missing.  Therefore, a complete README cannot be generated without this information.  The code also contains a typo (`comapany_info` should be `company_info`).
