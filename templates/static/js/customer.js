let customerMap = null;
let driverMarker = null;
let destMarker = null;
let routeLine = null;
let lastSeenNotifications = [];

// Request Browser Notification Permission
if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

async function fetchStatus() {
    // Phase 2 & 3: Simulate live updates
    const payload = {
        vehicle_type: "car",
        route_type: "city",
        speed: 40,
        speed_drop: 10,
        distance_remaining: 5,
        traffic_level: 1,
        weather_condition: 0,
        stop_duration: 1,
        time_of_day: 14
    };

    try {
        const response = await fetch("/predict-delay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        const etaEl = document.getElementById("updated_eta");
        const msgEl = document.getElementById("delay_msg");

        if (etaEl) etaEl.innerText = data.eta_update.new_eta + " minutes";

        if (msgEl) {
            if (data.prediction.delay_prediction === 1) {
                msgEl.innerText = "Delivery delayed due to traffic";
                msgEl.style.color = "#f87171";
            } else {
                msgEl.innerText = "Delivery on schedule";
                msgEl.style.color = "#34d399";
            }
        }

        // Handle Intelligent Notifications
        if (data.notifications && data.notifications.length > 0) {
            data.notifications.forEach(msg => {
                if (!lastSeenNotifications.includes(msg)) {
                    if (typeof NotificationSystem !== 'undefined') {
                        NotificationSystem.showToast(msg, 'warning');
                        NotificationSystem.sendBrowserNotification('PREDEL-MAKER Tracker', msg);
                    }
                }
            });
            lastSeenNotifications = data.notifications;
        }

        // Phase 3: Update Map (Assuming some dummy live coordinates for demo)
        updateCustomerMap();

    } catch (error) {
        console.error("Live update error:", error);
    }
}

function initCustomerMap() {
    if (!document.getElementById('customerMap')) return;

    customerMap = L.map('customerMap').setView([12.9716, 77.5946], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(customerMap);

    driverMarker = L.marker([12.9716, 77.5946], {
        icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
            iconSize: [40, 40]
        })
    }).addTo(customerMap).bindPopup("Driver is here");
}

async function updateCustomerMap() {
    if (!customerMap) initCustomerMap();

    // In a real app, we'd fetch the latest driver lat/lon from the server
    // For this demo, let's just slightly jitter the position
    const lat = 12.9716 + (Math.random() - 0.5) * 0.01;
    const lon = 77.5946 + (Math.random() - 0.5) * 0.01;

    if (driverMarker) {
        driverMarker.setLatLng([lat, lon]);
    }
}

// Initial initialization
document.addEventListener('DOMContentLoaded', () => {
    initCustomerMap();
    fetchStatus();
    setInterval(fetchStatus, 10000);
});