'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase/client';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MarketplaceListing, MarketplaceConversation, MarketplaceMessage, ListingCategory, ItemCondition, TitleStatus } from '@/lib/types';
import Image from 'next/image';
import { useGuestMode } from '@/contexts/GuestModeContext';

// Category display helpers
const categoryLabels: Record<ListingCategory, string> = {
  vehicle: 'Vehicle',
  parts: 'Parts & Accessories'
};

const categoryIcons: Record<ListingCategory, string> = {
  vehicle: '🚗',
  parts: '🔧'
};

const conditionLabels: Record<ItemCondition, string> = {
  new: 'New',
  used: 'Used',
  for_parts: 'For Parts'
};

const titleStatusLabels: Record<TitleStatus, string> = {
  clean: 'Clean Title',
  salvage: 'Salvage Title',
  lien_sale: 'Lien Sale'
};

// Format price with commas
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
};

// Helper to check category (iOS saves "Vehicle"/"Parts & Accessories", web uses "vehicle"/"parts")
const isVehicleCategory = (category: string) => {
  return category?.toLowerCase() === 'vehicle';
};

const isPartsCategory = (category: string) => {
  return category?.toLowerCase() === 'parts' || category?.toLowerCase() === 'parts & accessories';
};

// Helper to get display label for condition (iOS saves "New"/"Used"/"For Parts", web uses "new"/"used"/"for_parts")
const getConditionLabel = (condition: string) => {
  if (!condition) return 'Used';
  const lower = condition.toLowerCase();
  if (lower === 'new') return 'New';
  if (lower === 'used') return 'Used';
  if (lower === 'for_parts' || lower === 'for parts' || lower === 'forparts') return 'For Parts';
  // If it's already a display string from iOS, return as-is
  return condition;
};

// Helper to get display label for title status (iOS saves "Clean Title"/"Salvage Title"/"Lien Sale")
const getTitleStatusLabel = (status: string) => {
  if (!status) return '';
  const lower = status.toLowerCase();
  if (lower === 'clean' || lower === 'clean title') return 'Clean Title';
  if (lower === 'salvage' || lower === 'salvage title') return 'Salvage Title';
  if (lower === 'lien_sale' || lower === 'lien sale' || lower === 'liensale') return 'Lien Sale';
  // If it's already a display string, return as-is
  return status;
};

