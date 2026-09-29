import sys
from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            headless=True
        )
        page = browser.new_page()
        page.goto('https://vanvasai.vercel.app/explore/manali', wait_until='domcontentloaded', timeout=45000)
        print("Page title:", page.title())
        # wait 2 seconds for client react hydration
        page.wait_for_timeout(2000)
        # get rendered img tags
        imgs = page.eval_on_selector_all('img', 'elements => elements.map(e => ({src: e.src, alt: e.alt, className: e.className}))')
        print(f"Found {len(imgs)} rendered images on /explore/manali")
        for i, img in enumerate(imgs[:5]):
            print(f"  [{i}] src={img['src'][:80]} | alt={img['alt']}")
        browser.close()

if __name__ == '__main__':
    test()
