"""Memory management routes"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.memory_rag import MemoryRAG

router = APIRouter()
memory_rag = MemoryRAG()

@router.post("/")
async def create_memory(
    patient_id: int,
    title: str,
    description: str,
    entry_type: str,
    db: Session = Depends(get_db)
):
    """Create a new memory entry"""
    # Auto-categorize if needed
    metadata = await memory_rag.auto_categorize_memory(title, description)
    
    memory = await memory_rag.store_memory(
        db=db,
        patient_id=patient_id,
        entry_type=entry_type or metadata.get("entry_type", "general"),
        title=title,
        description=description,
        metadata=metadata.get("metadata", {}),
        importance_score=metadata.get("importance_score", 5.0)
    )
    
    return memory

@router.get("/{patient_id}")
async def get_patient_memories(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """Get all memories for a patient"""
    from ..models import MemoryEntry
    memories = db.query(MemoryEntry).filter(
        MemoryEntry.patient_id == patient_id
    ).order_by(MemoryEntry.importance_score.desc()).all()
    return memories
