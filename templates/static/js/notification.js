/**
 * notification.js
 * Universal notification system for PREDEL-MAKER
 */

const NotificationSystem = {
    // 1. Toast Notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this._getIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Add CSS dynamically if not present
        this._ensureStyles();

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    },

    // 2. In-App Alert Banner
    showAlert(message, type = 'warning') {
        const banner = document.createElement('div');
        banner.className = `alert-banner alert-${type}`;
        banner.innerHTML = `
            <i class="fas ${this._getIcon(type)}"></i>
            <p>${message}</p>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        const container = document.querySelector('.dashboard-container') || document.body;
        container.prepend(banner);

        setTimeout(() => banner.classList.add('show'), 100);
    },

    // 3. Browser Native Notification
    async sendBrowserNotification(title, message) {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(title, { body: message, icon: '/static/img/logo.png' });
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                new Notification(title, { body: message });
            }
        }
    },

    _getIcon(type) {
        switch (type) {
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'success': return 'fa-check-circle';
            default: return 'fa-info-circle';
        }
    },

    _ensureStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: rgba(31, 41, 55, 0.95);
                backdrop-filter: blur(8px);
                color: white;
                padding: 12px 24px;
                border-radius: 50px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 9999;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                display: flex;
                align-items: center;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .toast.show { transform: translateX(-50%) translateY(0); }
            .toast-content { display: flex; align-items: center; gap: 12px; }
            .toast-error { border-bottom: 3px solid #ef4444; }
            .toast-warning { border-bottom: 3px solid #f59e0b; }
            .toast-success { border-bottom: 3px solid #10b981; }
            .toast i { font-size: 1.2rem; }
            
            .alert-banner {
                background: rgba(185, 28, 28, 0.1);
                border: 1px solid rgba(185, 28, 28, 0.2);
                color: #ef4444;
                padding: 1rem;
                border-radius: 12px;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                backdrop-filter: blur(10px);
                transform: translateY(-20px);
                opacity: 0;
                transition: all 0.3s ease;
            }
            .alert-banner.show { transform: translateY(0); opacity: 1; }
            .alert-banner p { margin: 0; flex: 1; font-weight: 500; }
            .alert-banner button { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: inherit; }
        `;
        document.head.appendChild(style);
    }
};
