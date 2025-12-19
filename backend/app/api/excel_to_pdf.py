from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.pdf_service import excel_to_pdf
from app.utils.file_manager import save_upload_file, delete_file
import os

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MIN", "10") + "/minute"

router = APIRouter()

@router.post("/")
@limiter.limit(RATE_LIMIT)
async def excel_to_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(('.xls', '.xlsx')):
         raise HTTPException(status_code=400, detail="File must be an Excel spreadsheet (.xls or .xlsx)")

    # Disable generic PDF check
    file_path = await save_upload_file(file, check_pdf=False)
    
    try:
        output_path = excel_to_pdf(file_path)
        
        filename = f"{os.path.splitext(file.filename)[0]}.pdf"
        media_type = "application/pdf"
            
        background_tasks.add_task(delete_file, file_path)
        background_tasks.add_task(delete_file, output_path)
        
        return FileResponse(
            output_path, 
            filename=filename,
            media_type=media_type
        )
    except Exception as e:
        delete_file(file_path)
        print(f"Error in excel_to_pdf_endpoint: {e}") 
        raise HTTPException(status_code=500, detail=str(e))
