'use client';
import React, { useState } from 'react';
import BackButton from '@/components/BackButton';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'claims', label: 'Claims', icon: '📋' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'security', label: 'Security', icon: '🔒' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />
      </div>

      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
        
        <div className="card-body">
          {/* Tab Navigation */}
          <div className="nav-tabs mb-6">
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

          {/* Settings Content */}
          <div className="space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                
                <div className="form-group">
                  <div>
                    <label className="label">System Name</label>
                    <input type="text" className="input" defaultValue="DIP Portal" />
                  </div>
                  
                  <div>
                    <label className="label">Timezone</label>
                    <select className="input">
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="maintenance" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="maintenance" className="text-gray-700 font-medium">
                      Maintenance Mode
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                
                <div className="form-group">
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="newReg" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <label htmlFor="newReg" className="text-gray-700 font-medium">
                      Allow New Registrations
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="emailVerif" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <label htmlFor="emailVerif" className="text-gray-700 font-medium">
                      Require Email Verification
                    </label>
                  </div>
                  
                  <div>
                    <label className="label">Maximum Vehicles per User</label>
                    <input type="number" className="input" defaultValue="5" min="1" max="20" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'claims' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Claims Management</h3>
                
                <div className="form-group">
                  <div>
                    <label className="label">Maximum Claims per Month</label>
                    <input type="number" className="input" defaultValue="2" min="1" max="10" />
                  </div>
                  
                  <div>
                    <label className="label">Claim Review Period (hours)</label>
                    <input type="number" className="input" defaultValue="48" min="1" max="168" />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="requirePhoto" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <label htmlFor="requirePhoto" className="text-gray-700 font-medium">
                      Require Photos for Claims
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Billing Settings</h3>
                
                <div className="form-group">
                  <div>
                    <label className="label">Monthly Membership Fee</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input type="number" className="input pl-7" defaultValue="20.00" step="0.01" min="0" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="label">Payment Grace Period (days)</label>
                    <input type="number" className="input" defaultValue="7" min="1" max="30" />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="autoSuspend" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <label htmlFor="autoSuspend" className="text-gray-700 font-medium">
                      Auto-suspend on Payment Failure
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                
                <div className="form-group">
                  <div>
                    <label className="label">Minimum Password Length</label>
                    <input type="number" className="input" defaultValue="6" min="6" max="20" />
                  </div>
                  
                  <div>
                    <label className="label">Session Timeout (hours)</label>
                    <input type="number" className="input" defaultValue="24" min="1" max="168" />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="strongPass" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <label htmlFor="strongPass" className="text-gray-700 font-medium">
                      Require Strong Passwords
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button className="btn btn-primary">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}