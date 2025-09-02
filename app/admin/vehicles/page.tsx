'use client';
import { useEffect, useState } from 'react';
import { subscribeVehicles, uploadVehiclePhoto, updateVehicleAdmin } from '@/lib/firebase/adminActions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: string;
  ownerId: string;
  ownerEmail: string;
  vin?: string;
  licensePlate?: string;
  state?: string;
  color?: string;
  isActive?: boolean;
  lastUpdated?: any;
};

export default function AdminVehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Vehicle>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeVehicles((rows) => {
      setVehicles(rows as Vehicle[]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const startEditing = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle.id);
    setEditForm({
      vin: vehicle.vin || '',
      licensePlate: vehicle.licensePlate || '',
      state: vehicle.state || '',
      color: vehicle.color || '',
    });
  };

  const saveChanges = async (vehicleId: string) => {
    setSaving(vehicleId);
    try {
      await updateVehicleAdmin(vehicleId, editForm);
      setEditingVehicle(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Failed to update vehicle');
    } finally {
      setSaving(null);
    }
  };

  const cancelEditing = () => {
    setEditingVehicle(null);
    setEditForm({});
  };

  const toggleActive = async (vehicleId: string, currentStatus: boolean) => {
    setSaving(vehicleId);
    try {
      await updateVehicleAdmin(vehicleId, { isActive: !currentStatus });
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      alert('Failed to update vehicle status');
    } finally {
      setSaving(null);
    }
  };

  const vehiclesWithMissingInfo = vehicles.filter(v => !v.vin || !v.licensePlate);

  if (loading) return <div className="card">Loading vehicles...</div>;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Vehicle Management</h1>
            <p className="text-muted">Manage all registered vehicles and their information</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <div className="text-sm text-muted">Total Vehicles</div>
          </div>
        </div>

        {vehiclesWithMissingInfo.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-orange-500">⚠️</span>
              <div>
                <p className="font-medium text-orange-800">Incomplete Vehicle Information</p>
                <p className="text-sm text-orange-600">
                  {vehiclesWithMissingInfo.length} vehicle(s) are missing VIN or license plate information
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vehicles Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted border-b">
              <tr>
                <th className="py-3 pr-4">Vehicle</th>
                <th className="py-3 pr-4">Owner</th>
                <th className="py-3 pr-4">VIN</th>
                <th className="py-3 pr-4">License Plate</th>
                <th className="py-3 pr-4">State</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="table-row">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                    <div className="text-xs text-muted">{vehicle.color || 'Color not specified'}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{vehicle.ownerEmail}</div>
                    <div className="text-xs text-muted font-mono">{vehicle.ownerId.slice(-8)}</div>
                  </td>
                  <td className="py-3 pr-4">
                    {editingVehicle === vehicle.id ? (
                      <input
                        type="text"
                        className="input text-xs font-mono"
                        placeholder="Enter VIN"
                        value={editForm.vin || ''}
                        onChange={(e) => setEditForm({ ...editForm, vin: e.target.value.toUpperCase() })}
                        maxLength={17}
                      />
                    ) : (
                      <div className={`font-mono text-xs ${!vehicle.vin ? 'text-red-500' : ''}`}>
                        {vehicle.vin || 'Missing VIN'}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {editingVehicle === vehicle.id ? (
                      <input
                        type="text"
                        className="input text-xs font-mono"
                        placeholder="Enter license plate"
                        value={editForm.licensePlate || ''}
                        onChange={(e) => setEditForm({ ...editForm, licensePlate: e.target.value.toUpperCase() })}
                      />
                    ) : (
                      <div className={`font-mono text-xs ${!vehicle.licensePlate ? 'text-red-500' : ''}`}>
                        {vehicle.licensePlate || 'Missing Plate'}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {editingVehicle === vehicle.id ? (
                      <select
                        className="input text-xs"
                        value={editForm.state || ''}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      >
                        <option value="">Select State</option>
                        <option value="CA">California</option>
                        <option value="NY">New York</option>
                        <option value="TX">Texas</option>
                        <option value="FL">Florida</option>
                        <option value="IL">Illinois</option>
                        <option value="PA">Pennsylvania</option>
                        <option value="OH">Ohio</option>
                        <option value="GA">Georgia</option>
                        <option value="NC">North Carolina</option>
                        <option value="MI">Michigan</option>
                      </select>
                    ) : (
                      <span className="text-xs">{vehicle.state || '—'}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => toggleActive(vehicle.id, vehicle.isActive || false)}
                      disabled={saving === vehicle.id}
                      className={`badge ${vehicle.isActive ? 'badge-success' : 'badge-error'} cursor-pointer hover:opacity-75 transition-opacity`}
                    >
                      {vehicle.isActive ? '✓ Active' : '✖ Inactive'}
                    </button>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center space-x-2">
                      {editingVehicle === vehicle.id ? (
                        <>
                          <button
                            onClick={() => saveChanges(vehicle.id)}
                            disabled={saving === vehicle.id}
                            className="btn btn-success text-xs"
                          >
                            {saving === vehicle.id ? (
                              <>
                                <div className="loading-spinner mr-1"></div>
                                Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={saving === vehicle.id}
                            className="btn btn-secondary text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(vehicle)}
                            className="btn btn-secondary text-xs"
                            disabled={saving === vehicle.id}
                          >
                            {(!vehicle.vin || !vehicle.licensePlate) ? (
                              <>
                                <span className="mr-1">⚠️</span>
                                Edit
                              </>
                            ) : (
                              'Edit'
                            )}
                          </button>
                          <label className="btn btn-secondary text-xs cursor-pointer">
                            Photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                await uploadVehiclePhoto(vehicle.id, file);
                              }}
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {vehicles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
            <p className="text-muted">No vehicles have been registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}


