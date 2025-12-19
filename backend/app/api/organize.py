from fastapi import APIRouter, UploadFile, File, HTTPException, Form, BackgroundTasks, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import reorder_pages
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "30") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def reorder_pages_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    pages: str = Form(...) # Comma-separated 1-based page numbers
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if not pages:
        raise HTTPException(status_code=400, detail="Page order must be specified")

    try:
        page_indices = []
        for p in pages.split(","):
            p = p.strip()
            if not p.isdigit():
                 raise HTTPException(status_code=400, detail=f"Invalid page number format: {p}")
            val = int(p)
            if val < 1:
                 raise HTTPException(status_code=400, detail=f"Page numbers must be >= 1. Got: {val}")
            page_indices.append(val - 1)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid page numbers format")

    saved_path = await save_upload_file(file)
    
    try:
        output_path = reorder_pages(saved_path, page_indices)
        
        background_tasks.add_task(delete_file, saved_path)
        background_tasks.add_task(delete_file, output_path)
        
        return FileResponse(
            output_path,
            filename=f"organized_{file.filename}",
            media_type="application/pdf"
        )
    except Exception as e:
        delete_file(saved_path)
        raise e
