from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from api.routes import tickets, pages, analytics
from db.session import engine, Base
from core.config import settings
from fastapi import WebSocket, WebSocketDisconnect
from core.websocket_manager import manager

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(tickets.router, prefix="/api/tickets", tags=["tickets"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(pages.router, tags=["pages"])

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
