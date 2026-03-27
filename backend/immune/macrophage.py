import logging
import os
from dotenv import load_dotenv
from typing import List, Dict
from storage.memory_cache import memory_cache
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()
logger = logging.getLogger(__name__)

class ImmunitySystem:
    """
    HyperRAG-X Immune System.
    Runs asynchronously in the background mapping newly ingested files against
    the global memory structure to identify intellectual contradictions.
    """
    def __init__(self):
        self.conflicts: List[str] = []
        
    def scan_for_conflicts(self, new_text: str, filename: str):
        logger.info(f"🦠 Immune System [Macrophage Agent]: Activating scan on {filename}...")
        
        ctx = memory_cache.get_context()
        existing_knowledge = "\n\n".join([f"Source: {c['source']}\n{c['content']}" for c in ctx])
        
        # We don't scan if there is nothing to contradict against
        if not existing_knowledge or existing_knowledge.strip() == "":
            logger.info("Macrophage: Clean system. No prior knowledge to cross-reference.")
            return {"status": "safe", "conflicts": []}
            
        system_prompt = (
            "You are the HyperRAG-X Macrophage Immune Agent. "
            "Your ONLY job is to blindly compare the NEW DOCUMENT against the EXISTING KNOWLEDGE. "
            "If the new document explicitly contradicts the existing knowledge (e.g. different rules, conflicting facts, changing stats), "
            "output a clear summary of the contradiction starting with 'CONTRADICTION:'. "
            "If they agree or are completely unrelated, output exactly the word 'NO_CONFLICT'."
        )
        
        user_prompt = f"EXISTING KNOWLEDGE:\n{existing_knowledge}\n\nNEW DOCUMENT:\n{new_text[:4000]}"
        
        try:
            import os
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                logger.error("Macrophage: GROQ_API_KEY missing.")
                return {"status": "error"}

            from langchain_groq import ChatGroq
            llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.0, groq_api_key=api_key)
            prompt = ChatPromptTemplate.from_messages([("system", system_prompt), ("human", user_prompt)])
            
            chain = prompt | llm
            report = chain.invoke({}).content
            
            if "NO_CONFLICT" in report or "no conflict" in report.lower():
                logger.info("✅ Macrophage: System Secure. Documents align perfectly.")
                return {"status": "secure"}
            else:
                logger.warning(f"⚠️ Macrophage: THREAT DETECTED! {report}")
                if report not in self.conflicts:
                    self.conflicts.append(f"[{filename}]: {report}")
                return {"status": "infected", "report": report}
                
        except Exception as e:
            logger.error(f"Macrophage biological failure: {str(e)[:50]}")
            return {"status": "error"}

immune_system = ImmunitySystem()
