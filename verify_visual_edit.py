import requests
import json
import os
from reportlab.pdfgen import canvas
from PIL import Image

# Create simple PDF
def create_pdf(filename, text):
    c = canvas.Canvas(filename)
    c.drawString(100, 750, text)
    c.save()

# Create simple Image
def create_image(filename):
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save(filename)

pdf_file = "test_visual_edit.pdf"
img_file = "test_image.png"

create_pdf(pdf_file, "Original Content")
create_image(img_file)

url = "http://localhost/api/edit"

# Edits: 1 Text, 1 Image
edits = [
    {
        "type": "text",
        "page": 1,
        "x": 100,
        "y": 500,
        "text": "Visual Text",
        "fontSize": 20,
        "color": "#0000FF"
    },
    {
        "type": "image",
        "page": 1,
        "x": 300,
        "y": 500,
        "width": 100,
        "height": 100,
        "imageId": "test_image.png"
    }
]

files = [
    ('file', (pdf_file, open(pdf_file, 'rb'), 'application/pdf')),
    ('images', (img_file, open(img_file, 'rb'), 'image/png'))
]
data = {
    'edits': json.dumps(edits)
}

try:
    response = requests.post(url, files=files, data=data)
    
    if response.status_code == 200:
        print("Success! Edited PDF with Image received.")
        with open("visual_edit_output.pdf", "wb") as f:
            f.write(response.content)
        print("Saved to visual_edit_output.pdf")
    else:
        print(f"Failed: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
