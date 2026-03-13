# PREDEL-MAKER Stabilization Task

## Core Architecture - Distance Layer
- [ ] Create `backend/apis/distance_scraper.py`
  - [ ] Implement `get_driving_distance(origin_address, destination_address)` using Selenium
  - [ ] Scrape driving distance from distance.to
  - [ ] Extract km as float

## Core Architecture - Routing Layer
- [ ] Ensure OSRM is used for routing and map visualization ONLY
  - [ ] Ignore OSRM distance

## ETA Engine Fix
- [ ] Update `backend/apis/eta_engine.py`
  - [ ] Calculate `base_eta = distance / speed`
  - [ ] Final ETA formula integration: `base_eta + traffic_delay + stop_delay + toll_delay`

## Location Input Behavior
- [ ] Update Driver Frontend (`driver.html` / `driver.js`)
  - [ ] Add Nominatim autocomplete for driver location and destination
  - [ ] Support manual coordinate override
  - [ ] Autocomplete selection fills lat/lon automatically

## Optional GPS Button
- [ ] Add "Use Current Location" button in frontend
  - [ ] Fetch GPS on click ONLY
  - [ ] Do NOT auto-fetch GPS

## Prediction Execution Rule
- [ ] Run prediction ONLY when "Predict ETA" button is clicked
  - [ ] Remove loops, 10s auto predictions, background ETA
  - [ ] Trigger LLM calls only after clicking Predict

## Query Behavior
- [ ] Make prediction request fully independent (stateless)
  - [ ] Coordinate parsing
  - [ ] Distance scraping
  - [ ] OSRM route fetch
  - [ ] ETA calculation
  - [ ] ML prediction
  - [ ] LLM explanation

## Driver and Customer Dashboards
- [ ] Driver Dashboard Flow implementation
- [ ] Customer Dashboard update (marker, polyline, ETA, ML prediction, NO LLM)

## Modules and Installation
- [ ] Update [requirements.txt](file:///d:/Aswin%20Projects/PredelMaker/requirements.txt) with `selenium`, `webdriver-manager`, `beautifulsoup4`
- [ ] Update `app.py` appropriately to remove automated predictions and background processing.
