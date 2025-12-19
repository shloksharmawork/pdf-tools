from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import images_to_pdf
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "30") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def scan_to_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Validate images (basic extension check)
    allowed_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
             raise HTTPException(status_code=400, detail=f"File {file.filename} is not a supported image type.")

    saved_paths = []
    try:
        for file in files:
            path = await save_upload_file(file, check_pdf=False)
            saved_paths.append(path)
            
        output_path = images_to_pdf(saved_paths)
        
        for path in saved_paths:
            background_tasks.add_task(delete_file, path)
        background_tasks.add_task(delete_file, output_path)
        
        return FileResponse(
            output_path,
            filename="scanned_document.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        for path in saved_paths:
            delete_file(path)
        raise e
