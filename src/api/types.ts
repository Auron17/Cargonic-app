/** DTO turlar — `docs/superpowers/plans/2026-10-05-cargonic-backend.md` Java recordlaridan. */

export type Role = 'SHIPPER' | 'CARRIER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'BLOCKED'

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type OwnerType = 'CARRIER' | 'VEHICLE' | 'COMPANY'
export type DocType =
  | 'PASSPORT'
  | 'DRIVER_LICENSE'
  | 'DRIVER_LICENSE_BACK'
  | 'TECH_PASSPORT'
  | 'TECH_PASSPORT_BACK'
  | 'LICENSE_CARD'
  | 'VEHICLE_PHOTO'
  | 'INSURANCE'
  | 'COMPANY_CERT'
  | 'DRIVER_PHOTO'

export type LegalType = 'YATT' | 'MCHJ'
export type BodyType =
  | 'TENT'
  | 'REFRIGERATOR'
  | 'FLATBED'
  | 'ISOTHERMAL'
  | 'TIPPER'
  | 'CONTAINER'

export type Region =
  | 'TASHKENT_CITY'
  | 'TASHKENT'
  | 'ANDIJAN'
  | 'FERGANA'
  | 'NAMANGAN'
  | 'SAMARKAND'
  | 'BUKHARA'
  | 'NAVOI'
  | 'KASHKADARYA'
  | 'SURKHANDARYA'
  | 'JIZZAKH'
  | 'SYRDARYA'
  | 'KHOREZM'
  | 'KARAKALPAKSTAN'

export type LoadStatus =
  | 'OPEN'
  | 'BOOKED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'

export type PriceMode = 'FIXED' | 'BIDDING'

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'

export type TripStatus =
  | 'ASSIGNED'
  | 'EN_ROUTE_TO_PICKUP'
  | 'AT_PICKUP'
  | 'LOADED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'

export type EntryType = 'TOPUP' | 'COMMISSION' | 'REFUND' | 'ADJUSTMENT'

export type VerificationKind = 'company' | 'carrier' | 'vehicle' | 'document'

