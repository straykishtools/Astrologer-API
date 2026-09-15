"""
Miscellaneous endpoints.

Health check and status probes only.
"""

import asyncio
from logging import getLogger
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from ..config.database import engine
from ..config.settings import settings
from ..types.response_models import (
    StatusResponseModel,
    ApiStatusResponseModel,
)
from ..utils.logging_utils import log_request

logger = getLogger(__name__)
router = APIRouter()


@router.get(
    "/health",
    response_description="Health check",
    include_in_schema=False,
    response_model=StatusResponseModel,
)
async def health() -> JSONResponse:
    """
    **GET** `/health`

    Liveness + shallow DB probe for load balancers and monitoring.
    Returns 200 `{"status":"OK"}` only when SQLite answers within 3s;
    otherwise 503 `degraded` (so deploy health-checks catch a dead DB).

    **Returns:**
    - `status`: "OK" | "degraded"
    """
    try:
        async def _db_ok() -> None:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        await asyncio.wait_for(_db_ok(), timeout=3.0)
        return JSONResponse(content={"status": "OK"}, status_code=200)
    except Exception as exc:
        logger.warning("Health check DB probe failed: %s", exc)
        return JSONResponse(
            content={"status": "degraded", "checks": {"db": "unreachable"}},
            status_code=503,
        )


@router.get(
    "/api/status",
    response_description="Status of the API",
    include_in_schema=False,
    response_model=ApiStatusResponseModel,
)
async def status(request: Request) -> JSONResponse:
    """
    **GET** `/`

    Returns basic API status and environment information. Not included in the public schema.

    **Returns:**
    - `status`: "OK"
    - `environment`: deployment environment name
    - `debug`: whether debug mode is enabled
    """
    log_request(logger, request, "API status check")
    response_dict = {
        "status": "OK",
        "environment": settings.env_type,
        "debug": settings.debug,
    }
    return JSONResponse(content=response_dict, status_code=200)
