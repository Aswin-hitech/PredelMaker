import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

def get_driving_distance(origin_address, destination_address):
    """
    Scrapes driving distance between two addresses from distance.to
    Returns distance in km as a float.
    """
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Construct the URL for distance.to
        # URL format: https://www.distance.to/Origin/Destination
        url = f"https://www.distance.to/{origin_address.replace(' ', '%20')}/{destination_address.replace(' ', '%20')}"
        driver.get(url)
        
        # Enforce 4-second wait for page load as per requirements
        time.sleep(4)
        
        # Wait for the distance information to be available
        # The driving distance is usually in an element with class 'driving' or similar
        # We'll use BeautifulSoup to parse the page source for better extraction
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Look for "Driving route" or specific distance classes
        driving_dist_el = soup.find('p', class_='driving')
        if driving_dist_el:
            dist_text = driving_dist_el.get_text()
            # Clean text: "Driving route: 123.4 mi (200.5 km)" -> 200.5
            import re
            match = re.search(r'\(([\d,.]+)\s*km\)', dist_text)
            if match:
                return float(match.group(1).replace(',', ''))
        
        # Fallback: search across entire content
        text = soup.get_text()
        if "Driving route:" in text:
            import re
            match = re.search(r'Driving route:.*?\(?([\d,.]+)\s*km\)?', text)
            if match:
                return float(match.group(1).replace(',', ''))

        return None
        
    except Exception as e:
        print(f"Error scraping distance: {e}")
        return None
    finally:
        driver.quit()

if __name__ == "__main__":
    # Test
    print(f"Distance from Pollachi to Coimbatore: {get_driving_distance('Pollachi, Tamil Nadu', 'Coimbatore, Tamil Nadu')} km")
