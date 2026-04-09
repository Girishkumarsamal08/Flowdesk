from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from db.models import Ticket, Customer, Message, SenderType
from schemas import schemas
from services.ticket_service import process_customer_message

router = APIRouter()

@router.post("/", response_model=schemas.Ticket)
def create_ticket(ticket_in: schemas.TicketCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Find or create customer
    customer = db.query(Customer).filter(Customer.email == ticket_in.customer_email).first()
    if not customer:
        customer = Customer(email=ticket_in.customer_email, name=ticket_in.customer_name)
        db.add(customer)
        db.commit()
        db.refresh(customer)
    
    # Create ticket
    ticket = Ticket(
        customer_id=customer.id,
        title=ticket_in.title,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Add initial message
    message = Message(
        ticket_id=ticket.id,
        sender_type=SenderType.CUSTOMER,
        content=ticket_in.initial_message
    )
    db.add(message)
    db.commit()
    db.refresh(ticket) # Refresh ticket to load relationships
    
    # Process AI reply in background for initial message
    background_tasks.add_task(process_customer_message, ticket.id)

    return ticket

@router.get("/", response_model=List[schemas.Ticket])
def list_tickets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tickets = db.query(Ticket).offset(skip).limit(limit).all()
    return tickets

@router.get("/{ticket_id}", response_model=schemas.Ticket)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.post("/{ticket_id}/messages", response_model=schemas.Message)
def add_message(ticket_id: int, message_in: schemas.MessageCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    message = Message(
        ticket_id=ticket_id,
        sender_type=message_in.sender_type,
        content=message_in.content,
        sentiment=message_in.sentiment
    )
    db.add(message)
    
    # Increment reply count if it's an AI or System message
    if message_in.sender_type in [SenderType.AI, SenderType.SYSTEM]:
        ticket.reply_count += 1
    
    db.commit()
    db.refresh(message)
    
    # Process AI reply in background if sent by customer
    if message.sender_type == SenderType.CUSTOMER:
        background_tasks.add_task(process_customer_message, ticket.id)
        
    return message

@router.post("/{ticket_id}/messages/{message_id}/correct", response_model=schemas.Message)
def correct_message(ticket_id: int, message_id: int, correction: schemas.MessageCreate, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id, Message.ticket_id == ticket_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.sender_type != SenderType.AI:
        raise HTTPException(status_code=400, detail="Only AI messages can be corrected")
    
    message.is_corrected = 1
    message.corrected_content = correction.content
    db.commit()
    db.refresh(message)
    return message