// Format relative time
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default function MarketplacePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [filterZipCode, setFilterZipCode] = useState('');
  const [filterCityName, setFilterCityName] = useState('');
  const [searchRadius, setSearchRadius] = useState<number>(50); // miles, 0 = any
  const { requireAuth } = useGuestMode();

  // Auth and data loading
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        setProfile(snap.exists() ? snap.data() : null);
      }
    });
    return () => unsub();
  }, []);

  // Load listings
  useEffect(() => {
    const q = query(
      collection(db, 'marketplace'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const items: MarketplaceListing[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MarketplaceListing));
      setListings(items);
      setLoading(false);
    });
    
    return () => unsub();
  }, []);

  // Count unread messages
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'marketplace_conversations'),
      where('participants', 'array-contains', user.uid)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.buyerId === user.uid) {
          count += data.unreadForBuyer || 0;
        } else if (data.sellerId === user.uid) {
          count += data.unreadForSeller || 0;
        }
      });
      setUnreadCount(count);
    });
    
    return () => unsub();
  }, [user]);

  // Filter listings
  const filteredListings = listings.filter(listing => {
    // Filter by category
    if (selectedCategory && listing.category !== selectedCategory) return false;
    
    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      const matchesSearch = (
        listing.title.toLowerCase().includes(search) ||
        listing.description.toLowerCase().includes(search) ||
        listing.vehicleMake?.toLowerCase().includes(search) ||
        listing.vehicleModel?.toLowerCase().includes(search) ||
        listing.locationCity?.toLowerCase().includes(search)
      );
      if (!matchesSearch) return false;
    }
    
    // Filter by location (ZIP code prefix matching based on radius)
    if (filterZipCode && searchRadius > 0 && listing.locationZip) {
      // Use ZIP prefix matching based on search radius
      // 10 mi = same ZIP, 25 mi = first 4 digits, 50 mi = first 3 digits, 100 mi = first 2 digits
      let prefixLength = 5; // exact match
      if (searchRadius >= 100) prefixLength = 2;
      else if (searchRadius >= 50) prefixLength = 3;
      else if (searchRadius >= 25) prefixLength = 4;
      else prefixLength = 5;
      
      const userZipPrefix = filterZipCode.slice(0, prefixLength);
      const listingZipPrefix = listing.locationZip.slice(0, prefixLength);
      
      if (userZipPrefix !== listingZipPrefix) return false;
    }
    
    return true;
  }).sort((a, b) => {
    // If location filter is active, sort listings with matching location first
    if (filterZipCode && searchRadius > 0) {
      const aHasZip = a.locationZip ? 1 : 0;
      const bHasZip = b.locationZip ? 1 : 0;
      if (aHasZip !== bHasZip) return bHasZip - aHasZip;
      
      // Sort by ZIP similarity (closer prefix = higher priority)
      if (a.locationZip && b.locationZip) {
        const aMatch = a.locationZip.startsWith(filterZipCode.slice(0, 3)) ? 1 : 0;
        const bMatch = b.locationZip.startsWith(filterZipCode.slice(0, 3)) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }
    }
    return 0;
  });

  // My listings
  const myListings = user ? listings.filter(l => l.sellerId === user.uid) : [];
  
  // Handle protected actions for guests
  const handleCreateListing = () => {
    if (!user) {
      requireAuth('Sign in to post a listing');
      return;
    }
    setShowCreateModal(true);
  };
  
  const handleShowInbox = () => {
    if (!user) {
      requireAuth('Sign in to view your messages');
      return;
    }
    setShowInbox(true);
  };
  
  const handleShowMyListings = () => {
    if (!user) {
      requireAuth('Sign in to view your listings');
      return;
    }
    setShowMyListings(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-600 text-sm">Buy and sell vehicles & parts with DIP</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Inbox Button */}
          <button
            onClick={handleShowInbox}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium text-gray-700">Inbox</span>
            {user && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* My Listings Button */}
          <button
            onClick={handleShowMyListings}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="font-medium text-gray-700">My Listings</span>
            {user && myListings.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {myListings.length}
              </span>
            )}
          </button>
          
          {/* Create Listing Button */}
          <button
            onClick={handleCreateListing}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Post Listing</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col gap-4">
          {/* Top Row: Search and Location */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search marketplace..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            
            {/* Location Filter Button */}
            <button
              onClick={() => setShowLocationPicker(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                filterZipCode 
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                {filterCityName ? (
                  <>
                    {filterCityName}
                    {searchRadius > 0 && <span className="text-blue-500 ml-1">({searchRadius} mi)</span>}
                  </>
                ) : (
                  'Set Location'
                )}
              </span>
              {filterZipCode && (
                <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>
          </div>
          
          {/* Bottom Row: Category Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('vehicle')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                selectedCategory === 'vehicle'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>🚗</span>
              <span>Vehicles</span>
            </button>
            <button
              onClick={() => setSelectedCategory('parts')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                selectedCategory === 'parts'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>🔧</span>
              <span>Parts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚗</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Listings Yet</h3>
          <p className="text-gray-600 mb-6">Be the first to list something for sale!</p>
          <button
            onClick={handleCreateListing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              onClick={() => setSelectedListing(listing)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateListingModal
          user={user}
          profile={profile}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showMyListings && (
        <MyListingsModal
          listings={myListings}
          onClose={() => setShowMyListings(false)}
          onSelect={(listing) => {
            setShowMyListings(false);
            setSelectedListing(listing);
          }}
        />
      )}

      {showInbox && (
        <InboxModal
          user={user}
          profile={profile}
          onClose={() => setShowInbox(false)}
        />
      )}

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          user={user}
          profile={profile}
          isOwner={selectedListing.sellerId === user?.uid}
          onClose={() => setSelectedListing(null)}
        />
      )}

      {showLocationPicker && (
        <LocationPickerModal
          currentZipCode={filterZipCode}
          currentCityName={filterCityName}
          currentRadius={searchRadius}
          onApply={(zipCode, cityName, radius) => {
            setFilterZipCode(zipCode);
            setFilterCityName(cityName);
            setSearchRadius(radius);
            setShowLocationPicker(false);
          }}
          onClear={() => {
            setFilterZipCode('');
            setFilterCityName('');
            setSearchRadius(50);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}

// Listing Card Component
function ListingCard({ listing, onClick }: { listing: MarketplaceListing; onClick: () => void }) {
  const displayTitle = isVehicleCategory(listing.category) && listing.vehicleYear && listing.vehicleMake && listing.vehicleModel
    ? `${listing.vehicleYear} ${listing.vehicleMake} ${listing.vehicleModel}`
    : listing.title;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-sky-200 transition-all group"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {listing.photoURLs.length > 0 ? (
          <img
            src={listing.photoURLs[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-40">
              {isVehicleCategory(listing.category) ? '🚗' : '🔧'}
            </span>
          </div>
        )}
        
        {/* Condition Badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
          {getConditionLabel(listing.condition)}
        </div>
        
        {/* Photo Count */}
        {listing.photoURLs.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-medium">
            📷 {listing.photoURLs.length}
          </div>
        )}
      </div>
      
      {/* Details */}
      <div className="p-4">
        <div className="text-xl font-bold text-gray-900 mb-1">
          {formatPrice(listing.price)}
        </div>
        
        <h3 className="font-medium text-gray-800 line-clamp-2 mb-2">
          {displayTitle}
        </h3>
        
        {/* Vehicle Mileage */}
        {isVehicleCategory(listing.category) && listing.vehicleMileage && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
            <span>🛣️</span>
            <span>{parseInt(listing.vehicleMileage).toLocaleString()} mi</span>
          </div>
        )}
        
        {/* Location */}
        {listing.locationCity && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>📍</span>
            <span>{listing.locationCity}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Create Listing Modal
function CreateListingModal({ user, profile, onClose }: { user: any; profile: any; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<ListingCategory>('vehicle');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  
  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('used');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleMileage, setVehicleMileage] = useState('');
  const [vehicleVIN, setVehicleVIN] = useState('');
  const [titleStatus, setTitleStatus] = useState<TitleStatus>('clean');
  const [partType, setPartType] = useState('');
  const [compatibleVehicles, setCompatibleVehicles] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationZip, setLocationZip] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = [...photos, ...files].slice(0, 10);
    setPhotos(newPhotos);
    
    // Create preview URLs
    const urls = newPhotos.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(urls);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newPhotos.map(file => URL.createObjectURL(file)));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return photos.length > 0 && title.trim();
      case 3: 
        if (category === 'vehicle') {
          return price && vehicleMake && vehicleModel && vehicleYear;
        }
        return price && partType;
      case 4: return locationCity.trim();
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      const listingId = crypto.randomUUID();
      
      // Upload photos
      const photoURLs: string[] = [];
      for (const photo of photos) {
        const storageRef = ref(storage, `marketplace/${listingId}/${crypto.randomUUID()}.jpg`);
        await uploadBytes(storageRef, photo);
        const url = await getDownloadURL(storageRef);
        photoURLs.push(url);
      }
      
      // Create listing document
      const listingData: any = {
        sellerId: user.uid,
        sellerEmail: user.email,
        sellerName: profile?.firstName && profile?.lastName 
          ? `${profile.firstName} ${profile.lastName}`
          : user.email.split('@')[0],
        sellerPhone: profile?.phoneNumber || null,
        category,
        title,
        description,
        price: parseFloat(price.replace(/,/g, '')),
        condition,
        photoURLs,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        locationCity,
        locationZip: locationZip || null,
      };
      
      if (category === 'vehicle') {
        listingData.vehicleMake = vehicleMake;
        listingData.vehicleModel = vehicleModel;
        listingData.vehicleYear = vehicleYear;
        listingData.vehicleColor = vehicleColor || null;
        listingData.vehicleMileage = vehicleMileage || null;
        listingData.vehicleVIN = vehicleVIN || null;
        listingData.titleStatus = titleStatus;
      } else {
        listingData.partType = partType;
        listingData.compatibleVehicles = compatibleVehicles || null;
      }
      
      await addDoc(collection(db, 'marketplace'), listingData);
      onClose();
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 1 && 'What are you selling?'}
            {step === 2 && 'Add Photos & Details'}
            {step === 3 && 'Pricing & Specifications'}
            {step === 4 && 'Location'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-2 px-4 py-3 bg-gray-50">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? 'bg-sky-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Category */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">Choose a category for your listing</p>
              
              {(['vehicle', 'parts'] as ListingCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    category === cat
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">{categoryIcons[cat]}</span>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{categoryLabels[cat]}</div>
                    <div className="text-sm text-gray-500">
                      {cat === 'vehicle' ? 'Cars, trucks, SUVs, motorcycles' : 'Tires, wheels, engines, accessories'}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      category === cat ? 'border-sky-500 bg-sky-500' : 'border-gray-300'
                    }`}>
                      {category === cat && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Photos & Title */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos (up to 10)
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {/* Upload Button */}
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-sky-500 hover:bg-sky-50 transition-colors">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-xs text-gray-500 mt-1">Add Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handlePhotoSelect}
                    />
                  </label>
                  
                  {/* Photo Previews */}
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img 
                        src={url} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-1 left-1 bg-sky-500 text-white text-xs px-2 py-0.5 rounded">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are you selling?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your item..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPrice(val ? parseInt(val).toLocaleString() : '');
                    }}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              
              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['new', 'used', 'for_parts'] as ItemCondition[]).map(cond => (
                    <button
                      key={cond}
                      onClick={() => setCondition(cond)}
                      className={`py-2 px-4 rounded-xl border-2 font-medium transition-all ${
                        condition === cond
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {conditionLabels[cond]}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Vehicle-specific fields */}
              {category === 'vehicle' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        placeholder="2024"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Make <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                        placeholder="Toyota"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="Camry"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mileage
                      </label>
                      <input
                        type="text"
                        value={vehicleMileage}
                        onChange={(e) => setVehicleMileage(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="50000"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                        placeholder="Black"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title Status
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['clean', 'salvage', 'lien_sale'] as TitleStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => setTitleStatus(status)}
                          className={`py-2 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                            titleStatus === status
                              ? 'border-sky-500 bg-sky-50 text-sky-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {titleStatusLabels[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VIN (optional)
                    </label>
                    <input
                      type="text"
                      value={vehicleVIN}
                      onChange={(e) => setVehicleVIN(e.target.value.toUpperCase())}
                      placeholder="17 characters"
                      maxLength={17}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </>
              )}
              
              {/* Parts-specific fields */}
              {category === 'parts' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={partType}
                      onChange={(e) => setPartType(e.target.value)}
                      placeholder="e.g., Brake pads, Alternator, Wheels"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compatible Vehicles
                    </label>
                    <input
                      type="text"
                      value={compatibleVehicles}
                      onChange={(e) => setCompatibleVehicles(e.target.value)}
                      placeholder="e.g., 2015-2020 Honda Civic"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">Add your location so buyers can find your listing</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="Los Angeles"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={locationZip}
                  onChange={(e) => setLocationZip(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                  placeholder="90001"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          
          <button
            onClick={() => {
              if (step < 4) setStep(step + 1);
              else handleSubmit();
            }}
            disabled={!canProceed() || submitting}
            className={`px-8 py-2.5 rounded-xl font-semibold transition-all ${
              canProceed() && !submitting
                ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Posting...
              </span>
            ) : step === 4 ? 'Post Listing' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// My Listings Modal
function MyListingsModal({ 
  listings, 
  onClose, 
  onSelect 
}: { 
  listings: MarketplaceListing[]; 
  onClose: () => void; 
  onSelect: (listing: MarketplaceListing) => void;
}) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleDelete = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await deleteDoc(doc(db, 'marketplace', listingId));
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">My Listings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {listings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📦</span>
              </div>
              <p className="text-gray-600">You haven't posted any listings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {listings.map(listing => (
                <div
                  key={listing.id}
                  onClick={() => onSelect(listing)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {listing.photoURLs.length > 0 ? (
                      <img src={listing.photoURLs[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {isVehicleCategory(listing.category) ? '🚗' : '🔧'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{formatPrice(listing.price)}</div>
                    <div className="text-sm text-gray-600 truncate">{listing.title}</div>
                    <div className={`text-xs ${listing.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {listing.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(listing.id, e)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inbox Modal
function InboxModal({ user, profile, onClose }: { user: any; profile: any; onClose: () => void }) {
  const [conversations, setConversations] = useState<MarketplaceConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<MarketplaceConversation | null>(null);
  const [loading, setLoading] = useState(true);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'marketplace_conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const convos: MarketplaceConversation[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MarketplaceConversation));
      setConversations(convos);
      setLoading(false);
    });
    
    return () => unsub();
  }, [user]);

  if (selectedConversation) {
    return (
      <ChatModal
        conversation={selectedConversation}
        user={user}
        profile={profile}
        onBack={() => setSelectedConversation(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Message sellers to start a conversation</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map(convo => {
                const unread = convo.buyerId === user.uid 
                  ? convo.unreadForBuyer 
                  : convo.unreadForSeller;
                const otherName = convo.buyerId === user.uid 
                  ? convo.sellerName 
                  : convo.buyerName;
                
                return (
                  <div
                    key={convo.id}
                    onClick={() => setSelectedConversation(convo)}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {convo.listingPhotoURL ? (
                        <img src={convo.listingPhotoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{otherName}</span>
                        {unread > 0 && (
                          <span className="bg-sky-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 truncate">{convo.listingTitle}</div>
                      <div className="text-sm text-gray-400 truncate">{convo.lastMessage || 'No messages yet'}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {convo.lastMessageTimestamp?.toDate 
                        ? formatRelativeTime(convo.lastMessageTimestamp.toDate())
                        : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Chat Modal
function ChatModal({ 
  conversation, 
  user, 
  profile,
  onBack, 
  onClose 
}: { 
  conversation: MarketplaceConversation; 
  user: any; 
  profile: any;
  onBack: () => void; 
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const [sending, setSending] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'marketplace_messages'),
      where('conversationId', '==', conversation.id),
      orderBy('timestamp', 'asc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs: MarketplaceMessage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MarketplaceMessage));
      setMessages(msgs);
      
      // Mark messages as read
      msgs.forEach(async (msg) => {
        if (msg.senderId !== user.uid && !msg.isRead) {
          await updateDoc(doc(db, 'marketplace_messages', msg.id), { isRead: true });
        }
      });
    });
    
    return () => unsub();
  }, [conversation.id, user.uid]);

  // Reset unread count when viewing
  useEffect(() => {
    const field = conversation.buyerId === user.uid ? 'unreadForBuyer' : 'unreadForSeller';
    updateDoc(doc(db, 'marketplace_conversations', conversation.id), { [field]: 0 });
  }, [conversation.id, conversation.buyerId, user.uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const senderName = profile?.firstName && profile?.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : user.email.split('@')[0];
      
      await addDoc(collection(db, 'marketplace_messages'), {
        conversationId: conversation.id,
        senderId: user.uid,
        senderName,
        text: newMessage.trim(),
        timestamp: Timestamp.now(),
        isRead: false
      });
      
      // Update conversation
      const recipientField = conversation.buyerId === user.uid ? 'unreadForSeller' : 'unreadForBuyer';
      const currentUnread = conversation.buyerId === user.uid 
        ? conversation.unreadForSeller 
        : conversation.unreadForBuyer;
      
      await updateDoc(doc(db, 'marketplace_conversations', conversation.id), {
        lastMessage: newMessage.trim(),
        lastMessageTimestamp: Timestamp.now(),
        [recipientField]: (currentUnread || 0) + 1
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const otherName = conversation.buyerId === user.uid 
    ? conversation.sellerName 
    : conversation.buyerName;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{otherName}</div>
            <div className="text-sm text-gray-500 truncate">{conversation.listingTitle}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Listing Preview */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-200">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
            {conversation.listingPhotoURL ? (
              <img src={conversation.listingPhotoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">📷</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{conversation.listingTitle}</div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  msg.senderId === user.uid
                    ? 'bg-sky-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}
              >
                <p>{msg.text}</p>
                <div className={`text-xs mt-1 ${
                  msg.senderId === user.uid ? 'text-sky-100' : 'text-gray-400'
                }`}>
                  {msg.timestamp?.toDate ? formatRelativeTime(msg.timestamp.toDate()) : ''}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className={`p-3 rounded-xl transition-all ${
                newMessage.trim() && !sending
                  ? 'bg-sky-500 text-white hover:bg-sky-600'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Listing Detail Modal
function ListingDetailModal({ 
  listing, 
  user, 
  profile,
  isOwner, 
  onClose 
}: { 
  listing: MarketplaceListing; 
  user: any; 
  profile: any;
  isOwner: boolean; 
  onClose: () => void;
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [conversation, setConversation] = useState<MarketplaceConversation | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { requireAuth } = useGuestMode();
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'marketplace', listing.id));
      onClose();
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const displayTitle = isVehicleCategory(listing.category) && listing.vehicleYear && listing.vehicleMake && listing.vehicleModel
    ? `${listing.vehicleYear} ${listing.vehicleMake} ${listing.vehicleModel}`
    : listing.title;

  const startConversation = async () => {
    if (!user) {
      requireAuth('Sign in to message the seller');
      return;
    }
    
    setStartingChat(true);
    try {
      const conversationId = `${listing.id}_${user.uid}`;
      const convoRef = doc(db, 'marketplace_conversations', conversationId);
      const convoSnap = await getDoc(convoRef);
      
      const buyerName = profile?.firstName && profile?.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : user.email.split('@')[0];
      
      if (convoSnap.exists()) {
        setConversation({
          id: conversationId,
          ...convoSnap.data()
        } as MarketplaceConversation);
      } else {
        const newConvo: MarketplaceConversation = {
          id: conversationId,
          listingId: listing.id,
          listingTitle: listing.title,
          listingPhotoURL: listing.photoURLs[0] || undefined,
          sellerId: listing.sellerId,
          sellerName: listing.sellerName,
          buyerId: user.uid,
          buyerName,
          lastMessage: '',
          lastMessageTimestamp: Timestamp.now(),
          unreadForBuyer: 0,
          unreadForSeller: 0,
          participants: [listing.sellerId, user.uid]
        };
        
        await setDoc(doc(db, 'marketplace_conversations', conversationId), newConvo);
        setConversation(newConvo);
      }
      
      setShowChat(true);
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setStartingChat(false);
    }
  };

  if (showChat && conversation) {
    return (
      <ChatModal
        conversation={conversation}
        user={user}
        profile={profile}
        onBack={() => setShowChat(false)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 truncate">{displayTitle}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Photos */}
          {listing.photoURLs.length > 0 ? (
            <div className="relative">
              <div className="bg-gray-100 flex items-center justify-center h-80">
                <img
                  src={listing.photoURLs[currentPhotoIndex]}
                  alt={listing.title}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {listing.photoURLs.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPhotoIndex(i => i > 0 ? i - 1 : listing.photoURLs.length - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentPhotoIndex(i => i < listing.photoURLs.length - 1 ? i + 1 : 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                  >
                    →
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                    {currentPhotoIndex + 1} / {listing.photoURLs.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <span className="text-6xl opacity-30">{isVehicleCategory(listing.category) ? '🚗' : '🔧'}</span>
            </div>
          )}
          
          {/* Thumbnail strip */}
          {listing.photoURLs.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
              {listing.photoURLs.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                    currentPhotoIndex === index ? 'border-sky-500' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          
          {/* Details */}
          <div className="p-6 space-y-4">
            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900">{displayTitle}</h3>
            
            {/* Price */}
            <div className="text-3xl font-bold text-gray-900">
              {formatPrice(listing.price)}
            </div>
            
            {/* Quick Stats - Mileage for vehicles */}
            {isVehicleCategory(listing.category) && listing.vehicleMileage && (
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">{parseInt(listing.vehicleMileage).toLocaleString()} Miles</span>
              </div>
            )}
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                {getConditionLabel(listing.condition)}
              </span>
              {listing.titleStatus && (
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {getTitleStatusLabel(listing.titleStatus)}
                </span>
              )}
              {listing.vehicleColor && (
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {listing.vehicleColor}
                </span>
              )}
            </div>
            
            {/* VIN Section with Copy Button */}
            {isVehicleCategory(listing.category) && listing.vehicleVIN && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">VIN</div>
                    <div className="font-mono text-sm text-gray-900">{listing.vehicleVIN}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(listing.vehicleVIN!);
                      alert('VIN copied to clipboard!');
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
            )}
            
            {/* Posted Date & Location */}
            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                Posted {listing.createdAt?.toDate ? formatRelativeTime(listing.createdAt.toDate()) : 'recently'}
              </div>
              {listing.locationCity && (
                <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">{listing.locationCity}{listing.locationZip && ` (${listing.locationZip})`}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4"></div>
            
            {/* Vehicle/Part Details Section */}
            {isVehicleCategory(listing.category) && (
              <div className="space-y-3">
                {listing.vehicleMake && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Make</span>
                    <span className="text-sm text-gray-900">{listing.vehicleMake}</span>
                  </div>
                )}
                {listing.vehicleModel && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Model</span>
                    <span className="text-sm text-gray-900">{listing.vehicleModel}</span>
                  </div>
                )}
                {listing.vehicleYear && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Year</span>
                    <span className="text-sm text-gray-900">{listing.vehicleYear}</span>
                  </div>
                )}
                {listing.titleStatus && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Title</span>
                    <span className="text-sm text-gray-900">{getTitleStatusLabel(listing.titleStatus)}</span>
                  </div>
                )}
                {listing.vehicleMileage && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Mileage</span>
                    <span className="text-sm text-gray-900">{parseInt(listing.vehicleMileage).toLocaleString()} miles</span>
                  </div>
                )}
                {listing.vehicleColor && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Color</span>
                    <span className="text-sm text-gray-900">{listing.vehicleColor}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Condition</span>
                  <span className="text-sm text-gray-900">{getConditionLabel(listing.condition)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Category</span>
                  <span className="text-sm text-gray-900">Vehicles</span>
                </div>
              </div>
            )}
            
            {/* Parts Details */}
            {isPartsCategory(listing.category) && (
              <div className="space-y-3">
                {listing.partType && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Type</span>
                    <span className="text-sm text-gray-900">{listing.partType}</span>
                  </div>
                )}
                {listing.compatibleVehicles && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Fits</span>
                    <span className="text-sm text-gray-900">{listing.compatibleVehicles}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Condition</span>
                  <span className="text-sm text-gray-900">{getConditionLabel(listing.condition)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Category</span>
                  <span className="text-sm text-gray-900">Parts & Accessories</span>
                </div>
              </div>
            )}
            
            {/* Description */}
            {listing.description && (
              <div>
                <div className="border-t border-gray-200 pt-4 mb-4"></div>
                <div className="text-base font-semibold text-gray-900 mb-2">Description</div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
              </div>
            )}
            
            {/* Seller Info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500 mb-2">Seller</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                  <span className="text-sky-600 font-semibold">
                    {listing.sellerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{listing.sellerName}</div>
                  <div className="text-sm text-gray-500">
                    Listed {listing.createdAt?.toDate ? formatRelativeTime(listing.createdAt.toDate()) : 'recently'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer - Action Buttons */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {isOwner ? (
            // Owner buttons - Edit and Delete
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          ) : (
            // Buyer button - Message Seller
            <button
              onClick={startConversation}
              disabled={startingChat}
              className="w-full py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {startingChat ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Starting chat...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Message Seller</span>
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Listing?</h3>
              <p className="text-gray-600 mb-6">This action cannot be undone. Your listing will be permanently removed.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Listing Modal */}
        {showEditModal && (
          <EditListingModal
            listing={listing}
            onClose={() => setShowEditModal(false)}
            onSave={() => {
              setShowEditModal(false);
              // The listing will be updated via the real-time listener
            }}
          />
        )}
      </div>
    </div>
  );
}

// Edit Listing Modal
function EditListingModal({ 
  listing, 
  onClose, 
  onSave 
}: { 
  listing: MarketplaceListing; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [price, setPrice] = useState(listing.price.toLocaleString());
  const [condition, setCondition] = useState<ItemCondition>(
    listing.condition?.toLowerCase() === 'new' ? 'new' :
    listing.condition?.toLowerCase() === 'for_parts' || listing.condition?.toLowerCase() === 'for parts' ? 'for_parts' : 'used'
  );
  const [vehicleMake, setVehicleMake] = useState(listing.vehicleMake || '');
  const [vehicleModel, setVehicleModel] = useState(listing.vehicleModel || '');
  const [vehicleYear, setVehicleYear] = useState(listing.vehicleYear || '');
  const [vehicleColor, setVehicleColor] = useState(listing.vehicleColor || '');
  const [vehicleMileage, setVehicleMileage] = useState(listing.vehicleMileage || '');
  const [vehicleVIN, setVehicleVIN] = useState(listing.vehicleVIN || '');
  const [titleStatus, setTitleStatus] = useState<TitleStatus>(
    listing.titleStatus?.toLowerCase() === 'salvage' || listing.titleStatus?.toLowerCase() === 'salvage title' ? 'salvage' :
    listing.titleStatus?.toLowerCase() === 'lien_sale' || listing.titleStatus?.toLowerCase() === 'lien sale' ? 'lien_sale' : 'clean'
  );
  const [partType, setPartType] = useState(listing.partType || '');
  const [compatibleVehicles, setCompatibleVehicles] = useState(listing.compatibleVehicles || '');
  const [locationCity, setLocationCity] = useState(listing.locationCity || '');
  const [locationZip, setLocationZip] = useState(listing.locationZip || '');
  const [isSaving, setIsSaving] = useState(false);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const isVehicle = isVehicleCategory(listing.category);

  const canSave = () => {
    if (!title.trim() || !price) return false;
    if (isVehicle) {
      return vehicleMake.trim() && vehicleModel.trim() && vehicleYear.trim();
    }
    return partType.trim();
  };

  const handleSave = async () => {
    if (!canSave()) return;
    
    setIsSaving(true);
    try {
      const updateData: any = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price.replace(/,/g, '')),
        condition,
        locationCity: locationCity.trim(),
        locationZip: locationZip.trim() || null,
        updatedAt: Timestamp.now(),
      };
      
      if (isVehicle) {
        updateData.vehicleMake = vehicleMake.trim();
        updateData.vehicleModel = vehicleModel.trim();
        updateData.vehicleYear = vehicleYear.trim();
        updateData.vehicleColor = vehicleColor.trim() || null;
        updateData.vehicleMileage = vehicleMileage || null;
        updateData.vehicleVIN = vehicleVIN.trim() || null;
        updateData.titleStatus = titleStatus;
      } else {
        updateData.partType = partType.trim();
        updateData.compatibleVehicles = compatibleVehicles.trim() || null;
      }
      
      await updateDoc(doc(db, 'marketplace', listing.id), updateData);
      onSave();
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('Failed to update listing. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Listing</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Listing Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Listing Details</h3>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPrice(val ? parseInt(val).toLocaleString() : '');
                  }}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['new', 'used', 'for_parts'] as ItemCondition[]).map(cond => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`py-2 px-4 rounded-xl border-2 font-medium transition-all ${
                      condition === cond
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {conditionLabels[cond]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Vehicle Details Section */}
          {isVehicle && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Vehicle Details</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mileage
                  </label>
                  <input
                    type="text"
                    value={vehicleMileage}
                    onChange={(e) => setVehicleMileage(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['clean', 'salvage', 'lien_sale'] as TitleStatus[]).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setTitleStatus(status)}
                      className={`py-2 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                        titleStatus === status
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {titleStatusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VIN (optional)
                </label>
                <input
                  type="text"
                  value={vehicleVIN}
                  onChange={(e) => setVehicleVIN(e.target.value.toUpperCase())}
                  maxLength={17}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>
          )}
          
          {/* Parts Details Section */}
          {!isVehicle && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Part Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={partType}
                  onChange={(e) => setPartType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compatible Vehicles
                </label>
                <input
                  type="text"
                  value={compatibleVehicles}
                  onChange={(e) => setCompatibleVehicles(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}
          
          {/* Location Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Location</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={locationZip}
                  onChange={(e) => setLocationZip(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>
          
          {/* Description Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Description</h3>
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={!canSave() || isSaving}
            className={`px-8 py-2.5 rounded-xl font-semibold transition-all ${
              canSave() && !isSaving
                ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Location Picker Modal
function LocationPickerModal({
  currentZipCode,
  currentCityName,
  currentRadius,
  onApply,
  onClear,
  onClose
}: {
  currentZipCode: string;
  currentCityName: string;
  currentRadius: number;
  onApply: (zipCode: string, cityName: string, radius: number) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [zipCodeInput, setZipCodeInput] = useState(currentZipCode);
  const [cityName, setCityName] = useState(currentCityName);
  const [radius, setRadius] = useState(currentRadius);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const radiusOptions = [
    { value: 10, label: '10 mi' },
    { value: 25, label: '25 mi' },
    { value: 50, label: '50 mi' },
    { value: 100, label: '100 mi' },
    { value: 0, label: 'Any' }
  ];

  const lookupZipCode = async () => {
    if (!zipCodeInput || zipCodeInput.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use a free ZIP code API to get city name
      const response = await fetch(`https://api.zippopotam.us/us/${zipCodeInput}`);
      if (!response.ok) {
        throw new Error('Invalid ZIP code');
      }
      const data = await response.json();
      const place = data.places?.[0];
      if (place) {
        setCityName(`${place['place name']}, ${place['state abbreviation']}`);
      }
    } catch (err) {
      setError('Invalid ZIP code. Please try again.');
      setCityName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (zipCodeInput && cityName) {
      onApply(zipCodeInput, cityName, radius);
    } else if (zipCodeInput) {
      // Try to lookup first
      lookupZipCode().then(() => {
        if (cityName) {
          onApply(zipCodeInput, cityName, radius);
        }
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode to get ZIP code
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.address;
          
          if (address?.postcode) {
            setZipCodeInput(address.postcode.slice(0, 5));
            const city = address.city || address.town || address.village || address.county || '';
            const state = address.state || '';
            setCityName(city ? `${city}, ${state}` : '');
          } else {
            setError('Could not determine your location');
          }
        } catch (err) {
          setError('Failed to get location details');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setIsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enter ZIP code manually.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location unavailable. Please enter ZIP code manually.');
            break;
          default:
            setError('Failed to get location. Please enter ZIP code manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Search Location</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header Text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Where are you searching?</h3>
            <p className="text-sm text-gray-500 mt-1">Find listings near your location</p>
          </div>
          
          {/* Use My Location Button */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 text-blue-600 font-medium rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
            )}
            <span>Use my current location</span>
          </button>
          
          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">Or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          
          {/* ZIP Code Input */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter ZIP code"
                value={zipCodeInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                  setZipCodeInput(val);
                  setError('');
                }}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={lookupZipCode}
                disabled={isLoading || zipCodeInput.length !== 5}
                className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lookup
              </button>
            </div>
            
            {/* City Name Display */}
            {cityName && (
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 text-green-700 rounded-full">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="font-medium">{cityName}</span>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </div>
          
          {/* Search Radius */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Search radius</label>
            <div className="grid grid-cols-5 gap-2">
              {radiusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRadius(option.value)}
                  className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                    radius === option.value
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <button
            onClick={handleApply}
            disabled={!zipCodeInput || !cityName}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              zipCodeInput && cityName
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Apply
          </button>
          
          {(currentZipCode || currentCityName) && (
            <button
              onClick={onClear}
              className="w-full py-2 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
            >
              Clear Location Filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
