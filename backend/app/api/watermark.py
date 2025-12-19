from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from app.services.pdf_service import add_watermark
import shutil
import os
import uuid

router = APIRouter()

@router.post("")
async def watermark_endpoint(
    file: UploadFile = File(...),
    text: str = Form(...),
    opacity: float = Form(0.5),
    rotation: int = Form(45),
    fontSize: int = Form(60)
):
    temp_filename = f"temp_{uuid.uuid4()}.pdf"
    
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
            
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_path = add_watermark(temp_filename, text, opacity, rotation, fontSize)
        
        return FileResponse(
            output_path, 
            filename=f"watermarked_{file.filename}", 
            media_type="application/pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
