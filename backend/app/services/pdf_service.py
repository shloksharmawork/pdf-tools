import subprocess
import os
from pypdf import PdfReader, PdfWriter
from fastapi import HTTPException

def check_pdf_encrypted(file_path: str) -> bool:
    try:
        reader = PdfReader(file_path)
        return reader.is_encrypted
    except Exception:
        return False

def validate_password(file_path: str, password: str) -> bool:
    """
    Validates password by attempting to decrypt with qpdf.
    We do NOT brute force. We only try the provided password.
    """
    if not password:
        return False
        
    # qpdf --password=PASSWORD --check file.pdf
    # Using subprocess to call qpdf safely
    try:
        # qpdf returns 0 if valid, 2 if invalid password (usually)
        # We try to just open it to verify
        cmd = [
            "qpdf",
            f"--password={password}",
            "--check",
            file_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0
    except Exception:
        return False

def unlock_pdf(file_path: str, password: str = None) -> str:
    """
    Attempts to unlock PDF using multiple strategies:
    1. qpdf with provided password (if any)
    2. qpdf with empty password (bypass owner password)
    3. Ghostscript rewrite (strips many owner restrictions)
    """
    output_path = file_path.replace(".pdf", "_unlocked.pdf")
    
    # Strategy 1: qpdf with password (if provided)
    if password:
        cmd = [
            "qpdf",
            f"--password={password}",
            "--decrypt",
            file_path,
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            return output_path
            
    # Strategy 2: qpdf with empty password (bypass owner password)
    # Asking qpdf to decrypt with empty password often works for owner-locked files
    cmd = [
        "qpdf",
        "--password=",
        "--decrypt",
        file_path,
        output_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        return output_path

    # Strategy 3: Ghostscript rewrite (The "Nuclear Option")
    # This often removes permission restrictions by creating a new PDF
    print("Attempting Strategy 3: Ghostscript rewrite...")
    cmd = [
        "gs",
        "-q",
        "-dNOPAUSE",
        "-dBATCH",
        "-sDEVICE=pdfwrite",
        f"-sOutputFile={output_path}",
        "-c", ".setpdfwrite", 
        "-f", file_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        return output_path

    # Strategy 4: Poppler distil (pdftocairo)
    # Converts PDF to PDF, which essentially "prints" it, losing encryption metadata
    print("Attempting Strategy 4: Poppler distil...")
    cmd = [
        "pdftocairo",
        "-pdf",
        file_path,
        output_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        return output_path

    # Strategy 5: MuPDF clean (mutool)
    # Reconstructs the PDF syntax, often fixing corruption and removing stupid locks
    print("Attempting Strategy 5: MuPDF clean...")
    cmd = [
        "mutool",
        "clean",
        "-g", # Garbage collect
        "-g", # Garbage collect (duplicate to really clean)
        file_path,
        output_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        return output_path

    raise HTTPException(
        status_code=400, 
        detail="ALL unlock strategies failed. This file likely has a strong User Password (Open Password) which cannot be bypassed without the correct password. We do not support brute-force cracking."
    )

def merge_pdfs(file_paths: list[str]) -> str:
    merger = PdfWriter()
    for path in file_paths:
        merger.append(path)
        
    output_path = file_paths[0].replace(".pdf", "_merged.pdf")
    merger.write(output_path)
    merger.close()
    return output_path

def split_pdf(file_path: str, start_page: int, end_page: int) -> str:
    try:
        reader = PdfReader(file_path)
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        if total_pages == 0:
             raise HTTPException(status_code=400, detail="PDF is empty")

        # Validate range (1-based input converted to 0-based index)
        # start_page and end_page are passed as 1-based integers from API
        
        if start_page < 1 or end_page > total_pages or start_page > end_page:
             raise HTTPException(status_code=400, detail=f"Invalid page range: {start_page}-{end_page}. Total pages: {total_pages}")
             
        # Extract pages (0-based)
        for i in range(start_page - 1, end_page):
            writer.add_page(reader.pages[i])
            
        output_path = file_path.replace(".pdf", f"_split_{start_page}-{end_page}.pdf")
        with open(output_path, "wb") as f:
            writer.write(f)
            
        return output_path
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

def compress_pdf(file_path: str, profile: str = "ebook") -> str:
    """
    Compress PDF using Ghostscript (gs) with selectable quality profile.
    Profiles:
    - screen: 72 dpi (Web) - Smallest size, lowest quality
    - ebook: 150 dpi (Default) - Good balance
    - printer: 300 dpi (Print) - High quality, larger size
    """
    output_path = file_path.replace(".pdf", f"_optimized_{profile}.pdf")
    
    # Map profile to Ghostscript PDFSETTINGS
    # /screen (72 dpi)
    # /ebook (150 dpi)
    # /printer (300 dpi)
    # /prepress (300 dpi + color preservation)
    # /default (wide variety)
    
    gs_profile = f"/{profile}"
    if profile not in ["screen", "ebook", "printer", "prepress", "default"]:
        gs_profile = "/ebook" # Default fallback

    try:
        cmd = [
            "gs",
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={gs_profile}",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={output_path}",
            file_path
        ]
        
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
             raise Exception("Ghostscript failed to generate valid output.")
             
        return output_path

    except subprocess.CalledProcessError as e:
        print(f"Ghostscript failed: {e.stderr}")
        raise HTTPException(status_code=500, detail="Optimization failed due to internal error.")
    except Exception as e:
        if os.path.exists(output_path):
            os.remove(output_path)
        raise HTTPException(status_code=500, detail=f"Error optimizing PDF: {str(e)}")

def optimize_pdf(file_path: str, profile: str) -> str:
    return compress_pdf(file_path, profile)

def repair_pdf(file_path: str) -> str:
    """
    Repair PDF using Ghostscript (gs) by rewriting it.
    This reconstructs the PDF structure, often fixing corruption.
    """
    output_path = file_path.replace(".pdf", "_repaired.pdf")
    
    try:
        # Ghostscript command for repair
        # -o output.pdf -sDEVICE=pdfwrite -dPDFSETTINGS=/default input.pdf
        cmd = [
            "gs",
            "-o", output_path,
            "-sDEVICE=pdfwrite",
            "-dPDFSETTINGS=/default",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            file_path
        ]
        
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
             raise Exception("Ghostscript failed to generate valid output.")
             
        return output_path

    except subprocess.CalledProcessError as e:
        print(f"Ghostscript repair failed: {e.stderr}")
        raise HTTPException(status_code=500, detail="Repair failed due to internal error.")
    except Exception as e:
        if os.path.exists(output_path):
            os.remove(output_path)
        raise HTTPException(status_code=500, detail=f"Error repairing PDF: {str(e)}")

def protect_pdf(file_path: str, password: str) -> str:
    output_path = file_path.replace(".pdf", "_protected.pdf")
    
    reader = PdfReader(file_path)
    writer = PdfWriter()
    writer.append_pages_from_reader(reader)
    writer.encrypt(password)
    
    with open(output_path, "wb") as f:
        writer.write(f)
        
    return output_path

def remove_pages(file_path: str, pages_to_remove: list[int]) -> str:
    try:
        reader = PdfReader(file_path)
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        if total_pages == 0:
            raise HTTPException(status_code=400, detail="PDF is empty")

        # Validate page numbers
        for page_num in pages_to_remove:
            if page_num < 0 or page_num >= total_pages:
                 raise HTTPException(status_code=400, detail=f"Invalid page number: {page_num + 1}. Max page is {total_pages}")

        # Add pages NOT in removal list
        pages_added = 0
        for i in range(total_pages):
            if i not in pages_to_remove:
                writer.add_page(reader.pages[i])
                pages_added += 1
        
        if pages_added == 0:
             raise HTTPException(status_code=400, detail="Resulting PDF cannot be empty. You cannot remove all pages.")

        output_path = file_path.replace(".pdf", "_removed.pdf")
        with open(output_path, "wb") as f:
            writer.write(f)
            
        return output_path
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

def extract_pages(file_path: str, pages_to_extract: list[int]) -> str:
    try:
        reader = PdfReader(file_path)
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        if total_pages == 0:
            raise HTTPException(status_code=400, detail="PDF is empty")

        # Validate page numbers
        for page_num in pages_to_extract:
            if page_num < 0 or page_num >= total_pages:
                 raise HTTPException(status_code=400, detail=f"Invalid page number: {page_num + 1}. Max page is {total_pages}")

        if not pages_to_extract:
             raise HTTPException(status_code=400, detail="No pages selected for extraction.")
             
        # Add ONLY selected pages
        for page_num in pages_to_extract:
            writer.add_page(reader.pages[page_num])
            
        output_path = file_path.replace(".pdf", "_extracted.pdf")
        with open(output_path, "wb") as f:
            writer.write(f)
            
        return output_path
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

def reorder_pages(file_path: str, page_order: list[int]) -> str:
    try:
        reader = PdfReader(file_path)
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        if total_pages == 0:
            raise HTTPException(status_code=400, detail="PDF is empty")

        # Validate
        if len(page_order) != total_pages:
             # Basic check: usually reorder implies using all pages, 
             # but sometimes people drop pages during reorder.
             # Strict reorder: Must use all pages? 
             # Let's allow subset reorder (essentially extract + reorder), 
             # but commonly "Organize" might just imply permutation.
             # If the user provides a list of indices, we just follow it.
             # But if they duplicate pages, that's valid too.
             pass

        for page_num in page_order:
            if page_num < 0 or page_num >= total_pages:
                 raise HTTPException(status_code=400, detail=f"Invalid page number: {page_num + 1}. Max page is {total_pages}")

        for page_num in page_order:
            writer.add_page(reader.pages[page_num])
            
        output_path = file_path.replace(".pdf", "_reordered.pdf")
        with open(output_path, "wb") as f:
            writer.write(f)
            
        return output_path
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

def images_to_pdf(image_paths: list[str]) -> str:
    try:
        from PIL import Image
        
        if not image_paths:
            raise HTTPException(status_code=400, detail="No images provided")

        images = []
        for path in image_paths:
            try:
                img = Image.open(path)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                images.append(img)
            except Exception as e:
                # Log warning?
                continue
        
        if not images:
             raise HTTPException(status_code=400, detail="Failed to load valid images")

        output_path = image_paths[0] + "_scan.pdf"
        
        # Save first image as PDF and append others
        images[0].save(
            output_path, "PDF", resolution=100.0, save_all=True, append_images=images[1:]
        )
        
        return output_path
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error converting images to PDF: {str(e)}")




def ocr_pdf(file_path: str, lang: str = 'eng') -> str:
    try:
        from pdf2image import convert_from_path
        import pytesseract
        import io
        
        # Convert PDF to images
        images = convert_from_path(file_path)
        if not images:
             raise HTTPException(status_code=400, detail="Could not convert PDF to images.")

        output_path = file_path.replace(".pdf", "_ocr.pdf")
        pdf_writer = PdfWriter()

        for image in images:
            # Get PDF data from image via pytesseract (returns bytes)
            pdf_bytes = pytesseract.image_to_pdf_or_hocr(image, extension='pdf', lang=lang)
            
            # Read the bytes as a PDF page
            pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
            if len(pdf_reader.pages) > 0:
                pdf_writer.add_page(pdf_reader.pages[0])

        with open(output_path, "wb") as f:
            pdf_writer.write(f)
            
        return output_path

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"OCR failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

def sign_pdf(file_path: str, signature_path: str, page_num: int, x: int, y: int, width: int = 150, height: int = 60) -> str:
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import io

        # Create a PDF with the signature
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=letter)
        
        # Draw the signature image
        # ReportLab coords are bottom-left origin
        c.drawImage(signature_path, x, y, width=width, height=height, mask='auto', preserveAspectRatio=True)
        c.save()
        
        packet.seek(0)
        new_pdf = PdfReader(packet)
        existing_pdf = PdfReader(file_path)
        output = PdfWriter()

        total_pages = len(existing_pdf.pages)
        target_page_index = page_num - 1 # API sends 1-based page number
        
        if target_page_index < 0 or target_page_index >= total_pages:
             raise HTTPException(status_code=400, detail=f"Invalid page number: {page_num}. Max page is {total_pages}")

        for i in range(total_pages):
            page = existing_pdf.pages[i]
            if i == target_page_index:
                # Merge the signature page
                # We merge the existing page ONTO the signature page?? No, usually signature ONTO page.
                # pypdf merge_page: merges content stream of source page into current page
                page.merge_page(new_pdf.pages[0])
            output.add_page(page)
            
        output_path = file_path.replace(".pdf", "_signed.pdf")
        with open(output_path, "wb") as f:
            output.write(f)
            
        return output_path

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"Sign PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sign PDF failed: {str(e)}")

def redact_pdf(file_path: str, redactions: list[dict]) -> str:
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(file_path)
        
        for redaction in redactions:
            page_num = redaction.get('page', 1) - 1 # 1-based from frontend
            x = redaction.get('x', 0)
            y = redaction.get('y', 0)
            width = redaction.get('width', 0)
            height = redaction.get('height', 0)
            
            if 0 <= page_num < len(doc):
                page = doc[page_num]
                # fitz rect is (x0, y0, x1, y1)
                # Frontend sends x, y (top-left), width, height
                rect = fitz.Rect(x, y, x + width, y + height)
                
                # Add redaction annotation
                page.add_redact_annot(rect, fill=(0, 0, 0))
                
                # Apply redactions (actually removes content)
                page.apply_redactions()
        
        output_path = file_path.replace(".pdf", "_redacted.pdf")
        doc.save(output_path)
        doc.close()
        
        return output_path
        
    except Exception as e:
        print(f"Redact PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Redact PDF failed: {str(e)}")

def compare_pdfs(file_path_a: str, file_path_b: str) -> str:
    try:
        import fitz
        from PIL import Image, ImageChops
        import io
        
        doc_a = fitz.open(file_path_a)
        doc_b = fitz.open(file_path_b)
        
        # Determine max pages
        len_a = len(doc_a)
        len_b = len(doc_b)
        max_pages = max(len_a, len_b)
        
        output_doc = fitz.open() # Create new empty PDF
        
        for i in range(max_pages):
            # Render page A
            if i < len_a:
                pix_a = doc_a[i].get_pixmap()
                img_a = Image.frombytes("RGB", [pix_a.width, pix_a.height], pix_a.samples)
            else:
                # Create blank white image of minimal size or size of B?
                # If B exists, use B's size but white. 
                # If both somehow missing (loop logic prevent this), error.
                # Let's get size from B
                pix_b_ref = doc_b[i].get_pixmap()
                img_a = Image.new("RGB", (pix_b_ref.width, pix_b_ref.height), "white")
                
            # Render page B
            if i < len_b:
                pix_b = doc_b[i].get_pixmap()
                img_b = Image.frombytes("RGB", [pix_b.width, pix_b.height], pix_b.samples)
            else:
                # Use A's size
                pix_a_ref = doc_a[i].get_pixmap()
                img_b = Image.new("RGB", (pix_a_ref.width, pix_a_ref.height), "white")
                
            # Resize to match if dimensions differ (naive approach: resize B to A)
            if img_a.size != img_b.size:
                img_b = img_b.resize(img_a.size)
                
            # Compute difference
            # Invert subtraction subtract(source, dest): source - dest
            # difference: abs(a - b)
            diff = ImageChops.difference(img_a, img_b)
            
            # If diff is black, no difference.
            # We want to show differences clearly.
            # Invert diff so background is white and diffs are colored?
            # Or just use the diff image which is black background with colored diffs.
            # Let's Invert it to make it print friendly: White background, diffs are dark.
            diff = ImageChops.invert(diff)
            
            # Save diff to bytes
            img_byte_arr = io.BytesIO()
            diff.save(img_byte_arr, format='PDF')
            img_byte_arr = img_byte_arr.getvalue()
            
            # Add to output doc
            diff_page_doc = fitz.open("pdf", img_byte_arr)
            output_doc.insert_pdf(diff_page_doc)
            
        output_path = file_path_a.replace(".pdf", "_comparison.pdf")
        output_doc.save(output_path)
        output_doc.close()
        
        return output_path
        
    except Exception as e:
        print(f"Compare PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Compare PDF failed: {str(e)}")

    except Exception as e:
        print(f"Compare PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Compare PDF failed: {str(e)}")

def edit_pdf(file_path: str, edits: list[dict], image_uploads: dict = None) -> str:
    try:
        import fitz
        
        doc = fitz.open(file_path)
        
        for edit in edits:
            edit_type = edit.get('type', 'text')
            page_num = edit.get('page', 1) - 1
            x = edit.get('x', 0)
            y = edit.get('y', 0)
            
            if 0 <= page_num < len(doc):
                page = doc[page_num]
                
                if edit_type == 'text':
                    text = edit.get('text', '')
                    fontsize = edit.get('fontSize', 12)
                    color_hex = edit.get('color', '#000000')
                    
                    # Convert hex to RGB (0-1 range)
                    color = (0, 0, 0)
                    if color_hex.startswith('#') and len(color_hex) == 7:
                        r = int(color_hex[1:3], 16) / 255
                        g = int(color_hex[3:5], 16) / 255
                        b = int(color_hex[5:7], 16) / 255
                        color = (r, g, b)
                    
                    # Insert text
                    page.insert_text(
                        point=fitz.Point(x, y),
                        text=text,
                        fontsize=fontsize,
                        color=color
                    )

                elif edit_type == 'image':
                    image_id = edit.get('imageId')
                    width = edit.get('width', 100)
                    height = edit.get('height', 100)
                    
                    if image_uploads and image_id in image_uploads:
                        image_path = image_uploads[image_id]
                        # Insert image
                        rect = fitz.Rect(x, y, x + width, y + height)
                        page.insert_image(rect, filename=image_path)
        
        output_path = file_path.replace(".pdf", "_edited.pdf")
        doc.save(output_path)
        doc.close()
        
        return output_path
        
    except Exception as e:
        print(f"Edit PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Edit PDF failed: {str(e)}")

def rotate_pdf(file_path: str, angle: int) -> str:
    try:
        import fitz
        
        doc = fitz.open(file_path)
        
        for page in doc:
            current_rot = page.rotation
            new_rot = (current_rot + angle) % 360
            page.set_rotation(new_rot)
            
        output_path = file_path.replace(".pdf", f"_rotated_{angle}.pdf")
        doc.save(output_path)
        doc.close()
        
        return output_path
        
    except Exception as e:
        print(f"Rotate PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Rotate PDF failed: {str(e)}")

def add_page_numbers(file_path: str, position: str = 'bottom-center') -> str:
    try:
        import fitz
        
        doc = fitz.open(file_path)
        
        for i, page in enumerate(doc):
            text = f"{i + 1}"
            fontsize = 12
            rect = page.rect
            margin = 20
            
            # Calculate coordinates based on position
            if position == 'bottom-center':
                point = fitz.Point(rect.width / 2, rect.height - margin)
                align = fitz.TEXT_ALIGN_CENTER
            elif position == 'bottom-right':
                point = fitz.Point(rect.width - margin, rect.height - margin)
                align = fitz.TEXT_ALIGN_RIGHT
            elif position == 'bottom-left':
                point = fitz.Point(margin, rect.height - margin)
                align = fitz.TEXT_ALIGN_LEFT
            elif position == 'top-center':
                point = fitz.Point(rect.width / 2, margin + fontsize)
                align = fitz.TEXT_ALIGN_CENTER
            elif position == 'top-right':
                point = fitz.Point(rect.width - margin, margin + fontsize)
                align = fitz.TEXT_ALIGN_RIGHT
            elif position == 'top-left':
                point = fitz.Point(margin, margin + fontsize)
                align = fitz.TEXT_ALIGN_LEFT
            else:
                # Default to bottom-center
                point = fitz.Point(rect.width / 2, rect.height - margin)
                align = fitz.TEXT_ALIGN_CENTER
            
            # Insert text
            # insert_text point is start of text. For alignment, we need insert_textbox or similar, 
            # OR we just estimate width. insert_text doesn't support align directly in same way.
            # actually insert_text(point, text) places text starting at point.
            # For centering, we need text_length.
            
            text_len = fitz.get_text_length(text, fontsize=fontsize)
            
            if align == fitz.TEXT_ALIGN_CENTER:
                 x = point.x - (text_len / 2)
                 y = point.y
            elif align == fitz.TEXT_ALIGN_RIGHT:
                 x = point.x - text_len
                 y = point.y
            else:
                 x = point.x
                 y = point.y
                 
            page.insert_text(
                point=fitz.Point(x, y),
                text=text,
                fontsize=fontsize,
                color=(0, 0, 0)
            )
            
        output_path = file_path.replace(".pdf", "_numbered.pdf")
        doc.save(output_path)
        doc.close()
        
        return output_path
        
    except Exception as e:
        print(f"Add Page Numbers failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Add Page Numbers failed: {str(e)}")

def add_watermark(file_path: str, text: str, opacity: float = 0.5, rotation: int = 45, font_size: int = 60) -> str:
    try:
        import fitz
        
        doc = fitz.open(file_path)
        
        for page in doc:
            rect = page.rect
            center = fitz.Point(rect.width / 2, rect.height / 2)
            
            # Use insert_text does not support rotation directly for standard fonts easily in one go 
            # without using Shape or TextWriter in newer PyMuPDF.
            # Using insert_text implies horizontal.
            # To rotate, we should use `page.insert_text` with `morph` IF available, or `page.show_text` (deprecated?)
            # or `TextWriter`.
            # A common trick is using `insert_textbox` with rotation? No.
            # Let's use `page.insert_text` but we need to rotate the coordinate system? No.
            # PyMuPDF `insert_text` with `rotate` param exists in recent versions.
            
            # Let's try `insert_text` with `rotate` argument if it exists (check doc/version).
            # If not, we use `Shape`.
            
            # Calculate text width to center it manually
            text_len = fitz.get_text_length(text, fontsize=font_size)
            x = center.x - (text_len / 2)
            y = center.y 
            
            # Use morph for arbitrary rotation
            # morph = (fixpoint, matrix)
            # We rotate around the insertion point (or the center of text?)
            # If we rotate around insertion point (x,y), the text will swing.
            # Ideally rotate around center of page?
            # Let's try rotating around the insertion point first.
            m = fitz.Matrix(rotation)
            morph = (fitz.Point(x, y), m)
            
            page.insert_text(
                point=fitz.Point(x, y),
                text=text,
                fontsize=font_size,
                color=(0.5, 0.5, 0.5), # Grey
                fill_opacity=opacity,
                morph=morph
            )
            
            # NOTE: `insert_text` `rotate` param rotates text around the insertion point.
            # However, `align` might not work as expected with rotation in older versions.
            # Let's try simple insert. If `rotate` fails, we might need a fallback.
            # Actually, `rotate` in insert_text rotates the text "block" around the point.
            # Centering with rotation can be tricky.
            
            # Better approach for centering + rotation:
            # 1. Provide a central point.
            # 2. Use `rotate` param.
            # 3. Use `text_align` 1 (center) if supported.
            
            # If `rotate` is not supported in the installed version, we will catch error.
            # But let's assume valid version.
            
        output_path = file_path.replace(".pdf", "_watermarked.pdf")
        doc.save(output_path)
        doc.close()
        
        return output_path
        
    except Exception as e:
        print(f"Add Watermark failed: {str(e)}")
        # Fallback if rotate param fails (older pymupdf)
        raise HTTPException(status_code=500, detail=f"Add Watermark failed: {str(e)}")

def crop_pdf(file_path: str, x: float, y: float, width: float, height: float) -> str:
    """
    Crops PDF pages to the specified rectangle (percentage 0.0-1.0).
    x, y: Top-left corner
    width, height: Dimensions
    """
    try:
        import fitz
        
        doc = fitz.open(file_path)
        
        for page in doc:
            rect = page.rect
            # Calculate absolute crop box
            # x, y, w, h are percentages
            
            crop_x0 = rect.x0 + (rect.width * x)
            crop_y0 = rect.y0 + (rect.height * y)
            crop_x1 = crop_x0 + (rect.width * width)
            crop_y1 = crop_y0 + (rect.height * height)
            
            crop_rect = fitz.Rect(crop_x0, crop_y0, crop_x1, crop_y1)
            
            # Intersect with original page rect to be safe
            crop_rect = crop_rect & rect
            
            page.set_cropbox(crop_rect)
            
        output_path = file_path.replace(".pdf", "_cropped.pdf")
        doc.save(output_path)
        doc.close()
        
        return output_path
        
    except Exception as e:
        print(f"Crop PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Crop PDF failed: {str(e)}")

def pdf_to_jpg(file_path: str) -> str:
    try:
        from pdf2image import convert_from_path
        import zipfile
        import os
        
        # Output directory for images
        output_dir = os.path.dirname(file_path)
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        
        # Convert PDF to images
        images = convert_from_path(file_path)
        
        if not images:
             raise HTTPException(status_code=400, detail="Could not convert PDF to images.")

        saved_files = []
        for i, image in enumerate(images):
            image_path = os.path.join(output_dir, f"{base_name}_page_{i + 1}.jpg")
            image.save(image_path, "JPEG")
            saved_files.append(image_path)
            
        if len(saved_files) == 1:
            return saved_files[0]
        else:
            # Create ZIP
            zip_path = os.path.join(output_dir, f"{base_name}_images.zip")
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for file in saved_files:
                    zipf.write(file, os.path.basename(file))
                    
            # Clean up individual images
            for file in saved_files:
                os.remove(file)
                
            return zip_path

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"PDF to JPG failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF to JPG failed: {str(e)}")

def pdf_to_word(file_path: str) -> str:
    try:
        from pdf2docx import Converter
        
        output_path = file_path.replace(".pdf", ".docx")
        
        cv = Converter(file_path)
        cv.convert(output_path)
        cv.close()
        
        return output_path
        
    except Exception as e:
        print(f"PDF to Word failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF to Word failed: {str(e)}")

def pdf_to_ppt(file_path: str) -> str:
    try:
        from pptx import Presentation
        from pdf2image import convert_from_path
        import os
        
        output_path = file_path.replace(".pdf", ".pptx")
        
        # Create presentation
        prs = Presentation()
        
        # Convert PDF to images
        images = convert_from_path(file_path)
        
        if not images:
             raise HTTPException(status_code=400, detail="Could not convert PDF to images.")

        for i, image in enumerate(images):
            # Save temp image
            img_path = file_path + f"_temp_{i}.jpg"
            image.save(img_path, "JPEG")
            
            try:
                # Add slide
                # Layout 6 is blank
                blank_slide_layout = prs.slide_layouts[6] 
                slide = prs.slides.add_slide(blank_slide_layout)
                
                # Add picture to cover the slide
                slide.shapes.add_picture(img_path, 0, 0, width=prs.slide_width, height=prs.slide_height)
            finally:
                # Cleanup temp image
                if os.path.exists(img_path):
                    os.remove(img_path)
            
        prs.save(output_path)
        return output_path
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"PDF to PPT failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF to PPT failed: {str(e)}")

def pdf_to_excel(file_path: str) -> str:
    try:
        import pdfplumber
        import pandas as pd
        import os
        
        output_path = file_path.replace(".pdf", ".xlsx")
        
        with pdfplumber.open(file_path) as pdf:
            all_tables = []
            for i, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                for table in tables:
                    df = pd.DataFrame(table)
                    all_tables.append(df)
            
            if not all_tables:
                raise HTTPException(status_code=400, detail="No tables found in PDF.")

            # Save to Excel
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                for i, df in enumerate(all_tables):
                     # Write each table to a separate sheet or combine? 
                     # Strategy: Write each table to a sheet named "Table_X"
                     sheet_name = f"Table_{i+1}"
                     df.to_excel(writer, sheet_name=sheet_name, index=False, header=False)

        return output_path

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"PDF to Excel failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF to Excel failed: {str(e)}")

def pdf_to_pdfa(file_path: str) -> str:
    try:
        import ocrmypdf
        import os
        
        output_path = file_path.replace(".pdf", "_pdfa.pdf")
        
        # We skip text (OCR) for speed if we just want format conversion, 
        # but PDF/A usually implies we want long-term preservation which often includes searchable text.
        # However, purely for "PDF to PDF/A" conversion, sticking to structure is safer/faster.
        # Let's try with defaults (OCR enabled if needed) but force PDF/A-2b.
        
        # Note: ocrmypdf throws exceptions on failure.
        ocrmypdf.ocr(
            file_path, 
            output_path, 
            output_type='pdfa', 
            skip_text=True, # Assuming input might already have text or user just wants format compliance
            deskew=False,
            optimize=1 # basic optimization
        )
        
        return output_path

    except Exception as e:
        print(f"PDF to PDF/A failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF to PDF/A failed: {str(e)}")

def jpg_to_pdf(file_paths: list[str]) -> str:
    try:
        import img2pdf
        
        # Determine output path based on the first file name
        first_file = file_paths[0]
        output_path = os.path.splitext(first_file)[0] + "_converted.pdf"
        
        # Convert images to PDF
        with open(output_path, "wb") as f:
            f.write(img2pdf.convert(file_paths))
            
        return output_path

    except Exception as e:
        print(f"JPG to PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"JPG to PDF failed: {str(e)}")

def word_to_pdf(file_path: str) -> str:
    try:
        import subprocess
        
        output_dir = os.path.dirname(file_path)
        
        # Run LibreOffice headless conversion
        # --headless: no UI
        # --convert-to pdf: output format
        # --outdir: output directory
        cmd = [
            'libreoffice', 
            '--headless', 
            '--convert-to', 'pdf', 
            '--outdir', output_dir, 
            file_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"LibreOffice conversion failed: {result.stderr}")
            
        # LibreOffice saves with same basename but .pdf extension
        filename = os.path.splitext(os.path.basename(file_path))[0]
        output_path = os.path.join(output_dir, f"{filename}.pdf")
        
        if not os.path.exists(output_path):
             raise Exception("Output PDF not found after conversion")
             
        return output_path

    except Exception as e:
        print(f"Word to PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Word to PDF failed: {str(e)}")

def ppt_to_pdf(file_path: str) -> str:
    try:
        import subprocess
        
        output_dir = os.path.dirname(file_path)
        
        # Run LibreOffice headless conversion
        # --headless: no UI
        # --convert-to pdf: output format
        # --outdir: output directory
        cmd = [
            'libreoffice', 
            '--headless', 
            '--convert-to', 'pdf', 
            '--outdir', output_dir, 
            file_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"LibreOffice conversion failed: {result.stderr}")
            
        # LibreOffice saves with same basename but .pdf extension
        filename = os.path.splitext(os.path.basename(file_path))[0]
        output_path = os.path.join(output_dir, f"{filename}.pdf")
        
        if not os.path.exists(output_path):
             raise Exception("Output PDF not found after conversion")
             
        return output_path

    except Exception as e:
        print(f"PPT to PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PPT to PDF failed: {str(e)}")

def excel_to_pdf(file_path: str) -> str:
    try:
        import subprocess
        
        output_dir = os.path.dirname(file_path)
        
        # Run LibreOffice headless conversion
        # --headless: no UI
        # --convert-to pdf: output format
        # --outdir: output directory
        cmd = [
            'libreoffice', 
            '--headless', 
            '--convert-to', 'pdf', 
            '--outdir', output_dir, 
            file_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"LibreOffice conversion failed: {result.stderr}")
            
        # LibreOffice saves with same basename but .pdf extension
        filename = os.path.splitext(os.path.basename(file_path))[0]
        output_path = os.path.join(output_dir, f"{filename}.pdf")
        
        if not os.path.exists(output_path):
             raise Exception("Output PDF not found after conversion")
             
        return output_path

    except Exception as e:
        print(f"Excel to PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Excel to PDF failed: {str(e)}")

def html_to_pdf(file_path: str) -> str:
    try:
        import subprocess
        
        output_dir = os.path.dirname(file_path)
        
        # Run LibreOffice headless conversion
        # --headless: no UI
        # --convert-to pdf: output format
        # --outdir: output directory
        cmd = [
            'libreoffice', 
            '--headless', 
            '--convert-to', 'pdf', 
            '--outdir', output_dir, 
            file_path
        ]
        
        # HTML conversion might need adjustments for layout but basic text works
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"LibreOffice conversion failed: {result.stderr}")
            
        # LibreOffice saves with same basename but .pdf extension
        filename = os.path.splitext(os.path.basename(file_path))[0]
        output_path = os.path.join(output_dir, f"{filename}.pdf")
        
        if not os.path.exists(output_path):
             raise Exception("Output PDF not found after conversion")
             
        return output_path

    except Exception as e:
        print(f"HTML to PDF failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"HTML to PDF failed: {str(e)}")
