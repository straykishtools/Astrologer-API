from datetime import datetime
from app.services.cache import nasa_cache

class SSDService:
    PLANET_EPOCH_LONGITUDES = {
        "Sun":280.46,"Moon":218.32,"Mercury":252.25,"Venus":181.98,
        "Mars":355.43,"Jupiter":34.40,"Saturn":50.08,"Uranus":314.06,
        "Neptune":304.88,"Pluto":238.93
    }
    PLANET_DAILY_MOTION = {
        "Sun":0.9856,"Moon":13.1764,"Mercury":4.0923,"Venus":1.6021,
        "Mars":0.5240,"Jupiter":0.0831,"Saturn":0.0334,"Uranus":0.0117,
        "Neptune":0.0060,"Pluto":0.0040
    }
    SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]

    def get_planetary_positions(self, date_str: str) -> dict:
        key=f"ssd_positions_{date_str}"
        cached=nasa_cache.get(key)
        if cached is not None: return cached
        j2000=datetime(2000,1,1,12,0,0)
        target=datetime.strptime(date_str,"%Y-%m-%d")
        days=(target-j2000).total_seconds()/86400.0
        planets={}
        for planet,epoch in self.PLANET_EPOCH_LONGITUDES.items():
            lon=(epoch+self.PLANET_DAILY_MOTION[planet]*days)%360.0
            planets[planet]={
                "longitude":round(lon,4),
                "sign":self.SIGNS[int(lon/30)%12],
                "degree_in_sign":round(lon%30,2),
                "retrograde":False
            }
        result={"date":date_str,"source":"ssd_fallback","note":"Approximate planetary positions.","planets":planets}
        nasa_cache.set(key,result)
        return result

    async def get_planetary_positions_live(self,date_str:str)->dict:
        return self.get_planetary_positions(date_str)
