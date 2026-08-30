import asyncio
import os
import time
from typing import Dict, Optional
import httpx

class NASAClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("NASA_API_KEY", "DEMO_KEY")
        self.base_url = "https://api.nasa.gov"
        self.images_base_url = "https://images-api.nasa.gov"
        self.timeout = 20.0
        self.max_retries = 3
        self._request_times: list[float] = []
        self._rate_window = 60.0
        self._max_requests = 10

    async def _wait_for_rate_limit(self):
        now = time.time()
        self._request_times = [t for t in self._request_times if now - t < self._rate_window]
        if len(self._request_times) >= self._max_requests:
            wait = self._rate_window - (now - self._request_times[0]) + 0.2
            if wait > 0:
                await asyncio.sleep(wait)
        self._request_times.append(time.time())

    async def _request(self, endpoint: str, params: Optional[Dict] = None,
                       *, base_url: Optional[str] = None,
                       use_api_key: bool = True,
                       timeout: Optional[float] = None) -> Dict:
        query = dict(params or {})
        if use_api_key:
            query["api_key"] = self.api_key
        root = (base_url or self.base_url).rstrip("/")
        last_error = None

        for attempt in range(self.max_retries):
            try:
                await self._wait_for_rate_limit()
                async with httpx.AsyncClient(timeout=timeout or self.timeout) as client:
                    response = await client.get(
                        f"{root}/{endpoint.lstrip('/')}",
                        params=query,
                        headers={"Accept": "application/json"},
                    )
                if response.status_code == 200:
                    try:
                        return response.json()
                    except ValueError:
                        return {"error": "NASA API returned invalid JSON"}

                last_error = {
                    "error": f"NASA API returned HTTP {response.status_code}",
                    "status": response.status_code,
                }
                if response.status_code in {429,500,502,503,504} and attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                return last_error

            except httpx.TimeoutException:
                last_error = {"error": "NASA API request timed out"}
            except httpx.ConnectError as exc:
                last_error = {"error": f"Cannot connect to NASA API: {exc}"}
            except Exception as exc:
                last_error = {"error": f"NASA API error: {exc}"}

            if attempt < self.max_retries - 1:
                await asyncio.sleep(2 ** attempt)

        return last_error or {"error": "NASA API request failed"}

    async def get_apod(self, date: Optional[str] = None, count: int = 1) -> Dict:
        params = {"thumbs": "true"}
        if date:
            params["date"] = date
        if count > 1:
            params["count"] = count
        return await self._request("planetary/apod", params)

    async def search_images(self, query: str, page: int = 1) -> Dict:
        return await self._request(
            "search", {"q": query, "page": page},
            base_url=self.images_base_url, use_api_key=False, timeout=25.0
        )

    async def get_space_weather(self, start_date: str, end_date: Optional[str] = None) -> Dict:
        p = {"startDate": start_date}
        if end_date: p["endDate"] = end_date
        return await self._request("DONKI/FLR", p, timeout=25.0)

    async def get_cmes(self, start_date: str, end_date: Optional[str] = None) -> Dict:
        p = {"startDate": start_date}
        if end_date: p["endDate"] = end_date
        return await self._request("DONKI/CME", p, timeout=25.0)

    async def get_space_weather_full(self, start_date: str, end_date: Optional[str] = None) -> Dict:
        p = {"startDate": start_date, "type": "all"}
        if end_date: p["endDate"] = end_date
        return await self._request("DONKI/notifications", p, timeout=25.0)

    async def get_asteroids(self, start_date: str, end_date: Optional[str] = None) -> Dict:
        p = {"start_date": start_date}
        if end_date: p["end_date"] = end_date
        return await self._request("neo/rest/v1/feed", p, timeout=25.0)

    async def get_mars_weather(self) -> Dict:
        return await self._request("insight_weather/", {"feedtype":"json","ver":"1.0"}, timeout=25.0)

nasa_client = NASAClient()
