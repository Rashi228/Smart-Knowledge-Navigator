from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class StatusResponse(BaseModel):
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None

class QueryRequest(BaseModel):
    query: str = Field(..., description="User's natural language query")
    mode: str = Field(default="Private", description="Retrieval mode: Private, Public, or Hybrid")

class ProcessingStep(BaseModel):
    step: str
    status: str

class QueryResponse(BaseModel):
    answer: str
    confidence_score: int
    confidence_level: str
    strategy: str
    sources: List[str]
    steps: List[ProcessingStep]
