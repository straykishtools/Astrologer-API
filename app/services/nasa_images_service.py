from app.services.nasa_client import nasa_client

class NASAImagesService:
    async def search(self, query: str, page: int = 1) -> dict:
        return await nasa_client.search_images(query=query, page=page)
