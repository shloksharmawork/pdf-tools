from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import ocr_pdf
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "10") + "/minute" # Stricter limit for OCR as it is heavy

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def ocr_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    lang: str = Form("eng")
):
    file_path = await save_upload_file(file)
    
    try:
        ocr_path = ocr_pdf(file_path, lang)
        
        background_tasks.add_task(delete_file, file_path)
        background_tasks.add_task(delete_file, ocr_path)
        
        return FileResponse(
            ocr_path, 
            filename=f"ocr_{file.filename}",
            media_type="application/pdf"
        )
    except Exception as e:
        delete_file(file_path)
        raise HTTPException(status_code=500, detail=str(e))
