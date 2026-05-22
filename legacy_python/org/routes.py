from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import uuid
import os

from db.session import get_db
from db.models import Organization, OrganizationConfig, User, UserRole
from schemas import schemas
from ai.rag_service import rag_service
from core.auth import get_password_hash

router = APIRouter()

@router.post("/", response_model=schemas.Organization)
def create_organization(org_in: schemas.OrganizationCreate, db: Session = Depends(get_db)):

    existing = db.query(Organization).filter(Organization.domain == org_in.domain).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization with this domain already exists")
    

    api_key = f"fd_{uuid.uuid4().hex}"
    org = Organization(
        name=org_in.name,
        domain=org_in.domain,
        company_type=org_in.company_type,
        support_email=org_in.support_email,
        api_key=api_key
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    

    admin_user = User(
        organization_id=org.id,
        email=org_in.support_email, # Default admin email
        hashed_password=get_password_hash(org_in.password),
        full_name=f"{org_in.name} Admin",
        role=UserRole.ADMIN
    )
    db.add(admin_user)
    

    config = OrganizationConfig(organization_id=org.id)
    db.add(config)
    db.commit()
    

    rag_service.initialize_organization_store(org.id)
    
    return org

@router.get("/{org_id}", response_model=schemas.Organization)
def get_organization(org_id: int, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.put("/{org_id}/config", response_model=schemas.OrganizationConfig)
def update_config(org_id: int, config_in: schemas.OrganizationConfigBase, db: Session = Depends(get_db)):
    config = db.query(OrganizationConfig).filter(OrganizationConfig.organization_id == org_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    for field, value in config_in.dict(exclude_unset=True).items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    return config

@router.post("/{org_id}/policies")
async def upload_policy(org_id: int, file: UploadFile = File(...)):

    
    org_dir = os.path.join("data/policies", str(org_id))
    os.makedirs(org_dir, exist_ok=True)
    
    file_path = os.path.join(org_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    

    rag_service.initialize_organization_store(org_id)
    
    return {"message": f"Policy {file.filename} uploaded and indexed successfully"}

@router.patch("/{org_id}/settings")
def update_org_settings(org_id: int, data: dict, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    if "smtp_email" in data:
        org.smtp_email = data["smtp_email"]
    if "smtp_password" in data:
        org.smtp_password = data["smtp_password"]
        
    db.commit()
    return {"message": "Settings updated"}
