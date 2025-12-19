from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import jpg_to_pdf
from app.utils.file_manager import save_upload_file, delete_file
import os
from typing import List

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "10") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def jpg_to_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    saved_files = []
    
    try:
        # Validate and save all files
        for file in files:
            if not file.filename.lower().endswith(('.jpg', '.jpeg')):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a JPG/JPEG")
            
            file_path = await save_upload_file(file, check_pdf=False)
            saved_files.append(file_path)
            
        if not saved_files:
             raise HTTPException(status_code=400, detail="No valid files uploaded")

        output_path = jpg_to_pdf(saved_files)
        
        filename = "converted_images.pdf" if len(saved_files) > 1 else f"{os.path.splitext(files[0].filename)[0]}.pdf"
        media_type = "application/pdf"
            
        # Cleanup input files
        for f in saved_files:
            background_tasks.add_task(delete_file, f)
            
        background_tasks.add_task(delete_file, output_path)
        
        return FileResponse(
            output_path, 
            filename=filename,
            media_type=media_type
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        for f in saved_files:
            delete_file(f)
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Cleanup on error
        for f in saved_files:
            delete_file(f)
        raise HTTPException(status_code=500, detail=str(e))
