import requests
import json
import os
from reportlab.pdfgen import canvas

# Create simple PDF
def create_pdf(filename, text):
    c = canvas.Canvas(filename)
    c.drawString(100, 750, text)
    c.save()

pdf_file = "test_edit.pdf"
create_pdf(pdf_file, "Original Content")

url = "http://localhost/api/edit"

edits = [
    {
        "type": "text",
        "page": 1,
        "x": 100,
        "y": 500,
        "text": "Edited Line",
        "fontSize": 20,
        "color": "#FF0000"
    }
]

files = [
    ('file', (pdf_file, open(pdf_file, 'rb'), 'application/pdf'))
]
data = {
    'edits': json.dumps(edits)
}

try:
    response = requests.post(url, files=files, data=data)
    
    if response.status_code == 200:
        print("Success! Edited PDF received.")
        with open("edited_output.pdf", "wb") as f:
            f.write(response.content)
        print("Saved to edited_output.pdf")
    else:
        print(f"Failed: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
