from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import merge_pdfs
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "30") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def merge_pdfs_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 files are required for merging.")

    saved_paths = []
    try:
        for file in files:
            path = await save_upload_file(file)
            saved_paths.append(path)
            
        merged_path = merge_pdfs(saved_paths)
        
        for path in saved_paths:
            background_tasks.add_task(delete_file, path)
        background_tasks.add_task(delete_file, merged_path)
        
        return FileResponse(
            merged_path, 
            filename="merged_document.pdf", 
            media_type="application/pdf"
        )
    except Exception as e:
        for path in saved_paths:
            delete_file(path)
        raise HTTPException(status_code=500, detail=str(e))
