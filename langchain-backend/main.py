from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import requests

app = FastAPI()

class HackRxRequest(BaseModel):
    documents: str
    questions: List[str]

@app.post("/api/hackrx")
def proxy_to_nextjs(payload: HackRxRequest):
    try:
        response = requests.post(
            "http://localhost:3000/api/hackrx",
            json=payload.model_dump(),
            timeout=60
        )
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling Next.js: {str(e)}")
