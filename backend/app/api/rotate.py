from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from app.services.pdf_service import rotate_pdf
import shutil
import os
import uuid

router = APIRouter()

@router.post("")
async def rotate_pdf_endpoint(
    file: UploadFile = File(...),
    angle: int = Form(...)
):
    temp_filename = f"temp_{uuid.uuid4()}.pdf"
    
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
            
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_path = rotate_pdf(temp_filename, angle)
        
        return FileResponse(
            output_path, 
            filename=f"rotated_{file.filename}", 
            media_type="application/pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
