from sqlalchemy.orm import Session
from db.session import SessionLocal
from db.models import Ticket, Message, SenderType, TicketStatus, Priority, Order
from services.ai_service import ai_service
from core.config import settings
from core.websocket_manager import manager
import asyncio
import datetime

async def verify_order_background(ticket_id: int):
    """
    Simulated 'Crawn' Job (Background task) to verify if customer has an order.
    """
    # Simulate processing time for the agent to 'look up' the data
    await asyncio.sleep(2)
    
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return
            
        customer_email = ticket.customer.email
        # Check if an order exists for this email
        order = db.query(Order).filter(Order.customer_email == customer_email).first()
        
        if order:
            ticket.is_verified = 1
            # Add a system message about the successful verification
            verification_msg = Message(
                ticket_id=ticket.id,
                sender_type=SenderType.SYSTEM,
                content=f"Verification Agent: Success. Verified order found for {customer_email}. Product: {order.product_name}. Status: {order.status}."
            )
        else:
            ticket.is_verified = 0
            verification_msg = Message(
                ticket_id=ticket.id,
                sender_type=SenderType.SYSTEM,
                content=f"Verification Agent: No order found for {customer_email} in our records."
            )
            
        db.add(verification_msg)
        db.commit()
        
        # Broadcast the update so the dashboard/detail view updates live
        await manager.broadcast({"event": "ticket_updated", "ticket_id": ticket_id, "is_verified": bool(ticket.is_verified)})
        
        # Now that verification is done, proceed to generate the AI response
        # The AI will now have the system message in history to know whether to trust the customer
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

        # Get latest message
        latest_msg = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.id.desc()).first()
        if not latest_msg or latest_msg.sender_type != SenderType.CUSTOMER:
            return

        # 1. Analyze sentiment immediately for prioritization
        sentiment = ai_service.analyze_sentiment(latest_msg.content)
        latest_msg.sentiment = sentiment
        db.commit()

        # 2. Check 5-message Escalation Rule
        # Count only CUSTOMER messages
        customer_msg_count = db.query(Message).filter(
            Message.ticket_id == ticket_id, 
            Message.sender_type == SenderType.CUSTOMER
        ).count()

        # 2. Check 5-message Escalation Rule (Mentor Requirement)
        needs_escalation = False
        if customer_msg_count >= 5:
            needs_escalation = True
            ticket.priority = Priority.HIGH
        elif sentiment == "negative":
            # Just bump priority, don't escalate yet until 5 messages
            ticket.priority = Priority.HIGH
            
        if needs_escalation:
            ticket.status = TicketStatus.ESCALATED
            ticket.priority = Priority.HIGH
            
            # Generate summary for the agent immediately
            history_msgs = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.created_at.asc()).all()
            history_str = "\n".join([f"{m.sender_type.value}: {m.content}" for m in history_msgs])
            ticket.summary = ai_service.summarize_thread(history_str)
            
            # System message notifying customer of escalation
            escalation_msg = Message(
                ticket_id=ticket.id,
                sender_type=SenderType.AI, # We let the AI sign off
                content="I've reached the limit of my expertise on this specific issue. I've escalated your ticket to my human supervisor who will prioritize this and help you further."
            )
            db.add(escalation_msg)
            db.commit()
            
            await manager.broadcast({"event": "ticket_updated", "ticket_id": ticket_id, "status": "escalated"})
            return

        # 3. Handle First Message vs Follow-up
        if customer_msg_count == 1:
            # First message: Send confirmation and trigger background verification "cron" job
            confirmation_msg = Message(
                ticket_id=ticket.id,
                sender_type=SenderType.SYSTEM,
                content="Auto-Response: We have received your query. Our Agentic AI is currently verifying your order details and reviewing company policy. Please wait a moment..."
            )
            db.add(confirmation_msg)
            db.commit()
            
            await manager.broadcast({"event": "message_added", "ticket_id": ticket_id})
            
            # Trigger background verification (Simulated Cron/Agent Job)
            asyncio.create_task(verify_order_background(ticket_id))
        else:
            # Follow-up message: Just generate AI reply directly (assuming verified already)
            await process_ai_reply(ticket_id)

    finally:
        db.close()

async def process_ai_reply(ticket_id: int):
    """
    Sub-task to generate the actual RAG-based AI reply.
    """
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket or ticket.status == TicketStatus.ESCALATED:
            return

        # Fetch history (including the verification system message)
        history_msgs = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.created_at.asc()).limit(15).all()
        history_str = "\n".join([f"{m.sender_type.value}: {m.content}" for m in history_msgs[:-1]])
        
        # The AI's prompt will now see the Verification message in history!
        latest_msg = history_msgs[-1]
        if latest_msg.sender_type != SenderType.CUSTOMER: return

        ai_reply_content = ai_service.generate_reply(customer_query=latest_msg.content, history=history_str)
        
        ai_msg = Message(
            ticket_id=ticket.id,
            sender_type=SenderType.AI,
            content=ai_reply_content
        )
        db.add(ai_msg)
        ticket.reply_count += 1
        db.commit()

        await manager.broadcast({"event": "ticket_updated", "ticket_id": ticket_id})
    finally:
        db.close()
