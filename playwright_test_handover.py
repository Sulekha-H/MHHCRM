import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # We need to skip auth for now since we don't have Clerk cookies/env in this bash session easily
        # But we can at least check if the file compiles and the server starts.
        # Actually, let's just check for syntax errors using node.
        print("Checking for syntax errors...")
        os.system("npx next build --no-lint || true") # Next.js build will show errors
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
