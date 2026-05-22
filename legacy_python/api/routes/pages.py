from fastapi import APIRouter, Request, Depends, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import Ticket, Organization, OrganizationConfig, TicketStatus, SenderType

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/", response_class=HTMLResponse)
async def landing_page(request: Request):
    return templates.TemplateResponse(request=request, name="landing.html", context={})

@router.get("/support", response_class=HTMLResponse)
async def support_page(request: Request, org_id: int = 1):
    return templates.TemplateResponse(request=request, name="contact.html", context={"org_id": org_id})

@router.get("/company/auth", response_class=HTMLResponse)
async def company_auth_page(request: Request):
    return templates.TemplateResponse(request=request, name="company_auth.html", context={})

@router.get("/forgot-password", response_class=HTMLResponse)
async def forgot_password_page(request: Request):
    return templates.TemplateResponse(request=request, name="forgot_password.html", context={})

@router.get("/company/dashboard", response_class=HTMLResponse)
async def company_dashboard_page(request: Request, org_id: int = 1, db: Session = Depends(get_db)):
    tickets = db.query(Ticket).filter(Ticket.organization_id == org_id).order_by(Ticket.updated_at.desc()).all()
    return templates.TemplateResponse(request=request, name="dashboard.html", context={"tickets": tickets, "org_id": org_id})

from sqlalchemy.orm import joinedload

@router.get("/company/tickets/{ticket_id}", response_class=HTMLResponse)
async def conversation_view_page(request: Request, ticket_id: int, org_id: int = 1, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).options(joinedload(Ticket.organization)).filter(
        Ticket.id == ticket_id, 
        Ticket.organization_id == org_id
    ).first()
    return templates.TemplateResponse(request=request, name="ticket_detail.html", context={"ticket": ticket, "org_id": org_id})

@router.get("/company/settings", response_class=HTMLResponse)
async def settings_page(request: Request, org_id: int = 1, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    return templates.TemplateResponse(request=request, name="settings.html", context={"org": org})

@router.get("/support/track", response_class=HTMLResponse)
async def track_form_page(request: Request):
    return templates.TemplateResponse(request=request, name="track_form.html", context={})

@router.get("/support/track/{token}", response_class=HTMLResponse)
async def track_status_page(request: Request, token: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.token == token).first()
    if not ticket:
        return templates.TemplateResponse(request=request, name="track_form.html", context={"error": "Invalid Tracking Token"})
    

    if ticket.status == TicketStatus.RESOLVED:
        return templates.TemplateResponse(request=request, name="track_resolved.html", context={"ticket": ticket})
        
    return templates.TemplateResponse(request=request, name="track.html", context={"ticket": ticket})

@router.get("/analytics", response_class=HTMLResponse)
async def analytics_page(request: Request, org_id: int = 1):
    return templates.TemplateResponse(request=request, name="analytics.html", context={"org_id": org_id})
