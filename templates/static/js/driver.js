// global state for Phase 2, 3 & 4
let currentCoords = null;
let lastCoords = null;
let map = null;
let driverMarker = null;
let destMarker = null;
let routeLine = null;
let watchId = null;

const manualOverride = {
    speed: false,
    speed_drop: false,
    distance_remaining: false,
    traffic_level: false,
    weather_condition: false,
    stop_duration: false,
    time_of_day: false
};

// Initialize range sliders and autocomplete
document.addEventListener('DOMContentLoaded', function () {
    // Link number inputs with range sliders
    setupRangeSync('speed', 'speedRange');
    setupRangeSync('speed_drop', 'speedDropRange');
    setupRangeSync('stop_duration', 'stopRange');

    // Add input animations
    setupInputAnimations();

    // Initialize location autocomplete
    setupLocationAutocomplete();

    // Update time display
    updateTimeDisplay();

    // Bind GPS button
    const gpsBtn = document.getElementById('useGPSBtn');
    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            initGPS();
        });
    }

    // Map Initialization
    initMap();

    // Setup Manual Overrides
    const fields = ['speed', 'speed_drop', 'distance_remaining', 'traffic_level', 'weather_condition', 'stop_duration', 'time_of_day'];
    fields.forEach(f => {
        const el = document.getElementById(f);
        if (el) {
            el.addEventListener('input', () => { manualOverride[f] = true; });
        }
    });

    // Request Browser Notification Permission
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    // Listen for destination changes
    const destInput = document.getElementById('destination');
    const updatePredictState = () => {
        const dest = destInput.value;
        const dist = document.getElementById('distance_remaining').value;
        const btn = document.getElementById('predictBtn');
        if (btn) {
            btn.disabled = !(dest && dest.length >= 3 && dist);
        }
    };

    destInput.addEventListener('input', updatePredictState);
    destInput.addEventListener('change', () => {
        updateMapRoute();
        updatePredictState();
    });
    destInput.addEventListener('blur', () => {
        updateMapRoute();
    });

    const distInput = document.getElementById('distance_remaining');
    distInput.addEventListener('input', updatePredictState);
    distInput.addEventListener('change', updatePredictState);

    // Initial estimated time calculation
    updateEstimatedTime();
});

function toggleGPS() {
    const btn = document.getElementById('useGPSBtn');
    const label = document.getElementById('gpsTrackingLabel');

    if (watchId !== null) {
        // Stop tracking
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        btn.classList.remove('active');
        btn.querySelector('span').textContent = 'Use Current Location';
        if (label) label.style.display = 'none';
        updateGPSStatus('info', 'GPS: Stopped');
        return;
    }

    // Start tracking
    if (!navigator.geolocation) {
        updateGPSStatus('error', 'GPS: Not Supported');
        return;
    }

    updateGPSStatus('searching', 'GPS: Locating...');

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            if (currentCoords) {
                lastCoords = { ...currentCoords };
            }

            currentCoords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                timestamp: Date.now()
            };

            // Update UI
            btn.classList.add('active');
            btn.querySelector('span').textContent = 'Stop Tracking';
            if (label) label.style.display = 'flex';
            updateGPSStatus('success', 'GPS: Active');

            if (driverMarker && map) {
                driverMarker.setLatLng([currentCoords.lat, currentCoords.lon]);
                // If it's the first fix, center map
                if (!lastCoords) map.setView([currentCoords.lat, currentCoords.lon], 15);
            }

            fetchAutoFeatures();
        },
        (error) => {
            console.error('GPS Error:', error);
            const errorMsg = error.code === 1 ? 'Permission Denied' : (error.code === 2 ? 'Position Unavailable' : 'Timeout');
            updateGPSStatus('error', `GPS: ${errorMsg}`);
            
            // Stop tracking on fatal error
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
                btn.classList.remove('active');
                if (label) label.style.display = 'none';
            }
        },
        { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
        }
    );
}

// Map binding to the new toggle function
document.addEventListener('DOMContentLoaded', function() {
    const gpsBtn = document.getElementById('useGPSBtn');
    if (gpsBtn) {
        // Remove old listener if any and add new one
        gpsBtn.replaceWith(gpsBtn.cloneNode(true));
        document.getElementById('useGPSBtn').addEventListener('click', toggleGPS);
    }
});

// Phase 4: Simple UI updates only, no auto-prediction triggers
setInterval(() => {
    updateEstimatedTime();
}, 10000);

function updateGPSStatus(type, message) {
    const el = document.getElementById('gpsStatus');
    if (!el) return;
    el.className = 'gps-badge ' + (type === 'error' ? 'error' : (type === 'success' ? 'success' : ''));
    el.querySelector('span').textContent = message;

    const icon = el.querySelector('i');
    if (type === 'searching') icon.className = 'fas fa-spinner fa-pulse';
    else if (type === 'error') icon.className = 'fas fa-exclamation-triangle';
    else icon.className = 'fas fa-location-arrow';
}

