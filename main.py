from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from ticket import routes as ticket_routes
from org import routes as org_routes
from user import routes as user_routes
from api.routes import pages, analytics
from db.session import engine, Base
from core.config import settings
from fastapi import WebSocket, WebSocketDisconnect
from core.websocket_manager import manager

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(user_routes.router, prefix="/api/users", tags=["users"])
app.include_router(ticket_routes.router, prefix="/api/tickets", tags=["tickets"])
app.include_router(org_routes.router, prefix="/api/orgs", tags=["organizations"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(pages.router, tags=["pages"])

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:

            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
