from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from ..services.mizaj_service import MizajService

router = APIRouter(prefix="/api/v5", tags=["Mizaj"])


class MizajRequest(BaseModel):
    questionnaire_type: str  # "mmq" or "smq"
    answers: Dict[str, int]  # keys: q1..q10 or q1..q20


@router.post("/mizaj")
async def calculate_mizaj(request: MizajRequest):
    try:
        if request.questionnaire_type == "mmq":
            result = MizajService.calculate_from_mmq(request.answers)
        elif request.questionnaire_type == "smq":
            result = MizajService.calculate_from_smq(request.answers)
        else:
            raise HTTPException(
                status_code=400,
                detail="نوع پرسشنامه نامعتبر است. 'mmq' یا 'smq' وارد کنید."
            )
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
