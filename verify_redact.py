import requests
import json
import os

# Create a dummy PDF
from reportlab.pdfgen import canvas
def create_dummy_pdf(filename):
    c = canvas.Canvas(filename)
    c.drawString(100, 750, "Hello World! This is a secret document.")
    c.drawString(100, 700, "CONFIDENTIAL DATA HERE.")
    c.save()

pdf_filename = "test_redact.pdf"
create_dummy_pdf(pdf_filename)

url = "http://localhost/api/redact"

# Define redactions
# Redact "CONFIDENTIAL DATA HERE" at approx 100, 700
# Canvas coords are bottom-up, fitz (backend) can be top-down depending on version, 
# but usually PDF is bottom-up. 
# WAIT. PyMuPDF (fitz) uses top-left origin by default for rects??
# "PDF coordinates are defined with the origin (0, 0) at the bottom-left corner." - Standard
# BUT PyMuPDF `fitz.Rect(x0, y0, x1, y1)`:
# "Coordinates in PyMuPDF are floats... For PDF ... (0,0) is top-left" ??
# Actually PyMuPDF treats (0,0) as top-left of the page usually when working with page geometry in many contexts (like rendering).
# BUT `page.add_redact_annot` expects the rect in the page's coordinate system.
# The frontend canvas I built uses top-left (0,0).
# If PDF is standard (bottom-left), we might need conversion.
# However, usually when converting PDF to image for display (if we did that), we use top-left.
# Let's see what happens. If I send top-left coordinates and PyMuPDF uses top-left, it works.
# If PyMuPDF respects per-page coordinate system (which is usually bottom-up for PDF), I might need to flip Y.
# Documentation says: "PyMuPDF uses a coordinate system where (0,0) is the top-left corner of the page." 
# So it matches HTML Canvas! Perfect.

redactions = [
    {
        "page": 1,
        "x": 90,
        "y": 80, # Approx top if page height is ~800 and text is at 700 (which is 100 from bottom)? 
        # Wait, reportlab uses bottom-left (0,0). 700 is high up. Page height ~842 (A4). So 842-700 = 142 from top.
        "width": 200,
        "height": 50
    }
]

files = {'file': open(pdf_filename, 'rb')}
data = {'redactions': json.dumps(redactions)}

try:
    response = requests.post(url, files=files, data=data)
    
    if response.status_code == 200:
        print("Success! Redacted PDF received.")
        with open("redacted_output.pdf", "wb") as f:
            f.write(response.content)
        print("Saved to redacted_output.pdf")
    else:
        print(f"Failed: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
