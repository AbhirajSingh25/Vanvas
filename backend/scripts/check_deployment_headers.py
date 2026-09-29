import subprocess
import httpx
import json

def check_deployment():
    # 1. Git HEAD
    git_head = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()
    git_status = subprocess.check_output(["git", "status", "--short"]).decode().strip()
    
    # 2. Vercel response headers
    client = httpx.Client()
    resp = client.get("https://vanvasai.vercel.app", follow_redirects=True)
    asset_resp = client.get("https://vanvasai.vercel.app/images/places/manali/hadimba-temple.webp")
    
    headers_doc = dict(resp.headers)
    headers_asset = dict(asset_resp.headers)
    
    print(f"Current Git HEAD: {git_head}")
    print(f"Git Working Tree Clean: {len(git_status) == 0}")
    print(f"Document Headers:")
    for k, v in headers_doc.items():
        print(f"  {k}: {v}")
    print(f"\nAsset Headers (/images/places/manali/hadimba-temple.webp):")
    for k, v in headers_asset.items():
        print(f"  {k}: {v}")

if __name__ == '__main__':
    check_deployment()
