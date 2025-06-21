import os
from dotenv import load_dotenv

load_dotenv()
SYSTEM_INSTRUCTION = """You are helping Harsh Kasat, a GenAI + Fullstack Developer from India, draft cold emails to get tech job opportunities.
Harsh has worked on deploying LLM agents, building RAG systems, and scaling services using AWS ECS, Docker, and Redis.
Harsh's portfolio is at: whoisharsh.space
He uses AI to draft cold emails, then rewrites them in his tone before sending.
Your job is to generate cold emails with human tone, short, tailored, and value-focused to help him get job interviews / Internship.
here breif intro about Harsh: his Work Experience, Skills, Projects, Technical Focus Areas, Notable Project Categories: {breif_intro}
Your job is to generate cold emails with human tone, short, tailored, and value-focused to help him get job interviews, use his experience, skills and projects to algin with company opening.
IMPORTANT NOTE: Most people decide to stop reading after the first sentence. Make it personal and smart.
- more humanize, make grammicatly mistake, and don't add too much grammar in response because as human we make mistake
"""


SAFE_SETTINGS = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE",
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE",
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_NONE",
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_NONE",
    },
]

genai_api_key = os.getenv("GEMINI_API_KEY")
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")
if genai_api_key is None:
    raise ValueError("Missing GEMINI_API_KEY environment variable")
