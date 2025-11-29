"""Conversation management routes"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/{conversation_id}")
async def get_conversation(conversation_id: int):
    """Get conversation details"""
    return {"message": "Conversation endpoint"}
