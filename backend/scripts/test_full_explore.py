import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def test_full_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            headless=True
        )
        page = browser.new_page(viewport={"width": 1440, "height": 1200})
        print("Navigating to /explore/manali...")
        page.goto("https://vanvasai.vercel.app/explore/manali", wait_until="networkidle", timeout=60000)
        
        # Scroll down progressively to trigger all lazy loaded cards
        for i in range(5):
            page.evaluate(f"window.scrollTo(0, {i * 800})")
            page.wait_for_timeout(500)
            
        imgs = page.evaluate('''() => {
            const placeImgs = Array.from(document.querySelectorAll('img')).filter(img => {
                const s = img.src || '';
                return s.includes('/places/') || s.includes('/artworks/') || s.includes('/hotels/') || s.includes('/vehicles/');
            });
            return placeImgs.map(img => ({
                src: img.currentSrc || img.src,
                alt: img.alt,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
            }));
        }''')
        
        print(f"Total matching images rendered on /explore/manali: {len(imgs)}")
        for i, img in enumerate(imgs):
            print(f"  [{i:02d}] {img['src']} (dims: {img['naturalWidth']}x{img['naturalHeight']}) | alt: '{img['alt']}'")
            
        browser.close()

if __name__ == '__main__':
    test_full_load()
