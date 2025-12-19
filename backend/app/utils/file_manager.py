import os
import shutil
import uuid
import time
from pathlib import Path
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/uploads")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 25))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

os.makedirs(UPLOAD_DIR, exist_ok=True)

async def save_upload_file(file: UploadFile, check_pdf: bool = True) -> str:
    if check_pdf and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    file_id = str(uuid.uuid4())
    # Preserve extension if not PDF
    ext = ".pdf"
    if not check_pdf and file.filename:
        _, original_ext = os.path.splitext(file.filename)
        if original_ext:
            ext = original_ext.lower()
            
    filename = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    size = 0
    with open(file_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_FILE_SIZE_BYTES:
                os.remove(file_path)
                raise HTTPException(status_code=413, detail=f"File too large. Max size is {MAX_FILE_SIZE_MB}MB.")
            buffer.write(chunk)
            
    return file_path

def get_file_path(filename: str) -> str:
    return os.path.join(UPLOAD_DIR, filename)

def delete_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error deleting file {file_path}: {e}")

def cleanup_old_files(max_age_seconds: int = 600):
    """Delete files older than max_age_seconds"""
    now = time.time()
    for filename in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(file_path):
            if os.stat(file_path).st_mtime < now - max_age_seconds:
                delete_file(file_path)
