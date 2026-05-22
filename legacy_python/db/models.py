from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, Boolean
from sqlalchemy.orm import relationship
import datetime
import enum
from db.session import Base

class TicketStatus(str, enum.Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    ESCALATED = "escalated"

class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class SenderType(str, enum.Enum):
    CUSTOMER = "customer"
    AI = "ai"
    SYSTEM = "system"
    AGENT = "agent"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    AGENT = "agent"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=False)
    company_type = Column(String, nullable=True)  # E.g., Ecommerce, SaaS, Legal
    support_email = Column(String, nullable=True)  # New field
    api_key = Column(String, unique=True, index=True, nullable=False)
    

    smtp_email = Column(String, nullable=True)
    smtp_password = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    config = relationship("OrganizationConfig", back_populates="organization", uselist=False)
    users = relationship("User", back_populates="organization")
    customers = relationship("Customer", back_populates="organization")
    tickets = relationship("Ticket", back_populates="organization")

class OrganizationConfig(Base):
    __tablename__ = "organization_configs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), unique=True)
    max_reply_count = Column(Integer, default=5)
    sentiment_threshold = Column(Float, default=0.3) # Sentiment below this triggers escalation
    response_tone = Column(String, default="professional") # e.g., formal, friendly, professional
    support_email = Column(String, nullable=True)
    
    organization = relationship("Organization", back_populates="config")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)  # New field
    full_name = Column(String)  # New field
    role = Column(Enum(UserRole), default=UserRole.AGENT)
    is_active = Column(Boolean, default=True)  # New field

    organization = relationship("Organization", back_populates="users")
    assigned_tickets = relationship("Ticket", back_populates="executive") # Corrected name

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    email = Column(String, index=True, nullable=False)
    name = Column(String, nullable=True)

    organization = relationship("Organization", back_populates="customers")
    tickets = relationship("Ticket", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    customer_email = Column(String, index=True)
    product_name = Column(String)
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Delivered")

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True) # New ForeignKey
    title = Column(String, nullable=False)
    token = Column(String(6), unique=True, index=True, nullable=True) # 6-digit tracking key
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    priority = Column(Enum(Priority), default=Priority.MEDIUM)
    reply_count = Column(Integer, default=0)
    summary = Column(Text, nullable=True) # AI-generated summary for escalated tickets
    is_verified = Column(Integer, default=0) # 0 for false, 1 for true (Order verified)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="tickets")
    customer = relationship("Customer", back_populates="tickets")
    executive = relationship("User", back_populates="assigned_tickets") # New relationship
    messages = relationship("Message", back_populates="ticket", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    sender_type = Column(Enum(SenderType), nullable=False)
    content = Column(Text, nullable=False)
    sentiment = Column(String, nullable=True) # e.g., positive, neutral, negative
    reasoning = Column(Text, nullable=True)  # New field for AI transparency
    is_corrected = Column(Integer, default=0) # 0 for false, 1 for true (SQLite compat)
    corrected_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    ticket = relationship("Ticket", back_populates="messages")
