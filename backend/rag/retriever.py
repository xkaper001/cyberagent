from typing import List, Dict, Any
from backend.schemas.cyber import KnowledgeItemSchema
from backend.services.mock_data import INITIAL_KNOWLEDGE

class SecurityIntelligenceRAG:
    def __init__(self):
        self._documents: List[KnowledgeItemSchema] = INITIAL_KNOWLEDGE

    def search(self, query: str, top_k: int = 3) -> List[KnowledgeItemSchema]:
        query_lower = query.lower()
        results = []
        for doc in self._documents:
            score = 0
            if doc.cveId and doc.cveId.lower() in query_lower:
                score += 10
            if doc.title.lower() in query_lower or query_lower in doc.title.lower():
                score += 5
            if doc.affectedTech.lower() in query_lower:
                score += 4
            if doc.category.lower() in query_lower:
                score += 3
            if score > 0:
                results.append((score, doc))
        
        results.sort(key=lambda x: x[0], reverse=True)
        if results:
            return [r[1] for r in results[:top_k]]
        return self._documents[:top_k]

rag_engine = SecurityIntelligenceRAG()
