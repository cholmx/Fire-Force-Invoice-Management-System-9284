// Automatic backup scheduler utility
class BackupScheduler {
  constructor() {
    this.BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.REMINDER_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    this.BACKUP_KEY = 'auto_backup_enabled';
    this.LAST_BACKUP_KEY = 'last_backup_date';
    this.LAST_REMINDER_KEY = 'last_reminder_date';
    this.REMINDER_DISMISSED_KEY = 'reminder_dismissed_date';
    this.intervalId = null;
    this.reminderIntervalId = null;

    // Fixed office information that should always remain the same
    this.fixedOfficeInfo = {
      companyName: 'Fire Force',
      address: 'P.O. Box 552, Columbiana Ohio 44408',
      phone: '330-482-9300',
      emergencyPhone: '724-586-6577',
      email: 'Lizfireforce@yahoo.com',
      serviceEmail: 'fireforcebutler@gmail.com',
      username: 'ffoffice1',
      password: '***ENCRYPTED***' // Never include real password in backup
    };
  }

  // Initialize the scheduler
  init() {
    this.scheduleNextBackup();
    this.scheduleBackupReminders();
    console.log('Backup scheduler initialized');
  }

  // Check if auto backup is enabled
  isEnabled() {
    return localStorage.getItem(this.BACKUP_KEY) === 'true';
  }

  // Get last backup date
  getLastBackupDate() {
    const lastBackup = localStorage.getItem(this.LAST_BACKUP_KEY);
    return lastBackup ? new Date(lastBackup) : null;
  }

  // Get last reminder date
  getLastReminderDate() {
    const lastReminder = localStorage.getItem(this.LAST_REMINDER_KEY);
    return lastReminder ? new Date(lastReminder) : null;
  }

  // Get dismissed reminder date
  getDismissedReminderDate() {
    const dismissedDate = localStorage.getItem(this.REMINDER_DISMISSED_KEY);
    return dismissedDate ? new Date(dismissedDate) : null;
  }

  // Set dismissed reminder date
  dismissReminder() {
    const now = new Date();
    localStorage.setItem(this.REMINDER_DISMISSED_KEY, now.toISOString());
    return now;
  }

  // Check if backup is due
  isBackupDue() {
    const lastBackup = this.getLastBackupDate();
    if (!lastBackup) return true;
    
    const now = new Date();
    const timeSinceLastBackup = now.getTime() - lastBackup.getTime();
    return timeSinceLastBackup >= this.BACKUP_INTERVAL;
  }

  // Check if reminder is due
  isReminderDue() {
    const lastBackup = this.getLastBackupDate();
    const lastReminder = this.getLastReminderDate();
    const dismissedReminder = this.getDismissedReminderDate();
    
    if (!lastBackup) return true;
    
    const now = new Date();
    const timeSinceLastBackup = now.getTime() - lastBackup.getTime();
    
    // If backup is not due yet, no reminder needed
    if (timeSinceLastBackup < this.BACKUP_INTERVAL) return false;
    
    // If reminder was dismissed today, don't show again today
    if (dismissedReminder) {
      const dismissedDate = new Date(dismissedReminder);
      if (now.toDateString() === dismissedDate.toDateString()) {
        return false;
      }
    }
    
    // If no reminder sent yet or it's been 8+ hours since last reminder
    if (!lastReminder) return true;
    
    const timeSinceLastReminder = now.getTime() - lastReminder.getTime();
    return timeSinceLastReminder >= this.REMINDER_INTERVAL;
  }

