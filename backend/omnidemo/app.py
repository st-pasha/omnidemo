from __future__ import annotations
from contextlib import asynccontextmanager
from importlib import metadata
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.responses import UJSONResponse
from fastapi.middleware.cors import CORSMiddleware

from omnidemo.db import SqliteDatabase


def get_app() -> FastAPI:
    from omnidemo.api.router import api_router

    app = FastAPI(
        title="omnidemo",
        version=metadata.version("omnidemo"),
        lifespan=lifespan_setup,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        default_response_class=UJSONResponse,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "https://omnidemo-frontend.fly.dev",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Main router for the API.
    app.include_router(router=api_router, prefix="/api")

    return app


@asynccontextmanager
async def lifespan_setup(
    app: FastAPI,
) -> AsyncGenerator[None, None]:  # pragma: no cover
    """
    Actions to run on application startup.

    This function uses fastAPI app to store data
    in the state, such as db_engine.

    :param app: the fastAPI application.
    :return: function that actually performs actions.
    """

    app.middleware_stack = None
    app.middleware_stack = app.build_middleware_stack()
    app.state.db = SqliteDatabase.connect()

    yield
