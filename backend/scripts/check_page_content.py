import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def check_html():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            headless=True
        )
        page = browser.new_page()
        page.goto("https://vanvasai.vercel.app/explore/rishikesh", wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(4000)
        
        # Check text and body HTML length
        body_text = page.inner_text('body')
        html = page.content()
        print(f"Page title: {page.title()}")
        print(f"Body text preview (first 300 chars): {body_text[:300]}")
        print(f"HTML length: {len(html)}")
        
        # Check if there is a loading spinner or error message
        loading_el = page.query_selector('[class*="loading"], [class*="spinner"]')
        print("Loading element present:", loading_el is not None)
        
        browser.close()

if __name__ == '__main__':
    check_html()
