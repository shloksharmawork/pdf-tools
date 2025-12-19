from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import protect_pdf
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "30") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def protect_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(...)
):
    if not password:
        raise HTTPException(status_code=400, detail="Password is required to protect PDF.")

    file_path = await save_upload_file(file)
    
    try:
        protected_path = protect_pdf(file_path, password)
        
        background_tasks.add_task(delete_file, file_path)
        background_tasks.add_task(delete_file, protected_path)
        
        return FileResponse(
            protected_path, 
            filename=f"protected_{file.filename}",
            media_type="application/pdf"
        )
    except Exception as e:
        delete_file(file_path)
        raise HTTPException(status_code=500, detail=str(e))
