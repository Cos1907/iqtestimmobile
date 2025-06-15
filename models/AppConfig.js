const mongoose = require('mongoose');

const AppConfigSchema = new mongoose.Schema({
  apiStatus: {
    login: { type: Boolean, default: true },
    register: { type: Boolean, default: true },
    getTests: { type: Boolean, default: true },
    submitResult: { type: Boolean, default: true },
    // Diğer API'ler için buraya eklenecek
  },
  featureStatus: {
    blog: { type: Boolean, default: true },
    affiliate: { type: Boolean, default: true },
    subscriptions: { type: Boolean, default: true },
    testimonials: { type: Boolean, default: true },
    campaigns: { type: Boolean, default: true },
    // Diğer özellikler için buraya eklenecek
  },
  pixelCodes: [
    {
      name: String,
      code: String,
      isActive: { type: Boolean, default: true },
    },
  ],
  notificationSettings: {
    pushNotificationsEnabled: { type: Boolean, default: true },
    emailNotificationsEnabled: { type: Boolean, default: true },
  },
  appVersion: { type: String, default: '1.0.0' },
  maintenanceMode: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AppConfig', AppConfigSchema); 