from sqlalchemy.orm import Session
from db.session import SessionLocal
from db.models import Ticket, Message, SenderType, TicketStatus, Priority, Order, OrganizationConfig
from ai.service import ai_service
from core.config import settings
from core.websocket_manager import manager
import asyncio
import datetime

async def verify_order_background(ticket_id: int):
    """
    Simulated 'Crawn' Job to verify if customer has an order within the organization.
    """
    await asyncio.sleep(2)
    
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return
            
        customer_email = ticket.customer.email

        order = db.query(Order).filter(
            Order.customer_email == customer_email,
            Order.organization_id == ticket.organization_id
        ).first()
        
        if order:
            ticket.is_verified = 1
            verification_msg = Message(
                ticket_id=ticket.id,
                organization_id=ticket.organization_id,
                sender_type=SenderType.SYSTEM,
                content=f"Verification Agent: Success. Verified order found for {customer_email}. Product: {order.product_name}. Status: {order.status}."
            )
        else:
            ticket.is_verified = 0
            verification_msg = Message(
                ticket_id=ticket.id,
                organization_id=ticket.organization_id,
                sender_type=SenderType.SYSTEM,
                content=f"Verification Agent: No order found for {customer_email} in our records."
            )
            
        db.add(verification_msg)
        db.commit()
        
        await manager.broadcast({"event": "ticket_updated", "ticket_id": ticket_id, "is_verified": bool(ticket.is_verified)})
        await process_ai_reply(ticket_id)
        
    finally:
        db.close()

async def process_customer_message(ticket_id: int):
    """
    Main entry point when a customer submits a ticket or message.
    """
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket: return

        config = db.query(OrganizationConfig).filter(OrganizationConfig.organization_id == ticket.organization_id).first()
        if not config:

            config = OrganizationConfig(organization_id=ticket.organization_id)
            db.add(config)
            db.commit()
            db.refresh(config)

        latest_msg = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.id.desc()).first()
        if not latest_msg or latest_msg.sender_type != SenderType.CUSTOMER:
            return

        sentiment = ai_service.analyze_sentiment(latest_msg.content)
        latest_msg.sentiment = sentiment
        db.commit()

        customer_msg_count = db.query(Message).filter(
            Message.ticket_id == ticket_id, 
            Message.sender_type == SenderType.CUSTOMER
        ).count()

        needs_escalation = False
        escalation_reason = []
        

        if customer_msg_count >= config.max_reply_count:
            needs_escalation = True
            escalation_reason.append(f"Max replies ({config.max_reply_count}) exceeded")
        

        critical_keywords = ["lawyer", "sue", "legal", "fraud", "scam"]
        if any(kw in latest_msg.content.lower() for kw in critical_keywords):
            needs_escalation = True
            ticket.priority = Priority.HIGH
            escalation_reason.append("Critical keywords detected")

        if sentiment == "negative":
            ticket.priority = Priority.HIGH

            needs_escalation = True
            escalation_reason.append("Negative sentiment detected")
            
        if needs_escalation:
            ticket.status = TicketStatus.ESCALATED
            ticket.priority = Priority.HIGH
            

            history_msgs = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.created_at.asc()).all()
            history_str = "\n".join([f"{m.sender_type.value}: {m.content}" for m in history_msgs])
            ticket.summary = ai_service.summarize_thread(history_str)
            
            escalation_msg = Message(
                ticket_id=ticket.id,
                organization_id=ticket.organization_id,
                sender_type=SenderType.AI,
                content="I've reached the limit of my expertise on this specific issue. I've escalated your ticket to my human supervisor who will prioritize this and help you further.",
                reasoning=f"Escalation triggered: {', '.join(escalation_reason)}"
            )
            db.add(escalation_msg)
            db.commit()
            
            await manager.broadcast({"event": "ticket_updated", "ticket_id": ticket_id, "status": "escalated"})
            return

        if customer_msg_count == 1:
            from services.email.service import email_service
            
            confirmation_msg = Message(
                ticket_id=ticket.id,
                organization_id=ticket.organization_id,
                sender_type=SenderType.SYSTEM,
                content="Auto-Response: We have received your query. Our Agentic AI is currently verifying your details and reviewing company policy. Please wait a moment..."
            )
            db.add(confirmation_msg)
            db.commit()
            

            smtp_config = {
                "email": ticket.organization.smtp_email,
                "password": ticket.organization.smtp_password
            }
            
            tracking_link = f"{settings.BASE_URL}/support/track/{ticket.token}" if hasattr(settings, 'BASE_URL') else f"/support/track/{ticket.token}"
            
            email_body = f"""We have received your support request regarding: {ticket.title}.
            
Your unique tracking token is: {ticket.token}

You can track the live progress of your request at any time here:
{tracking_link}

Our AI Agent is currently reviewing your request against company policies. A specialist will be notified if further assistance is required."""

            email_service.send_customer_email(
                recipient=ticket.customer.email,
                subject=f"Request Received: {ticket.title} [Token: {ticket.token}]",
                body=email_body,
                company_name=ticket.organization.name,
                customer_name=ticket.customer.name or "Customer",
                smtp_config=smtp_config
            )
            
            await manager.broadcast({"event": "message_added", "ticket_id": ticket_id})
            asyncio.create_task(verify_order_background(ticket_id))
        else:
            await process_ai_reply(ticket_id)

    finally:
        db.close()

async def process_ai_reply(ticket_id: int):
    """
    Generate the actual RAG-based AI reply using organization context.
    """
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket or ticket.status == TicketStatus.ESCALATED:
            return

        config = db.query(OrganizationConfig).filter(OrganizationConfig.organization_id == ticket.organization_id).first()
        tone = config.response_tone if config else "professional"

        history_msgs = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.created_at.asc()).limit(15).all()
        history_str = "\n".join([f"{m.sender_type.value}: {m.content}" for m in history_msgs[:-1]])
        
        latest_msg = history_msgs[-1]
        if latest_msg.sender_type != SenderType.CUSTOMER: return

        ai_result = ai_service.generate_reply(
            organization_id=ticket.organization_id,
            customer_query=latest_msg.content, 
            history=history_str,
            tone=tone
        )
        
        ai_msg = Message(
            ticket_id=ticket.id,
            organization_id=ticket.organization_id,
            sender_type=SenderType.AI,
            content=ai_result["content"],
            reasoning=ai_result["reasoning"]
        )
        db.add(ai_msg)
        ticket.reply_count += 1
        db.commit()

        await manager.broadcast({"event": "ticket_updated", "ticket_id": ticket_id})
    finally:
        db.close()
