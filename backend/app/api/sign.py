from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import sign_pdf
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "30") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def sign_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    signature: UploadFile = File(...),
    page_num: int = Form(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(150),
    height: int = Form(60)
):
    file_path = await save_upload_file(file)
    signature_path = await save_upload_file(signature)
    
    try:
        signed_path = sign_pdf(file_path, signature_path, page_num, x, y, width, height)
        
        background_tasks.add_task(delete_file, file_path)
        background_tasks.add_task(delete_file, signature_path)
        background_tasks.add_task(delete_file, signed_path)
        
        return FileResponse(
            signed_path, 
            filename=f"signed_{file.filename}",
            media_type="application/pdf"
        )
    except Exception as e:
        delete_file(file_path)
        delete_file(signature_path)
        raise HTTPException(status_code=500, detail=str(e))
