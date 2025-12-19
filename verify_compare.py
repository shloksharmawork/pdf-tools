import requests
import json
import os
from reportlab.pdfgen import canvas

# Create two slightly different PDFs
def create_pdf(filename, text):
    c = canvas.Canvas(filename)
    c.drawString(100, 750, text)
    c.save()

pdf_a = "test_compare_a.pdf"
pdf_b = "test_compare_b.pdf"
create_pdf(pdf_a, "Original Text")
create_pdf(pdf_b, "Modified Text")

url = "http://localhost/api/compare"

files = [
    ('file1', (pdf_a, open(pdf_a, 'rb'), 'application/pdf')),
    ('file2', (pdf_b, open(pdf_b, 'rb'), 'application/pdf'))
]

try:
    response = requests.post(url, files=files)
    
    if response.status_code == 200:
        print("Success! Comparison PDF received.")
        with open("comparison_output.pdf", "wb") as f:
            f.write(response.content)
        print("Saved to comparison_output.pdf")
    else:
        print(f"Failed: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
