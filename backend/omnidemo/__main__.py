import uvicorn
from omnidemo.settings import settings


def main() -> None:
    uvicorn.run(
        "omnidemo.app:get_app",
        workers=settings.workers_count,
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower(),
        factory=True,
    )


if __name__ == "__main__":
    main()
