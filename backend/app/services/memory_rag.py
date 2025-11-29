"""
Memory RAG System for Personalized Memory Retrieval
Uses embeddings and semantic search to retrieve relevant personal information
"""

from typing import List, Dict, Optional
from openai import AsyncOpenAI
from sqlalchemy.orm import Session
from ..models import MemoryEntry, Patient
from ..config import settings
import numpy as np
import json

class MemoryRAG:
    """
    Retrieval-Augmented Generation system for personal memories
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_model = "text-embedding-3-small"
        self.top_k = 5  # Number of memories to retrieve
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        try:
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return []
    
    async def embed_memory_entry(self, memory: MemoryEntry) -> List[float]:
        """
        Create embedding for a memory entry
        Combines title, description, and key metadata
        """
        # Construct text to embed
        text_parts = [memory.title]
        
        if memory.description:
            text_parts.append(memory.description)
        
        if memory.metadata:
            # Add key metadata fields
            for key, value in memory.metadata.items():
                if isinstance(value, (str, int, float)):
                    text_parts.append(f"{key}: {value}")
        
        full_text = " | ".join(text_parts)
        return await self.generate_embedding(full_text)
    
    async def store_memory(
        self,
        db: Session,
        patient_id: int,
        entry_type: str,
        title: str,
        description: str,
        metadata: Dict,
        importance_score: float = 5.0,
        created_by: int = None,
        **kwargs
    ) -> MemoryEntry:
        """
        Store a new memory entry with embedding
        """
        # Create memory entry
        memory = MemoryEntry(
            patient_id=patient_id,
            entry_type=entry_type,
            title=title,
            description=description,
            metadata=metadata,
            importance_score=importance_score,
            created_by=created_by,
            **kwargs
        )
        
        # Generate and store embedding
        embedding = await self.embed_memory_entry(memory)
        memory.embedding = embedding  # Store as JSON array
        
        db.add(memory)
        db.commit()
        db.refresh(memory)
        
        return memory
    
    async def retrieve_relevant_memories(
        self,
        db: Session,
        patient_id: int,
        query: str,
        top_k: Optional[int] = None,
        entry_types: Optional[List[str]] = None,
        min_importance: float = 0.0
    ) -> List[Dict]:
        """
        Retrieve most relevant memories for a query using semantic search
        
        Args:
            db: Database session
            patient_id: Patient ID
            query: Query text to find relevant memories
            top_k: Number of results (default: self.top_k)
            entry_types: Filter by entry types (e.g., ["person", "event"])
            min_importance: Minimum importance score
        
        Returns:
            List of memory dictionaries with similarity scores
        """
        if top_k is None:
            top_k = self.top_k
        
        # Generate query embedding
        query_embedding = await self.generate_embedding(query)
        if not query_embedding:
            return []
        
        # Get all memories for patient
        query_obj = db.query(MemoryEntry).filter(
            MemoryEntry.patient_id == patient_id,
            MemoryEntry.importance_score >= min_importance
        )
        
        if entry_types:
            query_obj = query_obj.filter(MemoryEntry.entry_type.in_(entry_types))
        
        memories = query_obj.all()
        
        if not memories:
            return []
        
        # Calculate cosine similarity for each memory
        results = []
        query_vec = np.array(query_embedding)
        
        for memory in memories:
            if not memory.embedding:
                continue
            
            memory_vec = np.array(memory.embedding)
            
            # Cosine similarity
            similarity = np.dot(query_vec, memory_vec) / (
                np.linalg.norm(query_vec) * np.linalg.norm(memory_vec)
            )
            
            # Boost by importance score
            boosted_score = similarity * (1 + (memory.importance_score / 20))
            
            results.append({
                "id": memory.id,
                "title": memory.title,
                "description": memory.description,
                "entry_type": memory.entry_type,
                "metadata": memory.metadata,
                "importance_score": memory.importance_score,
                "photo_url": memory.photo_url,
                "similarity_score": float(similarity),
                "boosted_score": float(boosted_score)
            })
        
        # Sort by boosted score and return top k
        results.sort(key=lambda x: x["boosted_score"], reverse=True)
        
        # Update reference counts for top memories
        for result in results[:top_k]:
            memory = db.query(MemoryEntry).filter(MemoryEntry.id == result["id"]).first()
            if memory:
                memory.reference_count += 1
                memory.last_referenced = db.query(MemoryEntry).filter(MemoryEntry.id == result["id"]).first().updated_at
        db.commit()
        
        return results[:top_k]
    
    async def get_context_for_conversation(
        self,
        db: Session,
        patient_id: int,
        recent_messages: List[str],
        conversation_type: str
    ) -> List[Dict]:
        """
        Get relevant context for a conversation based on recent messages
        
        Args:
            db: Database session
            patient_id: Patient ID
            recent_messages: Last few messages from user
            conversation_type: Type of conversation
        
        Returns:
            List of relevant memories
        """
        # Combine recent messages into query
        query = " ".join(recent_messages[-3:])  # Last 3 messages
        
        # Adjust retrieval based on conversation type
        if conversation_type == "reminiscence":
            entry_types = ["event", "person", "place"]
            top_k = 7
        elif conversation_type == "orientation":
            entry_types = ["routine", "person"]
            top_k = 3
        elif conversation_type == "cst_session":
            entry_types = None  # All types
            top_k = 5
        else:
            entry_types = None
            top_k = 4
        
        return await self.retrieve_relevant_memories(
            db=db,
            patient_id=patient_id,
            query=query,
            top_k=top_k,
            entry_types=entry_types,
            min_importance=3.0
        )
    
    def get_high_importance_memories(
        self,
        db: Session,
        patient_id: int,
        min_importance: float = 8.0,
        limit: int = 10
    ) -> List[MemoryEntry]:
        """Get highest importance memories (for briefing caregivers, etc.)"""
        return db.query(MemoryEntry).filter(
            MemoryEntry.patient_id == patient_id,
            MemoryEntry.importance_score >= min_importance
        ).order_by(
            MemoryEntry.importance_score.desc()
        ).limit(limit).all()
    
    def get_frequent_memories(
        self,
        db: Session,
        patient_id: int,
        limit: int = 10
    ) -> List[MemoryEntry]:
        """Get most frequently referenced memories"""
        return db.query(MemoryEntry).filter(
            MemoryEntry.patient_id == patient_id
        ).order_by(
            MemoryEntry.reference_count.desc()
        ).limit(limit).all()
    
    async def auto_categorize_memory(self, title: str, description: str) -> Dict:
        """
        Use LLM to automatically categorize and extract metadata from memory
        """
        prompt = f"""Analyze this memory entry and extract structured information.

