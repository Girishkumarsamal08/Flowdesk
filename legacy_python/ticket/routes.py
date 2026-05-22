from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from db.models import Ticket, Customer, Message, SenderType, Organization
from schemas import schemas
from ticket.service import process_customer_message

router = APIRouter()

@router.post("/", response_model=schemas.Ticket)
def create_ticket(ticket_in: schemas.TicketCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):

    org = db.query(Organization).filter(Organization.id == ticket_in.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    customer = db.query(Customer).filter(
        Customer.email == ticket_in.customer_email,
        Customer.organization_id == ticket_in.organization_id
    ).first()
    
    if not customer:
        customer = Customer(
            email=ticket_in.customer_email, 
            name=ticket_in.customer_name,
            organization_id=ticket_in.organization_id
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
    

    import random
    token = str(random.randint(100000, 999999))
    
    ticket = Ticket(
        organization_id=ticket_in.organization_id,
        customer_id=customer.id,
        title=ticket_in.title,
        token=token
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    

    message = Message(
        ticket_id=ticket.id,
        organization_id=ticket_in.organization_id,
        sender_type=SenderType.CUSTOMER,
        content=ticket_in.initial_message
    )
    db.add(message)
    db.commit()
    db.refresh(ticket)
    
    background_tasks.add_task(process_customer_message, ticket.id)

    return ticket

@router.get("/", response_model=List[schemas.Ticket])
def list_tickets(organization_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tickets = db.query(Ticket).filter(Ticket.organization_id == organization_id).offset(skip).limit(limit).all()
    return tickets

@router.get("/{ticket_id}", response_model=schemas.Ticket)
def get_ticket(ticket_id: int, organization_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.organization_id == organization_id
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found or access denied")
    return ticket

@router.post("/{ticket_id}/messages", response_model=schemas.Message)
def add_message(ticket_id: int, message_in: schemas.MessageCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not message_in.organization_id:
        raise HTTPException(status_code=400, detail="organization_id is required")
        
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.organization_id == message_in.organization_id
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    message = Message(
        ticket_id=ticket_id,
        organization_id=message_in.organization_id,
        sender_type=message_in.sender_type,
        content=message_in.content,
        sentiment=message_in.sentiment
    )
    db.add(message)
    
    if message_in.sender_type in [SenderType.AI, SenderType.SYSTEM]:
        ticket.reply_count += 1
    
    db.commit()
    db.refresh(message)
    
    if message.sender_type == SenderType.CUSTOMER:
        background_tasks.add_task(process_customer_message, ticket.id)
    
    if message.sender_type == SenderType.AGENT:
        from services.email.service import email_service
        smtp_config = {
            "email": ticket.organization.smtp_email,
            "password": ticket.organization.smtp_password
        }
        background_tasks.add_task(
            email_service.send_customer_email,
            recipient=ticket.customer.email,
            subject=f"Update on your request: {ticket.title}",
            body=message.content,
            company_name=ticket.organization.name,
            customer_name=ticket.customer.name or "Customer",
            smtp_config=smtp_config
        )
        
    return message

@router.post("/{ticket_id}/messages/{message_id}/correct", response_model=schemas.Message)
def correct_message(ticket_id: int, message_id: int, organization_id: int, correction: schemas.MessageCreate, db: Session = Depends(get_db)):
    message = db.query(Message).filter(
        Message.id == message_id, 
        Message.ticket_id == ticket_id,
        Message.organization_id == organization_id
    ).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.sender_type != SenderType.AI:
        raise HTTPException(status_code=400, detail="Only AI messages can be corrected")
    
    message.is_corrected = 1
    message.corrected_content = correction.content
    db.commit()
    db.refresh(message)
    return message

@router.post("/{ticket_id}/polish")
async def polish_ticket_reply(ticket_id: int, data: dict, db: Session = Depends(get_db)):
    draft = data.get("draft")
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    from ai.service import ai_service
    customer_name = ticket.customer.name or "Customer"
    company_name = ticket.organization.name
    
    polished = ai_service.polish_response(draft, customer_name, company_name)
    return {"polished_content": polished}
