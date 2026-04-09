from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from db.models import TicketStatus, Priority, SenderType

class MessageBase(BaseModel):
    sender_type: SenderType
    content: str
    sentiment: Optional[str] = None
    is_corrected: bool = False
    corrected_content: Optional[str] = None

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    ticket_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TicketBase(BaseModel):
    title: str

class TicketCreate(TicketBase):
    customer_email: EmailStr
    customer_name: Optional[str] = None
    initial_message: str

class Ticket(TicketBase):
    id: int
    customer_id: int
    status: TicketStatus
    priority: Priority
    reply_count: int
    summary: Optional[str] = None
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    messages: List[Message] = []

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    tickets: List[Ticket] = []

    class Config:
        from_attributes = True