Title: {title}
Description: {description}

Provide:
1. entry_type: One of [person, place, event, routine, preference, achievement]
2. importance_score: 1-10 (how significant is this memory?)
3. metadata: Relevant structured data based on type
   - For person: {{"relationship": "...", "age": ..., "traits": [...]}}
   - For place: {{"location": "...", "time_period": "...", "emotions": [...]}}
   - For event: {{"date": "...", "attendees": [...], "significance": "..."}}
   - For routine: {{"frequency": "...", "time": "...", "steps": [...]}}
   - For preference: {{"category": "...", "intensity": "..."}}

Return as JSON."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error auto-categorizing: {e}")
            return {
                "entry_type": "general",
                "importance_score": 5.0,
                "metadata": {}
            }


class MemoryGraphBuilder:
    """
    Builds and maintains a graph of relationships between memories
    Helps identify connections and patterns
    """
    
    def __init__(self):
        pass
    
    def find_related_memories(
        self,
        db: Session,
        memory_id: int,
        relationship_types: Optional[List[str]] = None
    ) -> List[MemoryEntry]:
        """
        Find memories related to a given memory
        Based on shared people, places, timeframes, etc.
        """
        memory = db.query(MemoryEntry).filter(MemoryEntry.id == memory_id).first()
        if not memory:
            return []
        
        related = []
        
        # Find memories with overlapping metadata
        all_memories = db.query(MemoryEntry).filter(
            MemoryEntry.patient_id == memory.patient_id,
            MemoryEntry.id != memory_id
        ).all()
        
        for other in all_memories:
            if self._has_overlap(memory.metadata, other.metadata):
                related.append(other)
        
        return related[:10]  # Limit to 10 related
    
    def _has_overlap(self, meta1: Dict, meta2: Dict) -> bool:
        """Check if two metadata dicts have overlapping values"""
        if not meta1 or not meta2:
            return False
        
        # Simple overlap check - can be made more sophisticated
        for key in meta1:
            if key in meta2:
                if meta1[key] == meta2[key]:
                    return True
                # Check for list overlap
                if isinstance(meta1[key], list) and isinstance(meta2[key], list):
                    if set(meta1[key]) & set(meta2[key]):
                        return True
        
        return False
