from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..engines import abjad

router = APIRouter(prefix="/api/v5", tags=["Abjad"])

class AbjadRequest(BaseModel):
    text: str
    method: str = "kabir"  # kabir or saghir

class CompareRequest(BaseModel):
    name1: str
    name2: str
    method: str = "kabir"

@router.post("/abjad")
def get_abjad(request: AbjadRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="متن وارد نشده است")
    if request.method not in ["kabir", "saghir"]:
        raise HTTPException(status_code=400, detail="نوع ابجد نامعتبر است")
    result = abjad.calculate_abjad(request.text, request.method)
    return {"status": "success", "data": result}

@router.post("/abjad/compare")
def compare_names(request: CompareRequest):
    if not request.name1 or not request.name2:
        raise HTTPException(status_code=400, detail="هر دو نام باید وارد شوند")
    if request.method not in ["kabir", "saghir"]:
        raise HTTPException(status_code=400, detail="نوع ابجد نامعتبر است")
    result = abjad.compare_names(request.name1, request.name2, request.method)
    return {"status": "success", "data": result}
