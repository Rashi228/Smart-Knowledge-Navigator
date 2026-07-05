import logging
import json
import os
from typing import Dict
from db.supabase_client import supabase

logger = logging.getLogger(__name__)

class DirectMemoryCache:
    """
    A lightweight memory cache that persists to Supabase Postgres so data survives backend restarts.
    """
    def __init__(self):
        self.cache: Dict[str, str] = {}
        self._load()

    def _load(self):
        try:
            # Fetch all from Supabase
            response = supabase.table("memory_cache").select("*").execute()
            if response.data:
                for row in response.data:
                    self.cache[row["filename"]] = row["content"]
            logger.info(f"DirectMemoryCache: Loaded {len(self.cache)} files from Supabase.")
        except Exception as e:
            logger.warning(f"Could not load memory cache from Supabase: {e}")

    def store_file(self, filename: str, content: str):
        self.cache[filename] = content
        try:
            supabase.table("memory_cache").upsert({"filename": filename, "content": content}).execute()
        except Exception as e:
            logger.warning(f"Could not save memory cache to Supabase: {e}")
        logger.info(f"Stored {filename} entirely in DirectMemoryCache (Bypassing Vector DB).")

    def get_context(self, file_filter: list[str] = None) -> list[dict]:
        """Returns context from the cache, optionally filtered by filename"""
        if file_filter:
            return [{"source": name, "content": content} for name, content in self.cache.items() if name in file_filter]
        return [{"source": name, "content": content} for name, content in self.cache.items()]

    def delete_file(self, filename: str):
        if filename in self.cache:
            del self.cache[filename]
            try:
                supabase.table("memory_cache").delete().eq("filename", filename).execute()
            except Exception as e:
                logger.warning(f"Could not delete from memory cache in Supabase: {e}")
            logger.info(f"Deleted {filename} entirely from DirectMemoryCache.")

memory_cache = DirectMemoryCache()
