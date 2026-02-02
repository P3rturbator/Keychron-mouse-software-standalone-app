from playwright.sync_api import sync_playwright, expect

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1000, 'height': 700})
        page = context.new_page()

        # Go to the local server
        page.goto("http://localhost:8001")

        # Take screenshot of Buttons tab (default)
        page.screenshot(path="/home/jules/verification/buttons_tab.png")

        # Click DPI tab
        page.click("text=DPI")
        page.screenshot(path="/home/jules/verification/dpi_tab.png")

        # Click Lighting tab
        page.click("text=Lighting")
        page.screenshot(path="/home/jules/verification/lighting_tab.png")

        # Click Performance tab
        page.click("text=Performance")
        page.screenshot(path="/home/jules/verification/performance_tab.png")

        # Click Settings tab
        page.click("text=Settings")
        page.screenshot(path="/home/jules/verification/settings_tab.png")

        browser.close()

if __name__ == "__main__":
    verify_ui()
