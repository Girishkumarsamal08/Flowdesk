from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import Ticket

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    # This is the public contact form view
    return templates.TemplateResponse(request=request, name="contact.html")

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request, db: Session = Depends(get_db)):
    # This is the internal dashboard view
    tickets = db.query(Ticket).order_by(Ticket.updated_at.desc()).all()
    return templates.TemplateResponse(request=request, name="dashboard.html", context={"tickets": tickets})

@router.get("/dashboard/ticket/{ticket_id}", response_class=HTMLResponse)
async def ticket_detail_page(request: Request, ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    return templates.TemplateResponse(request=request, name="ticket_detail.html", context={"ticket": ticket})

@router.get("/analytics", response_class=HTMLResponse)
async def analytics_page(request: Request):
    return templates.TemplateResponse(request=request, name="analytics.html")
