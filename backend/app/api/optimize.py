from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import optimize_pdf
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "30") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def optimize_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    profile: str = Form("ebook")  # Default to ebook
):
    if profile not in ["screen", "ebook", "printer"]:
        raise HTTPException(status_code=400, detail="Invalid profile. Choose 'screen', 'ebook', or 'printer'.")

    file_path = await save_upload_file(file)
    
    try:
        optimized_path = optimize_pdf(file_path, profile)
        
        background_tasks.add_task(delete_file, file_path)
        background_tasks.add_task(delete_file, optimized_path)
        
        return FileResponse(
            optimized_path, 
            filename=f"optimized_{profile}_{file.filename}",
            media_type="application/pdf"
        )
    except Exception as e:
        delete_file(file_path)
        raise HTTPException(status_code=500, detail=str(e))
