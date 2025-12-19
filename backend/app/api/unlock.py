from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import unlock_pdf
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "30") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def unlock_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(default=None)
):
    # Password is now optional. We attempt bypass if not provided.

    file_path = await save_upload_file(file)
    
    try:
        unlocked_path = unlock_pdf(file_path, password)
        
        background_tasks.add_task(delete_file, file_path)
        background_tasks.add_task(delete_file, unlocked_path)
        
        return FileResponse(
            unlocked_path, 
            filename=f"unlocked_{file.filename}",
            media_type="application/pdf"
        )
    except HTTPException as he:
        delete_file(file_path)
        raise he
    except Exception as e:
        delete_file(file_path)
        raise HTTPException(status_code=500, detail=str(e))
