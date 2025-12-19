from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.services.pdf_service import compare_pdfs
import shutil
import os
import uuid

router = APIRouter()

@router.post("")
async def compare_pdf_endpoint(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...)
):
    # Unique temp filenames
    temp_filename_1 = f"temp_{uuid.uuid4()}_1.pdf"
    temp_filename_2 = f"temp_{uuid.uuid4()}_2.pdf"
    
    try:
        with open(temp_filename_1, "wb") as buffer:
            shutil.copyfileobj(file1.file, buffer)
        with open(temp_filename_2, "wb") as buffer:
            shutil.copyfileobj(file2.file, buffer)
            
        output_path = compare_pdfs(temp_filename_1, temp_filename_2)
        
        return FileResponse(
            output_path, 
            filename=f"comparison_result.pdf", 
            media_type="application/pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        if os.path.exists(temp_filename_1):
            os.remove(temp_filename_1)
        if os.path.exists(temp_filename_2):
            os.remove(temp_filename_2)
