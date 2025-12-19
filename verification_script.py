import os
import sys
from fastapi.testclient import TestClient
from pypdf import PdfWriter

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.main import app

client = TestClient(app)

def create_dummy_pdf(filename):
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    with open(filename, 'wb') as f:
        writer.write(f)
    return filename

def create_protected_pdf(filename, password):
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.encrypt(password)
    with open(filename, 'wb') as f:
        writer.write(f)
    return filename

def test_unlock_flow():
    # 1. Create protected PDF
    protected_pdf = "test_locked.pdf"
    password = "securepassword"
    create_protected_pdf(protected_pdf, password)
    
    # 2. Try to unlock with WRONG password
    with open(protected_pdf, "rb") as f:
        response = client.post(
            "/api/unlock/",
            files={"file": (protected_pdf, f, "application/pdf")},
            data={"password": "wrongpassword"}
        )
    
    print(f"Unlock with wrong password status: {response.status_code}")
    if response.status_code == 400:
        print("✅ Correctly rejected wrong password.")
    else:
        print(f"❌ Failed to reject wrong password. Got {response.status_code}: {response.text}")

    # 3. Try to unlock with CORRECT password
    with open(protected_pdf, "rb") as f:
        response = client.post(
            "/api/unlock/",
            files={"file": (protected_pdf, f, "application/pdf")},
            data={"password": password}
        )
        
    print(f"Unlock with correct password status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Correctly unlocked with valid password.")
    else:
        print(f"❌ Failed to unlock with correct password. Got {response.status_code}: {response.text}")

    # Cleanup
    if os.path.exists(protected_pdf):
        os.remove(protected_pdf)

if __name__ == "__main__":
    try:
        test_unlock_flow()
    except ImportError:
        print("Skipping tests: Dependencies not installed in environment (httpx, pypdf).")
        print("Please run these inside the container or after installing requirements.")