async function fetchAutoFeatures() {
    const dest = document.getElementById('destination').value;
    const btn = document.getElementById('predictBtn');
    const hint = document.getElementById('destHint');

    if (!dest || dest.length < 3) {
        if (btn) btn.disabled = true;
        return;
    }

    try {
        hint.textContent = "Updating real-time features...";
        const distInput = document.getElementById('distance_remaining');
        if (distInput && !manualOverride.distance_remaining) {
            distInput.value = "Fetching Distance...";
        }

        const payload = {
            destination: dest,
            lat: currentCoords.lat,
            lon: currentCoords.lon,
            stop_duration: parseFloat(document.getElementById('stop_duration').value) || 0
        };

        if (lastCoords) {
            payload.prev_lat = lastCoords.lat;
            payload.prev_lon = lastCoords.lon;
            payload.time_diff = (currentCoords.timestamp - lastCoords.timestamp) / 1000;
        }

        const response = await fetch("/auto-features", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            hint.textContent = "Error: " + data.error;
            return;
        }

        // Update UI fields if not overridden
        if (!manualOverride.distance_remaining) {
            document.getElementById('distance_remaining').value = data.distance_remaining;
            document.getElementById('distanceRange').value = data.distance_remaining;
        }
        if (!manualOverride.traffic_level) document.getElementById('traffic_level').value = data.traffic_level;
        if (!manualOverride.weather_condition) document.getElementById('weather_condition').value = data.weather_condition;

        if (!manualOverride.time_of_day) {
            document.getElementById('time_of_day').value = data.time_of_day;
            const timeDisplay = document.getElementById('currentTimeDisplay');
            timeDisplay.textContent = `${String(data.time_of_day).padStart(2, '0')}:00`;
        }

        if (!manualOverride.speed && data.speed !== undefined) {
            document.getElementById('speed').value = data.speed;
            document.getElementById('speedRange').value = data.speed;
        }

        if (!manualOverride.stop_duration && data.stop_duration !== undefined) {
            document.getElementById('stop_duration').value = data.stop_duration;
            document.getElementById('stopRange').value = Math.min(60, data.stop_duration);
        }

        document.getElementById('driver_location').value = data.current_address;

        // Enable prediction
        btn.disabled = false;
        hint.textContent = "Real-time features synced!";

        updateEstimatedTime();

    } catch (error) {
        console.error('Auto Features Error:', error);
        hint.textContent = "Failed to sync features";
    }
}

function setupLocationAutocomplete() {
    const inputs = [
        { id: 'driver_location', suggestionsId: 'locationSuggestions' },
        { id: 'destination', suggestionsId: null }
    ];

    inputs.forEach(cfg => {
        const input = document.getElementById(cfg.id);
        if (!input) return;

        // Create suggestions div if not exists and needed
        let suggestionsDiv = cfg.suggestionsId ? document.getElementById(cfg.suggestionsId) : null;
        if (!suggestionsDiv) {
            suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'location-suggestions';
            suggestionsDiv.style.display = 'none';
            input.parentNode.style.position = 'relative';
            input.parentNode.appendChild(suggestionsDiv);
        }

        let debounceTimer;
        input.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            const query = this.value;
            
            if (query.length < 3) {
                suggestionsDiv.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
                    const matches = await res.json();

                    if (matches.length > 0) {
                        suggestionsDiv.innerHTML = '';
                        matches.forEach(match => {
                            const div = document.createElement('div');
                            div.className = 'suggestion-item';
                            div.innerHTML = `<i class="fas fa-map-pin"></i> ${match.display_name}`;
                            div.onclick = () => {
                                input.value = match.display_name;
                                suggestionsDiv.style.display = 'none';
                                
                                const coords = { 
                                    lat: parseFloat(match.lat), 
                                    lon: parseFloat(match.lon), 
                                    timestamp: Date.now() 
                                };

                                if (cfg.id === 'driver_location') {
                                    currentCoords = coords;
                                    if (map) {
                                        map.setView([currentCoords.lat, currentCoords.lon], 13);
                                        driverMarker.setLatLng([currentCoords.lat, currentCoords.lon]);
                                    }
                                    fetchAutoFeatures();
                                } else {
                                    // Handle destination
                                    updateMapRoute();
                                }
                                
                                // Trigger event for predict button logic
                                input.dispatchEvent(new Event('change'));
                                highlightInput(input);
                            };
                            suggestionsDiv.appendChild(div);
                        });
                        suggestionsDiv.style.display = 'block';
                    } else {
                        suggestionsDiv.style.display = 'none';
                    }
                } catch (error) { 
                    console.error('Autocomplete Error:', error); 
                }
            }, 300);
        });

        // Hide suggestions on click outside
        document.addEventListener('click', (e) => {
            if (e.target !== input && e.target !== suggestionsDiv) {
                suggestionsDiv.style.display = 'none';
            }
        });
    });
}

