// Backup file validation utility
export class BackupValidator {
  constructor() {
    this.requiredFields = [
      'version',
      'timestamp',
      'system',
      'data'
    ];
    
    this.dataFields = [
      'invoices',
      'customers',
      'users',
      'officeInfo',
      'settings'
    ];

    // Fixed office information for validation
    this.fixedOfficeInfo = {
      companyName: 'Fire Force',
      address: 'P.O. Box 552, Columbiana Ohio 44408',
      phone: '330-482-9300',
      emergencyPhone: '724-586-6577',
      email: 'Lizfireforce@yahoo.com',
      serviceEmail: 'fireforcebutler@gmail.com',
      username: 'ffoffice1'
    };
  }

  // Validate backup file structure
  validateBackupFile(backupData) {
    const errors = [];
    const warnings = [];

    try {
      // Check if it's a valid object
      if (typeof backupData !== 'object' || backupData === null) {
        errors.push('Invalid backup file format: not a valid JSON object');
        return { isValid: false, errors, warnings };
      }

      // Check required fields
      this.requiredFields.forEach(field => {
        if (!backupData[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      });

      // Validate version
      if (backupData.version && !this.isValidVersion(backupData.version)) {
        warnings.push(`Backup version ${backupData.version} may not be compatible`);
      }

      // Validate system
      if (backupData.system && backupData.system !== 'Fire Force Invoice System') {
        warnings.push('Backup appears to be from a different system');
      }

      // Validate timestamp
      if (backupData.timestamp) {
        const date = new Date(backupData.timestamp);
        if (isNaN(date.getTime())) {
          errors.push('Invalid timestamp format');
        } else {
          const now = new Date();
          const backupAge = now.getTime() - date.getTime();
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          
          if (backupAge > thirtyDays) {
            warnings.push('Backup is more than 30 days old');
          }
        }
      }

      // Validate data structure
      if (backupData.data) {
        const dataValidation = this.validateDataStructure(backupData.data);
        errors.push(...dataValidation.errors);
        warnings.push(...dataValidation.warnings);
      } else {
        errors.push('No data found in backup file');
      }

      // Validate office info specifically
      if (backupData.data && backupData.data.officeInfo) {
        const officeValidation = this.validateOfficeInfoAgainstFixed(backupData.data.officeInfo);
        if (!officeValidation.valid) {
          warnings.push('Office information in backup differs from system requirements');
          warnings.push('Office information will be preserved during restore');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: this.extractMetadata(backupData)
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`File parsing error: ${error.message}`],
        warnings: []
      };
    }
  }

  // Validate data structure
  validateDataStructure(data) {
    const errors = [];
    const warnings = [];

    // Check invoices
    if (data.invoices) {
      if (!Array.isArray(data.invoices)) {
        errors.push('Invoices data is not an array');
      } else {
        const invoiceValidation = this.validateInvoices(data.invoices);
        errors.push(...invoiceValidation.errors);
        warnings.push(...invoiceValidation.warnings);
      }
    }

    // Check customers
    if (data.customers) {
      if (!Array.isArray(data.customers)) {
        errors.push('Customers data is not an array');
      } else {
        const customerValidation = this.validateCustomers(data.customers);
        errors.push(...customerValidation.errors);
        warnings.push(...customerValidation.warnings);
      }
    }

    // Check users
    if (data.users) {
      if (!Array.isArray(data.users)) {
        errors.push('Users data is not an array');
      } else {
        const userValidation = this.validateUsers(data.users);
        errors.push(...userValidation.errors);
        warnings.push(...userValidation.warnings);
      }
    }

    // Check office info
    if (data.officeInfo) {
      const officeValidation = this.validateOfficeInfo(data.officeInfo);
      errors.push(...officeValidation.errors);
      warnings.push(...officeValidation.warnings);
    }

    // Check settings
    if (data.settings) {
      const settingsValidation = this.validateSettings(data.settings);
      errors.push(...settingsValidation.errors);
      warnings.push(...settingsValidation.warnings);
    }

    return { errors, warnings };
  }

  // Validate invoices array
  validateInvoices(invoices) {
    const errors = [];
    const warnings = [];

    invoices.forEach((invoice, index) => {
      if (!invoice.id) {
        errors.push(`Invoice ${index + 1}: Missing ID`);
      }
      if (!invoice.customerName) {
        warnings.push(`Invoice ${index + 1}: Missing customer name`);
      }
      if (!invoice.items || !Array.isArray(invoice.items)) {
        errors.push(`Invoice ${index + 1}: Missing or invalid items`);
      }
      if (typeof invoice.grandTotal !== 'number' || invoice.grandTotal < 0) {
        warnings.push(`Invoice ${index + 1}: Invalid grand total`);
      }
    });

    return { errors, warnings };
  }

  // Validate customers array
  validateCustomers(customers) {
    const errors = [];
    const warnings = [];

    customers.forEach((customer, index) => {
      if (!customer.id) {
        errors.push(`Customer ${index + 1}: Missing ID`);
      }
      if (!customer.name) {
        errors.push(`Customer ${index + 1}: Missing name`);
      }
      if (customer.email && !this.isValidEmail(customer.email)) {
        warnings.push(`Customer ${index + 1}: Invalid email format`);
      }
    });

    return { errors, warnings };
  }

  // Validate users array
  validateUsers(users) {
    const errors = [];
    const warnings = [];

    users.forEach((user, index) => {
      if (!user.id) {
        errors.push(`User ${index + 1}: Missing ID`);
      }
      if (!user.username) {
        errors.push(`User ${index + 1}: Missing username`);
      }
      if (!user.name) {
        errors.push(`User ${index + 1}: Missing name`);
      }
      if (!user.role || !['salesman', 'office'].includes(user.role)) {
        errors.push(`User ${index + 1}: Invalid role`);
      }
    });

    return { errors, warnings };
  }

  // Validate office info
  validateOfficeInfo(officeInfo) {
    const errors = [];
    const warnings = [];

    if (!officeInfo.companyName) {
      warnings.push('Office info: Missing company name');
    }
    if (officeInfo.email && !this.isValidEmail(officeInfo.email)) {
      warnings.push('Office info: Invalid email format');
    }
    
    // Check if office info matches fixed values
    const fixedValidation = this.validateOfficeInfoAgainstFixed(officeInfo);
    if (!fixedValidation.valid) {
      warnings.push('Office info in backup differs from system requirements');
    }

    return { errors, warnings };
  }

  // Validate office info against fixed values
  validateOfficeInfoAgainstFixed(officeInfo) {
    const differences = [];
    
    if (officeInfo.companyName !== this.fixedOfficeInfo.companyName) {
      differences.push('company name');
    }
    
    if (officeInfo.address !== this.fixedOfficeInfo.address) {
      differences.push('address');
    }
    
    if (officeInfo.phone !== this.fixedOfficeInfo.phone) {
      differences.push('phone');
    }
    
    if (officeInfo.emergencyPhone !== this.fixedOfficeInfo.emergencyPhone) {
      differences.push('emergency phone');
    }
    
    if (officeInfo.email !== this.fixedOfficeInfo.email) {
      differences.push('email');
    }
    
    if (officeInfo.serviceEmail !== this.fixedOfficeInfo.serviceEmail) {
      differences.push('service email');
    }
    
    if (officeInfo.username !== this.fixedOfficeInfo.username) {
      differences.push('username');
    }
    
    return {
      valid: differences.length === 0,
      differences
    };
  }

  // Validate settings
  validateSettings(settings) {
    const errors = [];
    const warnings = [];

    if (typeof settings.taxRate !== 'number' || settings.taxRate < 0 || settings.taxRate > 100) {
      warnings.push('Settings: Invalid tax rate');
    }

    return { errors, warnings };
  }

  // Check if version is valid
  isValidVersion(version) {
    const validVersions = ['1.0', '1.1', '1.2'];
    return validVersions.includes(version);
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Extract metadata from backup
  extractMetadata(backupData) {
    const metadata = {
      version: backupData.version,
      timestamp: backupData.timestamp,
      system: backupData.system,
      type: backupData.type || 'Unknown',
      recordCounts: {}
    };

    if (backupData.data) {
      if (backupData.data.invoices) {
        metadata.recordCounts.invoices = backupData.data.invoices.length;
      }
      if (backupData.data.customers) {
        metadata.recordCounts.customers = backupData.data.customers.length;
      }
      if (backupData.data.users) {
        metadata.recordCounts.users = backupData.data.users.length;
      }
    }

    if (backupData.metadata) {
      metadata.originalMetadata = backupData.metadata;
    }

    return metadata;
  }

  // Generate validation report
  generateReport(validation) {
    const report = {
      summary: validation.isValid ? 'Backup file is valid' : 'Backup file has issues',
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      details: {
        errors: validation.errors,
        warnings: validation.warnings
      }
    };

    if (validation.metadata) {
      report.metadata = validation.metadata;
    }

    return report;
  }
}

// Export singleton instance
export const backupValidator = new BackupValidator();