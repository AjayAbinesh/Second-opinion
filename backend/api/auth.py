from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from backend.models import models
from backend.schemas import schemas

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    db_user_name = db.query(models.User).filter(models.User.username == user_in.username).first()
    if db_user_name:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    db_user_email = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Create the user
    hashed_password = get_password_hash(user_in.password)
    # Check if this is the first user (make them admin)
    role = "admin" if db.query(models.User).count() == 0 else "student"
    
    new_user = models.User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create default settings
    default_settings = models.UserSetting(user_id=new_user.id, theme="dark")
    db.add(default_settings)
    db.commit()
    
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/settings", response_model=schemas.UserSettingsOut)
def get_user_settings(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_settings = db.query(models.UserSetting).filter(models.UserSetting.user_id == current_user.id).first()
    if not user_settings:
        user_settings = models.UserSetting(user_id=current_user.id, theme="dark")
        db.add(user_settings)
        db.commit()
        db.refresh(user_settings)
    return user_settings

@router.put("/settings", response_model=schemas.UserSettingsOut)
def update_user_settings(
    settings_in: schemas.UserSettingsUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_settings = db.query(models.UserSetting).filter(models.UserSetting.user_id == current_user.id).first()
    if not user_settings:
        user_settings = models.UserSetting(user_id=current_user.id)
        db.add(user_settings)
        
    if settings_in.theme is not None:
        user_settings.theme = settings_in.theme
    if settings_in.groq_api_key is not None:
        user_settings.groq_api_key = settings_in.groq_api_key
        
    db.commit()
    db.refresh(user_settings)
    return user_settings