function updateTimeDisplay() {
    const timeInput = document.getElementById('time_of_day');
    const timeDisplay = document.getElementById('currentTimeDisplay');

    timeInput.addEventListener('input', function () {
        const hour = this.value.padStart(2, '0');
        timeDisplay.textContent = `${hour}:00`;
    });

    if (timeInput && timeDisplay) {
        timeDisplay.textContent = `${timeInput.value.padStart(2, '0')}:00`;
    }
}

function updateEstimatedTime() {
    const distance_el = document.getElementById('distance_remaining');
    const distance = distance_el ? parseFloat(distance_el.value) || 5 : 5;
    const vehicleType = document.getElementById('vehicle_type').value;
    const routeType = document.getElementById('route_type').value;

    const vehicleSpeeds = {
        'bike': 40,
        'scooter': 35,
        'car': 50,
        'truck': 45
    };

    const routeMultipliers = {
        'city': 1.2,
        'suburban': 1.0,
        'highway': 0.8
    };

    const baseSpeed = vehicleSpeeds[vehicleType] || 40;
    const speedMultiplier = routeMultipliers[routeType] || 1;
    const effectiveSpeed = baseSpeed / speedMultiplier;

    const estimatedMinutes = Math.round((distance / effectiveSpeed) * 60);

    const estDisplay = document.getElementById('estimatedDelivery');
    if (estDisplay) estDisplay.textContent = estimatedMinutes + ' min';
}

function setupRangeSync(inputId, rangeId) {
    const input = document.getElementById(inputId);
    const range = document.getElementById(rangeId);

    if (!input || !range) return;

    input.addEventListener('input', function () {
        range.value = this.value;
        updateEstimatedTime();
    });

    range.addEventListener('input', function () {
        input.value = this.value;
        highlightInput(input);
        updateEstimatedTime();
    });
}

function setupInputAnimations() {
    const inputs = document.querySelectorAll('.premium-input, .premium-select');

    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.parentElement.style.transform = 'scale(1.01)';
        });

        input.addEventListener('blur', function () {
            this.parentElement.style.transform = '';
        });
    });
}

function highlightInput(input) {
    input.style.transition = 'all 0.3s ease';
    input.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.3)';

    setTimeout(() => {
        input.style.boxShadow = '';
    }, 300);
}

async function predictDelay() {
    const button = document.getElementById('predictBtn');
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Analyzing...';
    button.disabled = true;

    showResultsLoading();

    const payload = {
        vehicle_type: document.getElementById("vehicle_type").value,
        route_type: document.getElementById("route_type").value,
        origin_address: document.getElementById("driver_location").value,
        destination_address: document.getElementById("destination").value,
        speed: parseFloat(document.getElementById("speed").value),
        speed_drop: parseFloat(document.getElementById("speed_drop").value),
        distance_remaining: parseFloat(document.getElementById("distance_remaining").value),
        traffic_level: parseInt(document.getElementById("traffic_level").value),
        weather_condition: parseInt(document.getElementById("weather_condition").value),
        stop_duration: parseFloat(document.getElementById("stop_duration").value),
        time_of_day: parseInt(document.getElementById("time_of_day").value),
        trigger_llm: true // Only run LLM when explicitly clicking Predict
    };

    try {
        const response = await fetch("/predict-delay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            showDriverNotification(result.error, 'error');
            button.innerHTML = originalContent;
            button.disabled = false;
            hideResultsLoading();
            return;
        }

        updateResults(result);

        if (result.notifications && result.notifications.length > 0) {
            result.notifications.forEach(msg => {
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.showAlert(msg, 'warning');
                    NotificationSystem.showToast(msg, 'warning');
                    NotificationSystem.sendBrowserNotification('PREDEL-MAKER Alert', msg);
                }
            });
        }

        button.innerHTML = originalContent;
        button.disabled = false;
        hideResultsLoading();
        showSuccessAnimation();

    } catch (error) {
        console.error('Error predicting delay:', error);
        showDriverNotification('Failed to get prediction', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
        hideResultsLoading();
    }
}

function showResultsLoading() {
    const resultElements = ['risk', 'eta', 'explanation', 'suggestion'];

    resultElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('loading');
            if (id === 'eta') {
                const resultValue = element.querySelector('.result-value');
                if (resultValue) resultValue.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>';
            } else if (id === 'risk') {
                element.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Calculating risk...';
            } else {
                const resultText = element.querySelector('.result-text');
                if (resultText) resultText.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Analyzing...';
            }
        }
    });

    const progressFill = document.getElementById('riskProgress');
    if (progressFill) progressFill.style.width = '0%';

    const routeInfo = document.getElementById('routeInfo');
    if (routeInfo) routeInfo.style.display = 'none';
}

