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
    // Phase 4: Customer dashboard is PASSIVE. 
    // It only displays ETA, location, and map.
    // In a production system, this would fetch from a /get-session-status endpoint.
    try {
        // Simulating passive update of driver location
        updateCustomerMap();
        
        // For this demo, we assume ETA is updated by the driver's actions
        // and stored in a shared state or DB. We don't trigger new predictions here.
        console.log("Customer status refresh (Passive)");

    } catch (error) {
        console.error("Live update error:", error);
    }
}

function initCustomerMap() {
    const mapEl = document.getElementById('customerMap');
    if (!mapEl) return;

    customerMap = L.map('customerMap').setView([11.0168, 76.9558], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(customerMap);

    driverMarker = L.marker([11.0168, 76.9558], {
        icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
            iconSize: [40, 40]
        })
    }).addTo(customerMap).bindPopup("Driver");
}

async function updateCustomerMap() {
    if (!customerMap) initCustomerMap();
    
    // Simulate slight movement for UI demonstration
    if (driverMarker) {
        const currentPos = driverMarker.getLatLng();
        const nextLat = currentPos.lat + (Math.random() - 0.5) * 0.001;
        const nextLon = currentPos.lng + (Math.random() - 0.5) * 0.001;
        driverMarker.setLatLng([nextLat, nextLon]);
    }
}

// Initial initialization
document.addEventListener('DOMContentLoaded', () => {
    initCustomerMap();
    fetchStatus();
    setInterval(fetchStatus, 10000);
});