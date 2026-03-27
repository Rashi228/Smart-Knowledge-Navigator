import logging
import re
from llama_index.core.node_parser import SimpleNodeParser
from llama_index.core.schema import Document
import uuid

logger = logging.getLogger(__name__)

class IngestionPipeline:
    def __init__(self):
        self.parser = SimpleNodeParser.from_defaults(chunk_size=512, chunk_overlap=50)

    def _extract_keywords(self, text: str) -> list[str]:
        """Extract meaningful keywords (words > 4 chars, no stopwords) from text."""
        stopwords = {"about", "after", "again", "before", "being", "between", "could", "during",
                     "every", "first", "found", "given", "group", "having", "large", "local",
                     "might", "never", "other", "place", "point", "right", "since", "still",
                     "their", "there", "these", "think", "those", "three", "under", "using",
                     "where", "which", "while", "would", "should", "shall", "often", "made"}
        words = re.findall(r'\b[A-Za-z][a-z]{3,}\b', text)
        seen = set()
        keywords = []
        for w in words:
            lw = w.lower()
            if lw not in stopwords and lw not in seen:
                seen.add(lw)
                keywords.append(w)
        return keywords[:20]  # cap per chunk

    def process_document(self, filename: str, content: str) -> list[dict]:
        """
        Chunks the document and extracts graph relationships in parallel.
        """
        logger.info(f"Parsing document '{filename}' via LlamaIndex pipeline.")
        doc = Document(text=content, id_=str(uuid.uuid4()), metadata={"file_name": filename})
        nodes = self.parser.get_nodes_from_documents([doc])
        logger.info(f"Successfully chunked '{filename}' into {len(nodes)} semantic child nodes.")

        formatted_chunks = [
            {"id": n.node_id, "text": n.text, "metadata": n.metadata}
            for n in nodes
        ]
        return formatted_chunks

    def populate_graph(self, filename: str, chunks: list[dict]):
        """Builds graph edges from extracted keywords per chunk. Called after embedding completes."""
        from storage.graph_db import graph_db
        edge_count = 0
        for chunk in chunks[:100]:  # process first 100 chunks to keep startup fast
            kws = self._extract_keywords(chunk.get("text", ""))
            for i in range(len(kws) - 1):
                graph_db.add_relationship(kws[i], "co-occurs-with", kws[i + 1],
                                          metadata={"source": filename})
                edge_count += 1
        logger.info(f"Populated graph with {edge_count} edges from '{filename}'")

ingestion_pipeline = IngestionPipeline()
