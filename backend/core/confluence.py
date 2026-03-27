import logging
import os
import asyncio
from typing import List, Dict
from playwright.async_api import async_playwright
from firecrawl import Firecrawl
from storage.vector_db import vector_db
from storage.graph_db import graph_db
from storage.memory_cache import memory_cache
from core.embeddings import LocalEmbedder

logger = logging.getLogger(__name__)

class ConfluenceSync:
    def __init__(self):
        self.firecrawl_key = os.getenv("FIRE_CRAWL_API_KEY")
        self.app = Firecrawl(api_key=self.firecrawl_key) if self.firecrawl_key else None

    async def sync_page(self, url: str, user_id: str) -> Dict:
        """
        Sync a single Confluence page into the RAG pipeline.
        Uses Playwright to handle any potential SSO/Login before Firecrawl 
        takes over for structural extraction.
        """
        logger.info(f"🔗 ConfluenceSync: Starting sync for {url}")
        
        try:
            # 1. Extraction Phase
            markdown_content = ""
            if self.app:
                # Use Firecrawl Cloud v2 if API key is present
                result = self.app.scrape(url, params={'formats': ['markdown']})
                markdown_content = result.get('markdown', '')
                # Metdata in v2 is often top-level or in 'metadata'
                title = result.get('metadata', {}).get('title', 'Confluence Page')
            else:
                # Fallback: Scrape via Playwright directly if no Firecrawl key
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True)
                    page = await browser.new_page()
                    await page.goto(url, wait_until="networkidle")
                    title = await page.title()
                    # Simple text extraction as fallback
                    markdown_content = await page.content() 
                    await browser.close()
                
            if not markdown_content:
                return {"status": "error", "message": "Failed to extract content"}

            # 2. Ingestion Phase (Consistent with file upload logic)
            filename = f"Confluence: {title[:30]}"
            
            # Storage 1: Vector DB
            embedder = LocalEmbedder.get_embedder()
            # We chunk the markdown (simple split for now)
            chunks = [markdown_content[i:i+1000] for i in range(0, len(markdown_content), 800)]
            for i, chunk in enumerate(chunks):
                vector = embedder.embed_query(chunk)
                vector_db.add_document(
                    vector=vector,
                    text=chunk,
                    payload={"filename": filename, "source": url, "chunk_id": i, "user_id": user_id}
                )

            # Storage 2: Graph DB
            graph_db.add_document_nodes(filename, markdown_content[:2000])

            # Storage 3: Memory Cache (Summary)
            memory_cache.store_file(filename, markdown_content[:5000])

            logger.info(f"✅ ConfluenceSync: Successfully ingested '{title}'")
            return {"status": "success", "title": title, "chars": len(markdown_content)}

        except Exception as e:
            logger.error(f"❌ ConfluenceSync error: {str(e)}")
            return {"status": "error", "message": str(e)}

confluence_sync = ConfluenceSync()
