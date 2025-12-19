from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from app.services.pdf_service import edit_pdf
import shutil
import os
import uuid
import json

router = APIRouter()

@router.post("")
async def edit_pdf_endpoint(
    file: UploadFile = File(...),
    edits: str = Form(...), # JSON string
    images: list[UploadFile] = File(default=None)
):
    temp_filename = f"temp_{uuid.uuid4()}.pdf"
    temp_images = []
    
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        try:
            edits_data = json.loads(edits)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON for edits")
            
        image_map = {}
        if images:
            for img in images:
                # Save temp image
                img_ext = img.filename.split('.')[-1]
                temp_img_name = f"temp_img_{uuid.uuid4()}.{img_ext}"
                with open(temp_img_name, "wb") as buffer:
                    shutil.copyfileobj(img.file, buffer)
                temp_images.append(temp_img_name)
                # Map original filename (or some ID sent from frontend) to temp path
                # Frontend should send imageId in edits that matches filename here?
                # Or we map by filename.
                image_map[img.filename] = temp_img_name
            
        output_path = edit_pdf(temp_filename, edits_data, image_map)
        
        return FileResponse(
            output_path, 
            filename=f"edited_{file.filename}", 
            media_type="application/pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        for img in temp_images:
            if os.path.exists(img):
                os.remove(img)
