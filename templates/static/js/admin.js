async function loadContexts() {
    const btn = document.querySelector('.action-bar .premium-button');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Syncing...';

    try {
        const response = await fetch("/admin-contexts");
        const data = await response.json();

        updateStats(data);
        renderTable(data);

        btn.innerHTML = originalContent;
        showAdminNotification('Dashboard synced successfully!');
    } catch (error) {
        console.error("Error loading contexts:", error);
        btn.innerHTML = originalContent;
        showAdminNotification('Sync failed', 'error');
    }
}

function updateStats(data) {
    const totalDelays = data.length;
    // For this simulation, we consider any high traffic or storm context as high risk
    const highRisk = data.filter(row => row.traffic_level > 1 || row.weather_condition > 1).length;

    // Simulate some on-time data (in a real app this would come from a different endpoint)
    const totalRequests = totalDelays + 10; // Dummy baseline
    const onTime = totalRequests - totalDelays;

    animateValue("totalDelays", totalDelays);
    animateValue("highRisk", highRisk);
    animateValue("onTime", onTime);
}

function renderTable(data) {
    const table = document.getElementById("context_table");
    table.innerHTML = "";

    const trafficMap = { 0: '🟢 Low', 1: '🟡 Mod', 2: '🔴 High' };
    const weatherMap = { 0: '☀️ Clear', 1: '🌧️ Rain', 2: '⛈️ Storm' };

    data.reverse().forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${trafficMap[row.traffic_level] || row.traffic_level}</td>
            <td>${weatherMap[row.weather_condition] || row.weather_condition}</td>
            <td>${row.stop_duration}m</td>
            <td><div class="reason-cell">${row.reason}</div></td>
        `;
        table.appendChild(tr);
    });
}

function animateValue(id, value) {
    const obj = document.getElementById(id);
    if (!obj) return;

    let start = parseInt(obj.innerText) || 0;
    let end = value;
    let duration = 1000;
    let startTimestamp = null;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function showAdminNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border-right: 4px solid ${type === 'error' ? '#ef4444' : '#10b981'};
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initial load
loadContexts();