function hideResultsLoading() {
    document.querySelectorAll('.loading').forEach(el => {
        el.classList.remove('loading');
    });
}

function updateResults(data) {
    const riskElement = document.getElementById('risk');
    let riskLabel = data.risk;
    let riskColor = '#fbbf24';
    let riskPercentage = 50;

    if (data.risk === 'HIGH') {
        riskColor = '#f56565';
        riskPercentage = 85;
    } else if (data.risk === 'LOW') {
        riskColor = '#10b981';
        riskPercentage = 20;
    }

    riskElement.innerHTML = riskLabel;
    riskElement.style.color = riskColor;

    const progressFill = document.getElementById('riskProgress');
    animateProgressBar(progressFill, riskPercentage);

    const etaElement = document.getElementById('eta');
    const etaValue = etaElement.querySelector('.result-value');
    etaValue.innerText = data.eta_update.new_eta + ' minutes';

    const explanationElement = document.getElementById('explanation');
    const suggestionElement = document.getElementById('suggestion');

    typeWriter(explanationElement.querySelector('.result-text'), data.explanation);
    typeWriter(suggestionElement.querySelector('.result-text'), data.suggestion);

    showRouteAnalysis(data.prediction);
}

function showRouteAnalysis(prediction) {
    const routeInfo = document.getElementById('routeInfo');
    const routeDetails = routeInfo.querySelector('.route-details');
    const dest = document.getElementById('destination').value;
    const origin = document.getElementById('driver_location').value;
    const vehicle = document.getElementById('vehicle_type').value;

    routeDetails.innerHTML = `
        <div class="route-item">
            <i class="fas fa-map-pin"></i>
            <span>${origin} → ${dest}</span>
        </div>
        <div class="route-item">
            <i class="fas fa-${vehicle === 'bike' ? 'motorcycle' : (vehicle === 'car' ? 'car' : 'truck')}"></i>
            <span>${vehicle.charAt(0).toUpperCase() + vehicle.slice(1)}</span>
        </div>
        <div class="route-item">
            <i class="fas fa-percentage"></i>
            <span>Delay Prob: ${(prediction.delay_probability * 100).toFixed(1)}%</span>
        </div>
    `;

    routeInfo.style.display = 'block';
}

function animateProgressBar(element, targetWidth) {
    let currentWidth = 0;
    const increment = targetWidth / 30;
    const timer = setInterval(() => {
        currentWidth += increment;
        if (currentWidth >= targetWidth) {
            currentWidth = targetWidth;
            clearInterval(timer);
        }
        element.style.width = currentWidth + '%';
    }, 20);
}

function typeWriter(element, text, speed = 30) {
    if (!element || !text) return;
    element.innerHTML = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

function showSuccessAnimation() {
    const outputSection = document.querySelector('.output-section');
    outputSection.style.animation = 'pulse 0.5s ease';
    setTimeout(() => outputSection.style.animation = '', 500);
}

function showDriverNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `driver-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'linear-gradient(135deg, #f56565, #ed64a6)' : 'linear-gradient(135deg, #667eea, #764ba2)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 100px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        backdrop-filter: blur(10px);
        animation: fadeIn 0.3s ease;
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Phase 3: Map Functions
function initMap() {
    map = L.map('driverMap').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    driverMarker = L.marker([0, 0], {
        icon: L.icon({
            iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        })
    }).addTo(map).bindPopup("You are here");
}

async function updateMapRoute() {
    const destName = document.getElementById('destination').value;
    if (!destName || !currentCoords) return;

    try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${destName}`);
        const geoData = await geoRes.json();
        if (geoData.length === 0) return;

        const destLat = parseFloat(geoData[0].lat);
        const destLon = parseFloat(geoData[0].lon);

        if (destMarker) map.removeLayer(destMarker);
        destMarker = L.marker([destLat, destLon]).addTo(map).bindPopup(`Destination: ${destName}`);

        const rResponse = await fetch("/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                origin_lat: currentCoords.lat,
                origin_lon: currentCoords.lon,
                dest_lat: destLat,
                dest_lon: destLon
            })
        });
        const rData = await rResponse.json();

        if (routeLine) map.removeLayer(routeLine);
        routeLine = L.geoJSON(rData.geometry, {
            style: { color: '#667eea', weight: 5, opacity: 0.7 }
        }).addTo(map);

        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    } catch (e) {
        console.error("Map Update Error:", e);
    }
}
