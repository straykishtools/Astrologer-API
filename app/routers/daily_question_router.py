"""
Router: Daily Question (پرسش روزانه)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.engines.daily_question import DailyQuestionEngine

router = APIRouter(prefix="/api/v5", tags=["Daily Question"])
engine = DailyQuestionEngine()


class QuestionRequest(BaseModel):
    question: str
    birth_date: str  # YYYY-MM-DD
    birth_year: int


@router.post("/daily-question")
def ask_question(data: QuestionRequest):
    """پاسخ به سوال با ترکیب ۳ موتور (بیوریتم + سال حیوانی + تاروت)"""
    try:
        result = engine.answer(data.question, data.birth_date, data.birth_year)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
