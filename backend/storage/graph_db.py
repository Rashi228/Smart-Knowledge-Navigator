import logging
import networkx as nx
from typing import List, Dict

logger = logging.getLogger(__name__)

class GraphDBClient:
    def __init__(self):
        # We use NetworkX locally to simulate Neo4j behavior instantly for ideathons
        self.graph = nx.MultiDiGraph()
        logger.info("Connected to Graph Database (Mocked NetworkX in-memory)")

    def add_relationship(self, entity1: str, relationship: str, entity2: str, metadata: dict = None):
        """Adds a triple to the graph database."""
        self.graph.add_node(entity1)
        self.graph.add_node(entity2)
        self.graph.add_edge(entity1, entity2, relation=relationship, **(metadata or {}))
        logger.info(f"Added Graph Edge: {entity1} -[{relationship}]-> {entity2}")

    def get_context_for_entity(self, entity: str, depth: int = 2) -> List[str]:
        """Retrieves connections for a specific entity out to a certain depth."""
        if entity not in self.graph:
            return []
            
        context = []
        edges = nx.edge_bfs(self.graph, entity, orientation="original")
        
        # In a real Neo4j setup, this is cypher: MATCH (a {name: entity})-[r*..2]-(b) RETURN a,r,b
        for edge_count, edge in enumerate(edges):
            if edge_count >= depth * 5: # simple mock cutoff
                break
            src, dst, key = edge
            rel = self.graph[src][dst][key].get("relation", "connected_to")
            context.append(f"{src} represents {rel} {dst}")
            
        return context

    def get_random_entities(self, limit: int = 3) -> List[str]:
        """Expose a few random entities for query suggestions."""
        if not self.graph.nodes:
            return []
        import random
        nodes = list(self.graph.nodes())
        nodes = [str(n) for n in nodes if isinstance(n, str) and len(n) > 3]
        if not nodes:
            return []
        return random.sample(nodes, min(limit, len(nodes)))

graph_db = GraphDBClient()