export interface ErrorResponse {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PageDto<T> {
  content: T[]
  page: number
  size: number
  total: number
}

export interface UserDto {
  id: string
  phone: string
  role: Role
  fullName?: string
  status: UserStatus
}

export interface OtpRequest {
  phone: string
}

export interface VerifyRequest {
  phone: string
  code: string
  role?: Role
}

export interface RefreshRequest {
  refreshToken: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: UserDto
}

export interface FcmTokenRequest {
  token: string
}

export interface UploadResponse {
  fileKey: string
}

export interface DocumentDto {
  id: string
  docType: DocType
  fileKey: string
  status: VerificationStatus
  rejectReason?: string
  createdAt: string
}

export interface DocumentRequest {
  docType: DocType
  fileKey: string
}

export interface CompanyRequest {
  name: string
  stir: string
  address: string
}

export interface CompanyDto {
  id: string
  name: string
  stir: string
  address: string
  verificationStatus: VerificationStatus
  rejectReason?: string
  documents?: DocumentDto[]
}

export interface ProfileRequest {
  fullName: string
  legalType: LegalType
  legalName: string
  stir: string
  licenseNumber: string
  homeRegion: Region
}

export interface VehicleRequest {
  plateNumber: string
  bodyType: BodyType
  capacityTons: number
  volumeM3?: number
  licenseCardNumber: string
}

export interface VehicleDto {
  id: string
  plateNumber: string
  bodyType: BodyType
  capacityTons: number
  volumeM3?: number
  licenseCardNumber: string
  verificationStatus: VerificationStatus
  rejectReason?: string
}

export interface ProfileDto {
  id: string
  fullName?: string
  phone: string
  legalType: LegalType
  legalName: string
  stir: string
  licenseNumber: string
  homeRegion: Region
  verificationStatus: VerificationStatus
  rejectReason?: string
  ratingAvg: number
  ratingCount: number
  completedTrips: number
  vehicle?: VehicleDto
  documents?: DocumentDto[]
}

export interface RejectRequest {
  reason: string
}

export interface PendingCompanyDto {
  company: CompanyDto
  memberPhones: string[]
}

export interface PendingVehicleDto {
  carrierId: string
  carrierName?: string
  carrierPhone?: string
  vehicle: VehicleDto
  documents?: DocumentDto[]
}

export interface PendingDocumentDto {
  document: DocumentDto
  ownerType: OwnerType
  ownerId: string
  ownerName?: string
}

export interface VerificationQueueDto {
  companies: PendingCompanyDto[]
  carriers: ProfileDto[]
  vehicles: PendingVehicleDto[]
  documents: PendingDocumentDto[]
}

export interface SettingsDto {
  commissionPercent: number
  matchRadiusKm: number
  autoCompleteHours: number
}

export interface TopUpRequest {
  amount: number
  comment?: string
}

export interface AdjustRequest {
  amount: number
  comment: string
}

export interface EntryDto {
  id: string
  amount: number
  type: EntryType
  tripId?: string
  comment?: string
  createdAt: string
}

export interface WalletDto {
  balance: number
  entries: EntryDto[]
}

export interface LoadRequest {
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  dropoffAddress: string
  dropoffLat: number
  dropoffLng: number
  cargoType: string
  weightTons: number
  volumeM3?: number
  requiredBodyType: BodyType
  pickupDate: string
  pickupTimeFrom?: string
  pickupTimeTo?: string
  priceMode: PriceMode
  price?: number
  insuranceRequired: boolean
  cargoValue?: number
  notes?: string
}

export interface DropoffRequest {
  address: string
  lat: number
  lng: number
}

export interface LoadDto {
  id: string
  companyId: string
  companyName?: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  dropoffAddress: string
  dropoffLat: number
  dropoffLng: number
  routeKm: number
  cargoType: string
  weightTons: number
  volumeM3?: number
  requiredBodyType: BodyType
  pickupDate: string
  pickupTimeFrom?: string
  pickupTimeTo?: string
  priceMode: PriceMode
  price?: number
  insuranceRequired: boolean
  cargoValue?: number
  notes?: string
  status: LoadStatus
  pendingBids?: number
  createdAt: string
  currency?: Currency
  truckCount?: number
  bookedTrucks?: number
  /** Belgilangan narxda yechiladigan komissiya, so'mda */
  commissionEstimate?: number
}

export interface LocationRequest {
  lat: number
  lng: number
}

export interface FeedItem {
  loadId: string
  companyName?: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  /** Koordinatadan aniqlanadi; O'zbekistondan tashqarida — null */
  pickupRegion?: Region | null
  dropoffAddress: string
  dropoffLat: number
  dropoffLng: number
  dropoffRegion?: Region | null
  distanceKm: number
  routeKm: number
  cargoType: string
  weightTons: number
  volumeM3?: number
  requiredBodyType: BodyType
  pickupDate: string
  pickupTimeFrom?: string
  pickupTimeTo?: string
  priceMode: PriceMode
  price?: number
  insuranceRequired: boolean
  notes?: string
  myBidPrice?: number
  currency?: Currency
  truckCount?: number
  /** Bo'sh qolgan mashina joylari */
  freeTrucks?: number
}

/** Yo'nalish bo'yicha qidiruvda saralash */
export type FeedSort = 'DISTANCE' | 'PRICE' | 'PRICE_PER_KM' | 'DATE'

/** Haydovchining saqlangan yo'nalishi: mos yangi yuk chiqsa SAVED_SEARCH_MATCH push keladi */
export interface SavedSearch {
  id: string
  fromRegions: Region[]
  fromLat?: number | null
  fromLng?: number | null
  fromRadiusKm?: number | null
  toRegions: Region[]
  toLat?: number | null
  toLng?: number | null
  toRadiusKm?: number | null
  /** so'mda */
  minPrice?: number | null
  /** so'mda */
  minPricePerKm?: number | null
  notificationsEnabled: boolean
  createdAt: string
}

export interface SavedSearchRequest {
  fromRegions: Region[]
  toRegions: Region[]
  minPrice?: number
  minPricePerKm?: number
  notificationsEnabled: boolean
}

export interface BidRequest {
  price: number
  comment?: string
}

export interface CarrierPublic {
  id: string
  fullName?: string
  ratingAvg: number
  ratingCount: number
  completedTrips: number
  driverPhotoKey?: string
}

export interface VehiclePublic {
  plateNumber?: string
  bodyType: BodyType
  capacityTons: number
  volumeM3?: number
  vehiclePhotoKey?: string
}

export interface BidView {
  id: string
  loadId: string
  price: number
  comment?: string
  status: BidStatus
  createdAt: string
  carrier: CarrierPublic
  vehicle: VehiclePublic
}

export interface MyBid {
  id: string
  loadId: string
  price: number
  comment?: string
  status: BidStatus
  createdAt: string
  pickupAddress: string
  dropoffAddress: string
  pickupDate: string
  currency?: Currency
}

export interface TripSummaryDto {
  id: string
  loadId: string
  status: TripStatus
  agreedPrice: number
  commissionAmount: number
  currency?: Currency
}

export interface StatusRequest {
  status: TripStatus
  photoKey?: string
  lat?: number
  lng?: number
  comment?: string
}

export interface CancelRequest {
  reason: string
}

export interface EttnRequest {
  ettnNumber?: string
  fileKey?: string
}

export interface DisputeRequest {
  reason: string
}

export interface RatingRequest {
  score: number
  comment?: string
}

export interface EventDto {
  type: string
  occurredAt: string
  lat?: number
  lng?: number
  photoKey?: string
  comment?: string
}

export interface TripListItem {
  id: string
  status: TripStatus
  loadId: string
  pickupAddress: string
  dropoffAddress: string
  pickupDate: string
  agreedPrice: number
  companyName?: string
  carrierName?: string
  plateNumber?: string
  disputed: boolean
  createdAt: string
  currency?: Currency
}

export interface TripDetailDto {
  id: string
  status: TripStatus
  agreedPrice: number
  commissionAmount?: number
  load: LoadDto
  carrier: CarrierPublic
  carrierPhone?: string
  vehicle: VehiclePublic
  companyName?: string
  shipperContactName?: string
  shipperPhone?: string
  events: EventDto[]
  ettnNumber?: string
  ettnFileKey?: string
  disputed: boolean
  disputeReason?: string
  ratingScore?: number
  ratingComment?: string
  deliveredAt?: string
  completedAt?: string
  cancelledBy?: string
  cancelReason?: string
  createdAt: string
  currency?: Currency
}

export interface LocationPoint {
  lat: number
  lng: number
  speedKmh?: number
  heading?: number
  recordedAt: string
}

export interface LocationBatch {
  points: LocationPoint[]
}

export interface BatchResult {
  accepted: number
}

export interface TrackPoint {
  lat: number
  lng: number
  speedKmh?: number
  recordedAt: string
}

export interface TrackDto {
  points: TrackPoint[]
  last?: TrackPoint
  staleMinutes?: number
}

export interface LocationMessage {
  type: 'location'
  tripId: string
  lat: number
  lng: number
  speedKmh?: number
  heading?: number
  recordedAt: string
}

export interface TripStatusMessage {
  type: 'status'
  tripId: string
  status: TripStatus
}

export interface ForceCancelRequest {
  refund: boolean
  reason: string
}

export interface LiveTripDto {
  tripId: string
  status: TripStatus
  plateNumber?: string
  carrierName?: string
  carrierPhone?: string
  companyName?: string
  pickupAddress?: string
  dropoffAddress?: string
  lat?: number
  lng?: number
  recordedAt?: string
  staleMinutes?: number
}

export interface StatsDto {
  loadsByStatus: Record<string, number>
  activeTrips: number
  tripsCompletedToday: number
  tripsCompletedThisMonth: number
  commissionToday: number
  commissionThisMonth: number
  approvedCarriers: number
  pendingVerifications: number
}

export interface DemoSummary {
  companies: number
  carriers: number
  openLoads: number
  completedTrips: number
  shipperPhones: string[]
  carrierPhones: string[]
}

export interface SimulationStarted {
  tripId: string
  points: number
  durationSeconds: number
}

export interface InAppNotification {
  type: string
  title: string
  body: string
  data?: Record<string, string>
}

// AI hujjat tekshiruvi (rasm yuklangach, hujjatga biriktirishdan oldin)
export type AiVerdict = 'OK' | 'WARN' | 'FAIL' | 'SKIPPED'
export type AiIssue =
  | 'WRONG_TYPE'
  | 'UNREADABLE'
  | 'BLURRY'
  | 'GLARE'
  | 'CROPPED'
  | 'TOO_DARK'
  | 'PLATE_MISMATCH'
  | 'NAME_MISMATCH'
  | 'NUMBER_MISMATCH'
  | 'EXPIRED'
  | 'NO_TRUCK_CATEGORY'
  | 'CAPACITY_MISMATCH'

export interface AiCheckDto {
  fileKey: string
  docType: DocType
  verdict: AiVerdict
  skipReason?: string
  detectedType?: string
  issues: AiIssue[]
  extracted?: {
    fullName?: string
    documentNumber?: string
    expiryDate?: string
    plateNumber?: string
  }
  checkedAt?: string
}

// Telegram bot orqali kirish
export interface TelegramStartResponse {
  code: string
  deepLink: string
  botUsername: string
  expiresInSeconds: number
}

export interface TelegramStatusResponse {
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CONSUMED' | 'NOT_FOUND'
  auth?: AuthResponse
}

/** Yuk narxi valyutasi; hamyon va komissiya doim so'mda */
export type Currency = 'UZS' | 'USD'
