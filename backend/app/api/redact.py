from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from app.services.pdf_service import redact_pdf
import shutil
import os
import uuid
import json

router = APIRouter()

@router.post("")
async def redact_pdf_endpoint(
    file: UploadFile = File(...),
    redactions: str = Form(...) # JSON string of redactions
):
    temp_filename = f"temp_{uuid.uuid4()}.pdf"
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        try:
            redactions_list = json.loads(redactions)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid redactions JSON")

        output_path = redact_pdf(temp_filename, redactions_list)
        
        return FileResponse(
            output_path, 
            filename=f"redacted_{file.filename}", 
            media_type="application/pdf"
        )
        
    except Exception as e:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        raise HTTPException(status_code=500, detail=str(e))
