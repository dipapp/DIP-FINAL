export type RequestStatus = 'Pending' | 'In Review' | 'Approved' | 'Denied';

export type UserProfile = {
  uid: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  marketingOptIn?: boolean;
  createdAt?: any;
  driverLicenseURL?: string;
};

export type VehiclePhoto = {
  id: string;
  imageURL?: string;
  caption?: string;
  dateAdded: any;
  isMain: boolean;
};

export type VehicleDocument = {
  id: string;
  name: string;
  type: 'insurance' | 'registration' | 'driverLicense' | 'other';
  dateAdded: any;
  fileURL?: string;
  imageURL?: string;
};

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: string;
  isActive: boolean;
  lastUpdated: any;
  color?: string;
  vin?: string;
  licensePlate?: string;
  state?: string;
  ownerEmail?: string;
  ownerId?: string;
  photos: VehiclePhoto[];
  insuranceDocuments: VehicleDocument[];
};

export type Claim = {
  id: string;
  userId: string;
  userEmail: string;
  userFirstName?: string;
  userLastName?: string;
  userPhoneNumber?: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  date: any;
  amount: number;
  status: RequestStatus;
  description: string;
  photoURLs: string[];
  createdAt: any;
  updatedAt: any;
};