  // Schedule next backup check
  scheduleNextBackup() {
    // Clear existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Check every hour if backup is due
    this.intervalId = setInterval(() => {
      if (this.isEnabled() && this.isBackupDue()) {
        this.performAutoBackup();
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  // Schedule backup reminders
  scheduleBackupReminders() {
    // Clear existing interval
    if (this.reminderIntervalId) {
      clearInterval(this.reminderIntervalId);
    }
    
    // Check every hour if reminder is due
    this.reminderIntervalId = setInterval(() => {
      if (this.isReminderDue()) {
        this.showBackupReminder();
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  // Show backup reminder
  showBackupReminder() {
    // Update last reminder date
    localStorage.setItem(this.LAST_REMINDER_KEY, new Date().toISOString());
    
    // Create a reminder event for other components to listen to
    const reminderEvent = new CustomEvent('backup-reminder-due', {
      detail: {
        lastBackup: this.getLastBackupDate(),
        message: 'Please download a backup of your system data'
      }
    });
    
    window.dispatchEvent(reminderEvent);
    
    // Show notification if possible
    this.showBackupNotification(
      'Backup reminder: Please download a backup of your system data', 
      'reminder'
    );
    
    return true;
  }

  // Perform automatic backup
  async performAutoBackup() {
    try {
      console.log('Performing automatic backup...');
      
      // Get current data from the data context
      // This would need to be integrated with your DataContext
      const backupData = await this.getCurrentSystemData();
      
      if (!backupData) {
        console.error('No data available for backup');
        return;
      }
      
      // Ensure office info is always fixed
      if (backupData.officeInfo) {
        backupData.officeInfo = this.fixedOfficeInfo;
      }
      
      // Create backup object
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        system: 'Fire Force Invoice System',
        type: 'Automatic Backup',
        data: backupData,
        metadata: {
          totalInvoices: backupData.invoices?.length || 0,
          totalCustomers: backupData.customers?.length || 0,
          totalUsers: backupData.users?.length || 0,
          createdBy: 'Auto Backup System',
          backupType: 'Scheduled System Backup'
        }
      };
      
      // Store backup in localStorage (or send to server)
      const backupKey = `auto_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));
      
      // Update last backup date
      localStorage.setItem(this.LAST_BACKUP_KEY, new Date().toISOString());
      
      // Clean up old auto backups (keep last 5)
      this.cleanupOldBackups();
      
      console.log('Automatic backup completed successfully');
      
      // Notify user (optional)
      this.showBackupNotification('Automatic backup completed successfully');
    } catch (error) {
      console.error('Automatic backup failed:', error);
      this.showBackupNotification('Automatic backup failed', 'error');
    }
  }

  // Get current system data (to be integrated with DataContext)
  async getCurrentSystemData() {
    // This should be connected to your DataContext
    // For now, return null to indicate integration needed
    return null;
  }

  // Clean up old automatic backups
  cleanupOldBackups() {
    const keys = Object.keys(localStorage);
    const autoBackupKeys = keys
      .filter(key => key.startsWith('auto_backup_'))
      .sort()
      .reverse(); // Most recent first
    
    // Keep only the last 5 automatic backups
    if (autoBackupKeys.length > 5) {
      const keysToRemove = autoBackupKeys.slice(5);
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      console.log(`Cleaned up ${keysToRemove.length} old automatic backups`);
    }
  }

  // Show backup notification
  showBackupNotification(message, type = 'success') {
    // Create a simple notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Fire Force Backup System', {
        body: message,
        icon: '/favicon.ico'
      });
    } else {
      console.log(`Backup notification: ${message}`);
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }

  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.reminderIntervalId) {
      clearInterval(this.reminderIntervalId);
      this.reminderIntervalId = null;
    }
    
    console.log('Backup scheduler stopped');
  }

  // Get backup statistics
  getBackupStats() {
    const keys = Object.keys(localStorage);
    const autoBackupKeys = keys.filter(key => key.startsWith('auto_backup_'));
    
    return {
      totalAutoBackups: autoBackupKeys.length,
      lastBackup: this.getLastBackupDate(),
      isEnabled: this.isEnabled(),
      nextBackupDue: this.getNextBackupTime(),
      lastReminder: this.getLastReminderDate(),
      reminderDismissed: this.getDismissedReminderDate()
    };
  }

  // Get next backup time
  getNextBackupTime() {
    const lastBackup = this.getLastBackupDate();
    if (!lastBackup) return new Date();
    return new Date(lastBackup.getTime() + this.BACKUP_INTERVAL);
  }
}

// Create and export singleton instance
export const backupScheduler = new BackupScheduler();

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      backupScheduler.init();
    });
  } else {
    backupScheduler.init();
  }
}