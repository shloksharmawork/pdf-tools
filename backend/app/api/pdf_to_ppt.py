from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import pdf_to_ppt
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "10") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def pdf_to_ppt_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    file_path = await save_upload_file(file)
    
    try:
        output_path = pdf_to_ppt(file_path)
        
        filename = f"{os.path.splitext(file.filename)[0]}.pptx"
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            
        background_tasks.add_task(delete_file, file_path)
        background_tasks.add_task(delete_file, output_path)
        
        return FileResponse(
            output_path, 
            filename=filename,
            media_type=media_type
        )
    except Exception as e:
        delete_file(file_path)
        raise HTTPException(status_code=500, detail=str(e))
