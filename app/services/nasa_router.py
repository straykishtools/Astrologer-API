from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.services.apod_service import APODService
from app.services.nasa_images_service import NASAImagesService
from app.services.donki_service import DONKIService
from app.services.neo_service import NeoService
from app.services.mars_weather_service import MarsWeatherService
from app.services.ssd_service import SSDService

router=APIRouter(prefix="/api/v5/nasa",tags=["NASA"])
apod_svc=APODService(); images_svc=NASAImagesService(); donki_svc=DONKIService()
neo_svc=NeoService(); mars_svc=MarsWeatherService(); ssd_svc=SSDService()

def _date(v:str,n:str):
    try: datetime.strptime(v,"%Y-%m-%d")
    except ValueError: raise HTTPException(422,detail=f"{n} must be YYYY-MM-DD")

@router.get("/apod")
async def get_apod(date:Optional[str]=Query(None)):
    if date: _date(date,"date")
    r=await apod_svc.get_todays_image(date)
    if "error" in r: raise HTTPException(502,detail=r["error"])
    return r

@router.get("/images")
async def images(query:str=Query(...,min_length=1),page:int=Query(1,ge=1)):
    r=await images_svc.search(query,page)
    if "error" in r: raise HTTPException(502,detail=r["error"])
    return r

@router.get("/space-weather")
async def weather(startDate:str=Query(...),endDate:Optional[str]=Query(None)):
    _date(startDate,"startDate")
    if endDate:_date(endDate,"endDate")
    r=await donki_svc.get_solar_flares(startDate,endDate)
    if isinstance(r,dict) and "error" in r: raise HTTPException(502,detail=r["error"])
    return r

@router.get("/space-weather/summary")
async def weather_summary(startDate:str=Query(...),endDate:Optional[str]=Query(None)):
    _date(startDate,"startDate")
    if endDate:_date(endDate,"endDate")
    # The original working HTML sends this button to DONKI/CME.
    r=await donki_svc.get_cmes(startDate,endDate)
    if isinstance(r,dict) and "error" in r: raise HTTPException(502,detail=r["error"])
    return r

@router.get("/space-weather/cme")
async def cme(startDate:str=Query(...),endDate:Optional[str]=Query(None)):
    _date(startDate,"startDate")
    if endDate:_date(endDate,"endDate")
    r=await donki_svc.get_cmes(startDate,endDate)
    if isinstance(r,dict) and "error" in r: raise HTTPException(502,detail=r["error"])
    return r

@router.get("/asteroids")
async def asteroids(startDate:str=Query(...),endDate:Optional[str]=Query(None)):
    _date(startDate,"startDate")
    if endDate:_date(endDate,"endDate")
    r=await neo_svc.get_asteroids(startDate,endDate)
    if "error" in r: raise HTTPException(502,detail=r["error"])
    return r

@router.get("/mars-weather")
async def mars_weather():
    r=await mars_svc.get_weather()
    if isinstance(r,dict) and "error" in r and not r.get("sol_keys"):
        raise HTTPException(502,detail=r["error"])
    return r

@router.get("/planets")
async def planets(date:str=Query(...)):
    _date(date,"date")
    return await ssd_svc.get_planetary_positions_live(date)
