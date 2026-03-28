import logging
import networkx as nx
import json
import os
from typing import List, Dict

logger = logging.getLogger(__name__)

GRAPH_FILE = os.path.join(os.path.dirname(__file__), "..", "graph_db.json")

class GraphDBClient:
    def __init__(self):
        # We use NetworkX locally to simulate Neo4j behavior instantly for ideathons
        self.graph = nx.MultiDiGraph()
        self._load()
        logger.info(f"Connected to Graph Database (NetworkX with {len(self.graph.nodes)} nodes)")

    def _load(self):
        if os.path.exists(GRAPH_FILE):
            try:
                with open(GRAPH_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.graph = nx.node_link_graph(data, multigraph=True)
                logger.info(f"GraphDB: Loaded {len(self.graph.nodes)} nodes and {len(self.graph.edges)} edges from disk.")
            except Exception as e:
                logger.warning(f"Could not load graph from disk: {e}")

    def _save(self):
        try:
            data = nx.node_link_data(self.graph)
            with open(GRAPH_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Could not save graph to disk: {e}")

    def add_relationship(self, entity1: str, relationship: str, entity2: str, metadata: dict = None):
        """Adds a triple to the graph database."""
        self.graph.add_node(entity1)
        self.graph.add_node(entity2)
        self.graph.add_edge(entity1, entity2, relation=relationship, **(metadata or {}))
        self._save() # Auto-save to disk
        logger.info(f"Added Graph Edge: {entity1} -[{relationship}]-> {entity2}")

    def get_context_for_entity(self, entity: str, depth: int = 2, file_filter: List[str] = None) -> List[Dict]:
        """Retrieves connections for a specific entity out to a certain depth, filtered by source file."""
        if entity not in self.graph:
            return []
            
        context = []
        # Orientation="original" means we follow the arrows (Out-edges)
        edges = nx.edge_bfs(self.graph, entity, orientation="original")
        
        for edge_count, edge in enumerate(edges):
            if edge_count >= depth * 8: # Increased limit for more depth
                break
            
            src, dst = edge[0], edge[1]
            try:
                # MultiDiGraph returns (u,v,key) in edge_bfs
                key = edge[2] if len(edge) > 2 else 0
                edge_data = self.graph[src][dst][key]
                
                # Knowledge Gate: Skip if this edge doesn't belong to an allowed file
                if file_filter and edge_data.get("source") not in file_filter:
                    continue
                    
                rel = edge_data.get("relation", "connected_to")
                context.append({
                    "source": f"Graph: {edge_data.get('source', 'System Knowledge')}", 
                    "content": f"{src} -> {rel} -> {dst}"
                })
            except Exception as e:
                logger.debug(f"Graph traversal detail skip: {e}")
                
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

    def get_graph_data(self) -> Dict:
        """Exports the graph in D3 JSON format for the frontend visualizer."""
        nodes = []
        for n in self.graph.nodes():
            # Calculate node size based on its degree (importance)
            val = self.graph.degree(n) + 5
            nodes.append({"id": n, "name": n, "val": val})
            
        links = []
        for u, v, data in self.graph.edges(data=True):
            links.append({
                "source": u, 
                "target": v, 
                "label": data.get("relation", "connected")
            })
            
        return {"nodes": nodes, "links": links}

graph_db = GraphDBClient()
