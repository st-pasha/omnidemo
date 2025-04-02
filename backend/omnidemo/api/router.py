from fastapi.routing import APIRouter

from omnidemo.api import inputs, forecasts, insights, jobs, users

api_router = APIRouter()
api_router.include_router(forecasts.router)
api_router.include_router(inputs.router)
api_router.include_router(insights.router)
api_router.include_router(jobs.router)
api_router.include_router(users.router)


@api_router.get("/health")
def health_check() -> None:
    pass
