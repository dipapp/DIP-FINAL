'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    systemName: 'DIP Portal',
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    
    // User Management
    allowNewRegistrations: true,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    maxVehiclesPerUser: 5,
    autoActivateUsers: false,
    userSessionTimeout: 24, // hours
    
    // Claims Management
    maxClaimsPerMonth: 2,
    maxClaimsPerYear: 12,
    autoApproveClaims: false,
    autoApproveThreshold: 100,
    requirePhotoForClaims: true,
    claimReviewPeriod: 48, // hours
    allowClaimEditing: false,
    claimExpiryDays: 30,
    
    // Payment & Billing
    monthlyMembershipFee: 29.99,
    allowPaymentMethodUpdates: true,
    requireBillingForActivation: true,
    paymentGracePeriod: 7, // days
    autoSuspendOnPaymentFailure: true,
    maxPaymentAttempts: 3,
    
    // Vehicle Management
    requireVIN: true,
    requireLicensePlate: true,
    requireStateRegistration: true,
    allowVehicleDeactivation: true,
    allowVehicleDeletion: true,
    maxPhotosPerVehicle: 5,
    photoMaxSize: 10, // MB
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notifyOnNewClaim: true,
    notifyOnClaimStatusChange: true,
    notifyOnPaymentFailure: true,
    notifyOnVehicleActivation: false,
    
    // Security
    requireStrongPasswords: true,
    passwordMinLength: 8,
    sessionTimeout: 8, // hours
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
    require2FA: false,
    
    // Towing Services
    enableTowingServices: true,
    maxTowingRequestsPerMonth: 2,
    towingResponseTime: 60, // minutes
    requireTowingPhotos: true,
    autoApproveTowing: false,
    
    // Data & Privacy
    dataRetentionDays: 2555, // 7 years
    allowDataExport: true,
    requireConsentLogging: true,
    anonymizeOldData: false,
    backupFrequency: 'daily'
  });

  const handleSave = () => {
    // TODO: Implement settings save to Firebase
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset to default values
      alert('Settings reset to defaults!');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'claims', label: 'Claims', icon: '📋' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'privacy', label: 'Data & Privacy', icon: '📊' }
  ];

  const ToggleSwitch = ({ checked, onChange, label, description }: any) => (
    <div className="flex items-center justify-between">
      <div>
        <label className="label mb-1">{label}</label>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <BackButton />
      </div>
      
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">System Settings</h1>
        <p className="text-muted">Configure all aspects of the DIP portal system.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label">System Name</label>
                  <input
                    type="text"
                    className="input"
                    value={settings.systemName}
                    onChange={(e) => setSettings({...settings, systemName: e.target.value})}
                  />
                </div>
                

              </div>

              <div className="space-y-4">
                <ToggleSwitch
                  checked={settings.maintenanceMode}
                  onChange={(e: any) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  label="Maintenance Mode"
                  description="Temporarily disable user access"
                />

                {settings.maintenanceMode && (
                  <div>
                    <label className="label">Maintenance Message</label>
                    <textarea
                      className="input"
                      rows={3}
                      value={settings.maintenanceMessage}
                      onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                      placeholder="Message to display during maintenance"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {/* Claims Management */}
        {activeTab === 'claims' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label">Max Claims Per Month</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input"
                    value={settings.maxClaimsPerMonth}
                    onChange={(e) => setSettings({...settings, maxClaimsPerMonth: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="label">Max Claims Per Year</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="input"
                    value={settings.maxClaimsPerYear}
                    onChange={(e) => setSettings({...settings, maxClaimsPerYear: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="label">Claim Review Period (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    className="input"
                    value={settings.claimReviewPeriod}
                    onChange={(e) => setSettings({...settings, claimReviewPeriod: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="label">Claim Expiry (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    className="input"
                    value={settings.claimExpiryDays}
                    onChange={(e) => setSettings({...settings, claimExpiryDays: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ToggleSwitch
                  checked={settings.autoApproveClaims}
                  onChange={(e: any) => setSettings({...settings, autoApproveClaims: e.target.checked})}
                  label="Auto-Approve Claims"
                  description="Automatically approve claims under threshold"
                />

                {settings.autoApproveClaims && (
                  <div>
                    <label className="label">Auto-Approve Threshold ($)</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      className="input"
                      value={settings.autoApproveThreshold}
                      onChange={(e) => setSettings({...settings, autoApproveThreshold: parseInt(e.target.value)})}
                    />
                  </div>
                )}

                <ToggleSwitch
                  checked={settings.requirePhotoForClaims}
                  onChange={(e: any) => setSettings({...settings, requirePhotoForClaims: e.target.checked})}
                  label="Require Photos for Claims"
                  description="Users must upload photos with claims"
                />

                <ToggleSwitch
                  checked={settings.allowClaimEditing}
                  onChange={(e: any) => setSettings({...settings, allowClaimEditing: e.target.checked})}
                  label="Allow Claim Editing"
                  description="Users can edit claims after submission"
                />
              </div>
            </div>
          </div>
        )}

        {/* Billing Settings */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label">Monthly Membership Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.01"
                    className="input"
                    value={settings.monthlyMembershipFee}
                    onChange={(e) => setSettings({...settings, monthlyMembershipFee: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="label">Payment Grace Period (days)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="input"
                    value={settings.paymentGracePeriod}
                    onChange={(e) => setSettings({...settings, paymentGracePeriod: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="label">Max Payment Attempts</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input"
                    value={settings.maxPaymentAttempts}
                    onChange={(e) => setSettings({...settings, maxPaymentAttempts: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ToggleSwitch
                  checked={settings.allowPaymentMethodUpdates}
                  onChange={(e: any) => setSettings({...settings, allowPaymentMethodUpdates: e.target.checked})}
                  label="Allow Payment Method Updates"
                  description="Users can update payment methods"
                />

                <ToggleSwitch
                  checked={settings.requireBillingForActivation}
                  onChange={(e: any) => setSettings({...settings, requireBillingForActivation: e.target.checked})}
                  label="Require Billing for Activation"
                  description="Users must provide billing info to activate vehicles"
                />

                <ToggleSwitch
                  checked={settings.autoSuspendOnPaymentFailure}
                  onChange={(e: any) => setSettings({...settings, autoSuspendOnPaymentFailure: e.target.checked})}
                  label="Auto-Suspend on Payment Failure"
                  description="Automatically suspend accounts on payment failure"
                />
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Management */}
        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ToggleSwitch
                  checked={settings.requireVIN}
                  onChange={(e: any) => setSettings({...settings, requireVIN: e.target.checked})}
                  label="Require VIN"
                  description="VIN number is mandatory for vehicles"
                />

                <ToggleSwitch
                  checked={settings.requireLicensePlate}
                  onChange={(e: any) => setSettings({...settings, requireLicensePlate: e.target.checked})}
                  label="Require License Plate"
                  description="License plate is mandatory for vehicles"
                />

                <ToggleSwitch
                  checked={settings.requireStateRegistration}
                  onChange={(e: any) => setSettings({...settings, requireStateRegistration: e.target.checked})}
                  label="Require State Registration"
                  description="State registration is mandatory"
                />

                <ToggleSwitch
                  checked={settings.allowVehicleDeactivation}
                  onChange={(e: any) => setSettings({...settings, allowVehicleDeactivation: e.target.checked})}
                  label="Allow Vehicle Deactivation"
                  description="Users can deactivate their vehicles"
                />

                <ToggleSwitch
                  checked={settings.allowVehicleDeletion}
                  onChange={(e: any) => setSettings({...settings, allowVehicleDeletion: e.target.checked})}
                  label="Allow Vehicle Deletion"
                  description="Users can permanently delete their vehicles"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Max Photos Per Vehicle</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="input"
                    value={settings.maxPhotosPerVehicle}
                    onChange={(e) => setSettings({...settings, maxPhotosPerVehicle: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="label">Photo Max Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="input"
                    value={settings.photoMaxSize}
                    onChange={(e) => setSettings({...settings, photoMaxSize: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ToggleSwitch
                  checked={settings.emailNotifications}
                  onChange={(e: any) => setSettings({...settings, emailNotifications: e.target.checked})}
                  label="Email Notifications"
                  description="Send notifications via email"
                />

                <ToggleSwitch
                  checked={settings.smsNotifications}
                  onChange={(e: any) => setSettings({...settings, smsNotifications: e.target.checked})}
                  label="SMS Notifications"
                  description="Send notifications via SMS"
                />

                <ToggleSwitch
                  checked={settings.pushNotifications}
                  onChange={(e: any) => setSettings({...settings, pushNotifications: e.target.checked})}
                  label="Push Notifications"
                  description="Send push notifications to mobile app"
                />
              </div>

              <div className="space-y-4">
                <ToggleSwitch
                  checked={settings.notifyOnNewClaim}
                  onChange={(e: any) => setSettings({...settings, notifyOnNewClaim: e.target.checked})}
                  label="Notify on New Claim"
                  description="Send notification when new claim is filed"
                />

                <ToggleSwitch
                  checked={settings.notifyOnClaimStatusChange}
                  onChange={(e: any) => setSettings({...settings, notifyOnClaimStatusChange: e.target.checked})}
                  label="Notify on Claim Status Change"
                  description="Send notification when claim status changes"
                />

                <ToggleSwitch
                  checked={settings.notifyOnPaymentFailure}
                  onChange={(e: any) => setSettings({...settings, notifyOnPaymentFailure: e.target.checked})}
                  label="Notify on Payment Failure"
                  description="Send notification on payment failures"
                />

                <ToggleSwitch
                  checked={settings.notifyOnVehicleActivation}
                  onChange={(e: any) => setSettings({...settings, notifyOnVehicleActivation: e.target.checked})}
                  label="Notify on Vehicle Activation"
                  description="Send notification when vehicle is activated"
                />
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ToggleSwitch
                  checked={settings.requireStrongPasswords}
                  onChange={(e: any) => setSettings({...settings, requireStrongPasswords: e.target.checked})}
                  label="Require Strong Passwords"
                  description="Enforce password complexity requirements"
                />

                <ToggleSwitch
                  checked={settings.require2FA}
                  onChange={(e: any) => setSettings({...settings, require2FA: e.target.checked})}
                  label="Require Two-Factor Authentication"
                  description="Force 2FA for all users"
                />

                <div>
                  <label className="label">Password Min Length</label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    className="input"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="label">Session Timeout (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    className="input"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Max Login Attempts</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    className="input"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="label">Lockout Duration (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    className="input"
                    value={settings.lockoutDuration}
                    onChange={(e) => setSettings({...settings, lockoutDuration: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Data & Privacy */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label">Data Retention (days)</label>
                  <input
                    type="number"
                    min="30"
                    max="3650"
                    className="input"
                    value={settings.dataRetentionDays}
                    onChange={(e) => setSettings({...settings, dataRetentionDays: parseInt(e.target.value)})}
                  />
                  <p className="text-sm text-muted mt-1">How long to keep user data (7 years = 2555 days)</p>
                </div>

                <div>
                  <label className="label">Backup Frequency</label>
                  <select
                    className="input"
                    value={settings.backupFrequency}
                    onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <ToggleSwitch
                  checked={settings.allowDataExport}
                  onChange={(e: any) => setSettings({...settings, allowDataExport: e.target.checked})}
                  label="Allow Data Export"
                  description="Users can export their data"
                />

                <ToggleSwitch
                  checked={settings.requireConsentLogging}
                  onChange={(e: any) => setSettings({...settings, requireConsentLogging: e.target.checked})}
                  label="Require Consent Logging"
                  description="Log all user consent actions"
                />

                <ToggleSwitch
                  checked={settings.anonymizeOldData}
                  onChange={(e: any) => setSettings({...settings, anonymizeOldData: e.target.checked})}
                  label="Anonymize Old Data"
                  description="Anonymize data older than retention period"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button onClick={handleReset} className="btn btn-danger">
          Reset to Defaults
        </button>
        <button onClick={handleSave} className="btn btn-primary">
          Save All Settings
        </button>
      </div>
    </div>
  );
}
