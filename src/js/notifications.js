export default class Notifications {
    constructor(app) {
        this.app = app;
    }

    async loadNotifications() {
        try {
            const notifications = await this.app.queryDatabase(`
                SELECT * FROM notifications 
                WHERE is_read = FALSE 
                ORDER BY created_at DESC 
                LIMIT 20
            `);
            
            this.updateNotificationCount(notifications.length);
            this.updateNotificationPanel(notifications);
            
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    async updateNotificationCount(count = null) {
        try {
            if (count === null) {
                const result = await this.app.queryDatabase(`
                    SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE
                `);
                count = result[0].count;
            }
            
            const badge = document.getElementById('notificationCount');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
            
        } catch (error) {
            console.error('Error updating notification count:', error);
        }
    }

    updateNotificationPanel(notifications) {
        const panel = document.getElementById('notificationList');
        if (!panel) return;

        if (notifications.length === 0) {
            panel.innerHTML = `
                <div class="no-notifications">
                    <i class="material-icons">notifications_none</i>
                    <p>No new notifications</p>
                </div>
            `;
            return;
        }

        let notificationsHTML = '';
        
        notifications.forEach(notification => {
            const icon = this.getNotificationIcon(notification.type);
            const timeAgo = this.getTimeAgo(notification.created_at);
            
            notificationsHTML += `
                <div class="notification-item ${notification.is_read ? 'read' : 'unread'}" data-id="${notification.id}">
                    <div class="notification-icon">
                        <i class="material-icons">${icon}</i>
                    </div>
                    <div class="notification-content">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                        <small class="notification-time">${timeAgo}</small>
                    </div>
                    <div class="notification-actions">
                        ${!notification.is_read ? `
                            <button class="btn btn-sm btn-text mark-read" data-id="${notification.id}">
                                <i class="material-icons">check</i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        panel.innerHTML = notificationsHTML;

        // Add event listeners
        panel.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-actions')) {
                    const notificationId = e.currentTarget.dataset.id;
                    this.handleNotificationClick(notificationId);
                }
            });
        });

        panel.querySelectorAll('.mark-read').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const notificationId = e.currentTarget.dataset.id;
                await this.markAsRead(notificationId);
            });
        });
    }

    getNotificationIcon(type) {
        switch(type) {
            case 'low_stock':
                return 'warning';
            case 'out_of_stock':
                return 'error';
            case 'system':
                return 'info';
            case 'alert':
                return 'notifications';
            default:
                return 'notifications';
        }
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'just now';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    async createNotification(type, title, message, relatedId = null) {
        try {
            // Check if similar notification already exists
            const existing = await this.app.queryDatabase(`
                SELECT id FROM notifications 
                WHERE type = ? AND title = ? AND message = ? AND is_read = FALSE
                LIMIT 1
            `, [type, title, message]);
            
            if (existing.length > 0) {
                return; // Notification already exists
            }
            
            await this.app.executeDatabase(`
                INSERT INTO notifications (type, title, message, related_id, is_read)
                VALUES (?, ?, ?, ?, FALSE)
            `, [type, title, message, relatedId]);
            
            // Reload notifications
            await this.loadNotifications();
            
            // Show desktop notification if supported
            if (this.isElectron() && type !== 'system') {
                this.showDesktopNotification(title, message);
            }
            
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    async markAsRead(notificationId) {
        try {
            await this.app.executeDatabase(
                'UPDATE notifications SET is_read = TRUE WHERE id = ?',
                [notificationId]
            );
            
            // Remove from UI
            const item = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
            if (item) {
                item.remove();
            }
            
            // Update count
            await this.updateNotificationCount();
            
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            await this.app.executeDatabase(
                'UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE'
            );
            
            // Clear notification panel
            const panel = document.getElementById('notificationList');
            if (panel) {
                panel.innerHTML = `
                    <div class="no-notifications">
                        <i class="material-icons">notifications_none</i>
                        <p>No new notifications</p>
                    </div>
                `;
            }
            
            // Update count
            await this.updateNotificationCount(0);
            
            this.app.showToast('Success', 'All notifications marked as read', 'success');
            
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    async handleNotificationClick(notificationId) {
        try {
            const [notification] = await this.app.queryDatabase(
                'SELECT * FROM notifications WHERE id = ?',
                [notificationId]
            );
            
            if (!notification) return;
            
            // Mark as read
            await this.markAsRead(notificationId);
            
            // Handle based on type
            switch(notification.type) {
                case 'low_stock':
                case 'out_of_stock':
                    if (notification.related_id) {
                        this.app.navigateTo('products');
                        // You could highlight the specific product
                        setTimeout(() => {
                            this.app.showToast('Info', `Viewing product ID: ${notification.related_id}`, 'info');
                        }, 500);
                    }
                    break;
                    
                case 'system':
                    // Show system notification details
                    this.app.showModal('System Notification', notification.message, [
                        { text: 'Close', class: 'btn-secondary' }
                    ]);
                    break;
                    
                default:
                    // Default action
                    this.app.showToast('Info', notification.title, 'info');
            }
            
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    }

    showDesktopNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '../assets/logo.png'
            });
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    isElectron() {
        return window.electronAPI !== undefined;
    }

    async clearOldNotifications(days = 30) {
        try {
            await this.app.executeDatabase(`
                DELETE FROM notifications 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [days]);
            
            console.log(`Cleared notifications older than ${days} days`);
            
        } catch (error) {
            console.error('Error clearing old notifications:', error);
        }
    }

    async getNotificationStats() {
        try {
            const stats = await this.app.queryDatabase(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread,
                    SUM(CASE WHEN type = 'low_stock' THEN 1 ELSE 0 END) as low_stock,
                    SUM(CASE WHEN type = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock,
                    SUM(CASE WHEN type = 'system' THEN 1 ELSE 0 END) as system
                FROM notifications
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            `);
            
            return stats[0];
            
        } catch (error) {
            console.error('Error getting notification stats:', error);
            return null;
        }
    }

    async setupNotificationListeners() {
        // Listen for mark all as read button
        document.getElementById('markAllRead')?.addEventListener('click', async () => {
            await this.markAllAsRead();
        });

        // Auto-clear old notifications once a day
        setInterval(() => {
            this.clearOldNotifications(30);
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Check for low stock every hour
        setInterval(async () => {
            await this.checkLowStockNotifications();
        }, 60 * 60 * 1000); // 60 minutes
    }

    async checkLowStockNotifications() {
        try {
            const lowStockProducts = await this.app.queryDatabase(`
                SELECT p.id, p.name, p.current_stock, p.minimum_stock
                FROM products p
                WHERE p.current_stock <= p.minimum_stock 
                AND p.current_stock > 0
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n 
                    WHERE n.related_id = p.id 
                    AND n.type = 'low_stock' 
                    AND n.is_read = FALSE
                    AND n.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                )
            `);

            for (const product of lowStockProducts) {
                await this.createNotification(
                    'low_stock',
                    'Low Stock Alert',
                    `Product "${product.name}" is low on stock. Current: ${product.current_stock}, Minimum: ${product.minimum_stock}`,
                    product.id
                );
            }

            const outOfStockProducts = await this.app.queryDatabase(`
                SELECT p.id, p.name
                FROM products p
                WHERE p.current_stock <= 0
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n 
                    WHERE n.related_id = p.id 
                    AND n.type = 'out_of_stock' 
                    AND n.is_read = FALSE
                    AND n.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                )
            `);

            for (const product of outOfStockProducts) {
                await this.createNotification(
                    'out_of_stock',
                    'Out of Stock Alert',
                    `Product "${product.name}" is out of stock!`,
                    product.id
                );
            }

        } catch (error) {
            console.error('Error checking low stock notifications:', error);
        }
    }
}