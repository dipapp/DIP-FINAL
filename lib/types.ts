export type ClaimStatus = 'Pending' | 'In Review' | 'Approved' | 'Denied';

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

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused';

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
  // Stripe subscription details for this specific vehicle
  subscription?: {
    subscriptionId: string;
    status: SubscriptionStatus;
    priceId?: string;
    createdAt?: any;
  };
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
  vehicleVin?: string;
  date: any;
  amount: number;
  status: ClaimStatus;
  description: string;
  photoURLs: string[];
  createdAt: any;
  updatedAt: any;
};

