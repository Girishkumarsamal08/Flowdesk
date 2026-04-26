from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.session import get_db
from db.models import Ticket, Message, TicketStatus, SenderType
from typing import Dict, List

router = APIRouter()

@router.get("/status")
def get_status_counts(organization_id: int, db: Session = Depends(get_db)):
    counts = db.query(Ticket.status, func.count(Ticket.id))\
        .filter(Ticket.organization_id == organization_id)\
        .group_by(Ticket.status).all()
    return {status.value: count for status, count in counts}

@router.get("/sentiment")
def get_sentiment_distribution(organization_id: int, db: Session = Depends(get_db)):
    # Only analyze sentiments from customer messages
    counts = db.query(Message.sentiment, func.count(Message.id))\
        .filter(Message.organization_id == organization_id)\
        .filter(Message.sender_type == SenderType.CUSTOMER)\
        .filter(Message.sentiment != None)\
        .group_by(Message.sentiment).all()
    return {sentiment: count for sentiment, count in counts}

@router.get("/volume")
def get_ticket_volume(organization_id: int, db: Session = Depends(get_db)):
    # Group by date
    counts = db.query(func.date(Ticket.created_at), func.count(Ticket.id))\
        .filter(Ticket.organization_id == organization_id)\
        .group_by(func.date(Ticket.created_at))\
        .order_by(func.date(Ticket.created_at)).all()
    return [{"date": str(date), "count": count} for date, count in counts]
