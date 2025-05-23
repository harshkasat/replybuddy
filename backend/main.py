import asyncio
from src.services.yc_service import YcService

async def main():
    gs = await YcService().yc_service()


if __name__ == "__main__":
    asyncio.run(main())
