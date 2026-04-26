from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import User, UserRole
from schemas import schemas
from core.auth import verify_password, create_access_token

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "org_id": user.organization_id, "role": user.role.value}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Mock storage for reset codes (In production, use Redis or DB with TTL)
reset_codes = {}

@router.post("/forgot-password/request")
def request_reset(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    # Generate unique code (For demo, we use '123456')
    code = "123456"
    reset_codes[email] = code
    print(f"DEBUG: Reset code for {email} is {code}")
    return {"message": "Verification code sent to your email (Mock: 123456)"}

@router.post("/forgot-password/verify")
def verify_reset_code(data: dict):
    email = data.get("email")
    code = data.get("code")
    if reset_codes.get(email) == code:
        return {"message": "Code verified"}
    raise HTTPException(status_code=400, detail="Invalid verification code")

@router.post("/forgot-password/reset")
def reset_password(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    code = data.get("code")
    new_password = data.get("new_password")
    
    if reset_codes.get(email) != code:
        raise HTTPException(status_code=400, detail="Unauthorized reset attempt")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    from core.auth import get_password_hash
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    # Clear the code
    del reset_codes[email]
    return {"message": "Password changed successfully"}

@router.get("/me", response_model=schemas.User)
def get_me(db: Session = Depends(get_db)):
    # This will be secured in the next step with a dependency
    pass
