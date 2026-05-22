from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from db.models import TicketStatus, Priority, SenderType, UserRole

class OrganizationConfigBase(BaseModel):
    max_reply_count: int = 5
    sentiment_threshold: float = 0.3
    response_tone: str = "professional"
    support_email: Optional[EmailStr] = None

class OrganizationConfig(OrganizationConfigBase):
    id: int
    organization_id: int

    class Config:
        from_attributes = True

class OrganizationBase(BaseModel):
    name: str
    domain: str
    company_type: Optional[str] = "Ecommerce"

class OrganizationCreate(OrganizationBase):
    password: str  # Admin password for onboarding
    support_email: EmailStr

class Organization(OrganizationBase):
    id: int
    support_email: Optional[EmailStr] = None
    api_key: str
    created_at: datetime
    config: Optional[OrganizationConfig] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.AGENT

class UserCreate(UserBase):
    password: str
    organization_id: int

class User(UserBase):
    id: int
    organization_id: int
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    org_id: Optional[int] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class MessageBase(BaseModel):
    sender_type: SenderType
    content: str
    sentiment: Optional[str] = None
    reasoning: Optional[str] = None
    is_corrected: bool = False
    corrected_content: Optional[str] = None

class MessageCreate(MessageBase):
    organization_id: Optional[int] = None

class Message(MessageBase):
    id: int
    ticket_id: int
    organization_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TicketBase(BaseModel):
    title: str

class TicketCreate(TicketBase):
    organization_id: int
    customer_email: EmailStr
    customer_name: Optional[str] = None
    initial_message: str

class Ticket(TicketBase):
    id: int
    token: Optional[str] = None
    organization_id: int
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
    organization_id: int

class Customer(CustomerBase):
    id: int
    organization_id: int
    tickets: List[Ticket] = []

    class Config:
        from_attributes = True
