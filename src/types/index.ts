export type AccountStatus = 'Active' | 'Suspended'
export type Verification = 'Pending' | 'Approved' | 'Rejected'
export type Availability = 'Available' | 'On trip' | 'Offline'
export type VehicleType = 'Car' | 'Tuk' | 'Bike'
export interface Passenger {
  id: string
  name: string
  email: string
  phone: string
  status: AccountStatus
  verified: boolean
  joined: string
  trips: number
  rating: number
  area: string
}
export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  status: AccountStatus
  verification: Verification
  availability: Availability
  joined: string
  trips: number
  rating: number
  area: string
  vehicleType: VehicleType
  plate: string
  vehicle: string
  x: number
  y: number
  lastSeen: string
}
export interface Ride {
  id: string
  passengerId: string
  driverId: string
  pickup: string
  dropoff: string
  status: 'Requested' | 'Accepted' | 'Active' | 'Completed' | 'Cancelled'
  fare: number
  distance: string
  time: string
  date: string
  method: 'Cash' | 'Card'
  cancellationReason?: string
}
export interface AuditEntry {
  id: string
  action: string
  target: string
  actor: string
  time: string
  category: 'Accounts' | 'Verification' | 'Settings' | 'Payments'
  reason: string
}
export interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  link: string
}
export interface Settings {
  name: string
  email: string
  timezone: string
  emailAlerts: boolean
  approvalAlerts: boolean
  dailySummary: boolean
}
