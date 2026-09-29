import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def inspect_page(slug):
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            headless=True
        )
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(f"https://vanvasai.vercel.app/explore/{slug}", wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(3000)
        
        # Get all images
        imgs = page.evaluate('''() => {
            return Array.from(document.querySelectorAll('img')).map(img => ({
                src: img.src,
                currentSrc: img.currentSrc,
                alt: img.alt,
                className: img.className,
                parentText: img.parentElement ? img.parentElement.innerText.substring(0, 50) : ''
            }));
        }''')
        
        print(f"=== Images on /explore/{slug} (Total: {len(imgs)}) ===")
        for i, img in enumerate(imgs):
            print(f"[{i:02d}] src={img['src']} | alt='{img['alt']}' | text='{img['parentText'].replace(chr(10), ' ')}'")
        
        browser.close()

if __name__ == '__main__':
    inspect_page("rishikesh")
    inspect_page("udaipur")
