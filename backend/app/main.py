from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import merge, split, compress, unlock, protect, remove_pages, extract_pages, organize, scan, optimize, repair, ocr, sign, redact, compare, edit, rotate, page_numbers, watermark, crop, pdf_to_jpg, pdf_to_word, pdf_to_ppt, pdf_to_excel, pdf_to_pdfa, jpg_to_pdf, word_to_pdf, ppt_to_pdf, excel_to_pdf, html_to_pdf
import os

# Environment Variables
APP_ENV = os.getenv("APP_ENV", "development")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

# Disable Swagger in Production
docs_url = "/docs" if APP_ENV != "production" else None
redoc_url = "/redoc" if APP_ENV != "production" else None

app = FastAPI(
    title="PDF Tools API",
    description="API for various PDF manipulation tools",
    version="1.0.0",
    docs_url=docs_url,
    redoc_url=redoc_url
)

# Attach State for Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Include Routers
app.include_router(merge.router, prefix="/api/merge", tags=["Merge"])
app.include_router(split.router, prefix="/api/split", tags=["Split"])
app.include_router(compress.router, prefix="/api/compress", tags=["Compress"])
app.include_router(unlock.router, prefix="/api/unlock", tags=["Unlock"])
app.include_router(protect.router, prefix="/api/protect", tags=["Protect"])
app.include_router(remove_pages.router, prefix="/api/remove-pages", tags=["Remove Pages"])
app.include_router(extract_pages.router, prefix="/api/extract-pages", tags=["Extract Pages"])
app.include_router(organize.router, prefix="/api/organize", tags=["Organize"])
app.include_router(scan.router, prefix="/api/scan", tags=["Scan"])
app.include_router(optimize.router, prefix="/api/optimize", tags=["Optimize"])
app.include_router(repair.router, prefix="/api/repair", tags=["Repair"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR"])
app.include_router(sign.router, prefix="/api/sign", tags=["Sign"])
app.include_router(redact.router, prefix="/api/redact", tags=["Redact"])
app.include_router(compare.router, prefix="/api/compare", tags=["Compare"])
app.include_router(edit.router, prefix="/api/edit", tags=["Edit"])
app.include_router(rotate.router, prefix="/api/rotate", tags=["Rotate"])
app.include_router(page_numbers.router, prefix="/api/page-numbers", tags=["Page Numbers"])
app.include_router(watermark.router, prefix="/api/watermark", tags=["Watermark"])
app.include_router(crop.router, prefix="/api/crop", tags=["Crop"])
app.include_router(pdf_to_jpg.router, prefix="/api/pdf-to-jpg", tags=["PDF to JPG"])
app.include_router(pdf_to_word.router, prefix="/api/pdf-to-word", tags=["PDF to Word"])
app.include_router(pdf_to_ppt.router, prefix="/api/pdf-to-ppt", tags=["PDF to PowerPoint"])
app.include_router(pdf_to_excel.router, prefix="/api/pdf-to-excel", tags=["PDF to Excel"])
app.include_router(pdf_to_pdfa.router, prefix="/api/pdf-to-pdfa", tags=["PDF to PDF/A"])
app.include_router(jpg_to_pdf.router, prefix="/api/jpg-to-pdf", tags=["JPG to PDF"])
app.include_router(word_to_pdf.router, prefix="/api/word-to-pdf", tags=["Word to PDF"])
app.include_router(ppt_to_pdf.router, prefix="/api/ppt-to-pdf", tags=["PowerPoint to PDF"])
app.include_router(excel_to_pdf.router, prefix="/api/excel-to-pdf", tags=["Excel to PDF"])
app.include_router(html_to_pdf.router, prefix="/api/html-to-pdf", tags=["HTML to PDF"])
