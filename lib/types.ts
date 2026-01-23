export type RequestStatus = 'Pending' | 'In Review' | 'Approved' | 'Denied';
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

// Marketplace Types
export type ListingCategory = 'vehicle' | 'parts';
export type ItemCondition = 'new' | 'used' | 'for_parts';
export type TitleStatus = 'clean' | 'salvage' | 'lien_sale';

export type MarketplaceListing = {
  id: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  sellerPhone?: string;
  category: ListingCategory;
  title: string;
  price: number;
  condition: ItemCondition;
  description: string;
  photoURLs: string[];
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  // Location fields
  locationCity?: string;
  locationState?: string;
  locationZip?: string;
  latitude?: number;
  longitude?: number;
  // Vehicle-specific fields
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehicleColor?: string;
  vehicleMileage?: string;
  vehicleVIN?: string;
  titleStatus?: TitleStatus;
  // Parts-specific fields
  partType?: string;
  compatibleVehicles?: string;
};export type MarketplaceConversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPhotoURL?: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  lastMessage: string;
  lastMessageTimestamp: any;
  unreadForBuyer: number;
  unreadForSeller: number;
  participants: string[];
};

export type MarketplaceMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  isRead: boolean;
};