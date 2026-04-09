from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
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

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)

    tickets = relationship("Ticket", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_email = Column(String, index=True)
    product_name = Column(String)
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Delivered")

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    title = Column(String, index=True)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    priority = Column(Enum(Priority), default=Priority.MEDIUM)
    reply_count = Column(Integer, default=0)
    summary = Column(Text, nullable=True) # AI-generated summary for escalated tickets
    is_verified = Column(Integer, default=0) # 0 for false, 1 for true (Order verified)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="tickets")
    messages = relationship("Message", back_populates="ticket", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    sender_type = Column(Enum(SenderType), nullable=False)
    content = Column(Text, nullable=False)
    sentiment = Column(String, nullable=True) # e.g., positive, neutral, negative
    is_corrected = Column(Integer, default=0) # 0 for false, 1 for true (SQLite compat)
    corrected_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    ticket = relationship("Ticket", back_populates="messages")
