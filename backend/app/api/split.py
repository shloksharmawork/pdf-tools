from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Request, Form
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import split_pdf
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "30") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def split_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    start: str = Form(...),
    end: str = Form(...)
):
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        start_page = int(start)
        end_page = int(end)
    except ValueError:
        raise HTTPException(status_code=400, detail="Start and End pages must be numbers")

    file_path = await save_upload_file(file)
    
    try:
        split_path = split_pdf(file_path, start_page, end_page)
        
        background_tasks.add_task(delete_file, file_path)
        background_tasks.add_task(delete_file, split_path)
        
        return FileResponse(
            split_path, 
            filename=f"split_{file.filename}",
            media_type="application/pdf"
        )
    except Exception as e:
        delete_file(file_path)
        raise HTTPException(status_code=500, detail=str(e))
