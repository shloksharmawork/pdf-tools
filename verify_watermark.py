import requests
import time

def verify_watermark():
    # URL of the backend
    url = "http://localhost/api/watermark"
    
    # create a dummy pdf
    with open("test.pdf", "wb") as f:
        f.write(b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Resources << >>\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000111 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n214\n%%EOF")

    files = {'file': open('test.pdf', 'rb')}
    data = {
        'text': 'TEST WATERMARK',
        'opacity': '0.5',
        'rotation': '45',
        'fontSize': '60'
    }
    
    try:
        response = requests.post(url, files=files, data=data)
        if response.status_code == 200:
            print("Add Watermark: SUCCESS")
            with open("test_watermarked.pdf", "wb") as f:
                f.write(response.content)
        else:
            print(f"Add Watermark: FAILED with status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Add Watermark: FAILED with error {e}")
        
if __name__ == "__main__":
    # Wait for service to be up
    print("Waiting for service...")
    time.sleep(5) 
    verify_watermark()
