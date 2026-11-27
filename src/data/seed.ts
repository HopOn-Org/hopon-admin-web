import type {
  AuditEntry,
  Driver,
  Notification,
  Passenger,
  Ride,
} from '../types'

const driverNames = [
  'Kasun Perera',
  'Nimal Fernando',
  'Dilshan Silva',
  'Tharindu Jayasinghe',
  'Mohamed Rizwan',
  'Amal Rathnayake',
  'Dinesh Kumara',
  'Chamath Wijesinghe',
  'Ruwan Senanayake',
  'Pradeep Bandara',
  'Isuru Madushanka',
  'Sahan Dias',
  'Nuwan Gamage',
  'Akila Samarasinghe',
  'Ravindu De Silva',
  'Fazil Ahamed',
  'Lahiru Dissanayake',
  'Buddhika Rajapaksha',
]
const areas = [
  'Colombo 03',
  'Colombo 07',
  'Nugegoda',
  'Rajagiriya',
  'Dehiwala',
  'Bambalapitiya',
]
const cars = [
  'Toyota Prius',
  'Bajaj RE',
  'Honda Dio',
  'Suzuki Wagon R',
  'Bajaj RE',
  'Honda Vezel',
]
export const seedDrivers: Driver[] = driverNames.map((name, i) => ({
  id: `DR-${String(1041 + i)}`,
  name,
  email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
  phone: `+94 77 ${String(2345600 + i * 137)}`,
  status: i === 12 ? 'Suspended' : 'Active',
  verification: [1, 4, 7, 10, 15].includes(i)
    ? 'Pending'
    : i === 14
      ? 'Rejected'
      : 'Approved',
  availability: [1, 4, 7, 10, 12, 14, 15, 17].includes(i)
    ? 'Offline'
    : i % 3 === 0
      ? 'On trip'
      : 'Available',
  joined: `2026-11-${String(8 + i).padStart(2, '0')}`,
  trips: i * 47 + 128,
  rating: Number((4.6 + (i % 4) / 10).toFixed(1)),
  area: areas[i % areas.length],
  vehicleType: i % 6 === 2 ? 'Bike' : [1, 4].includes(i % 6) ? 'Tuk' : 'Car',
  plate: `WP ${['CAB', 'ABG', 'BHP'][i % 3]}-${4521 + i * 17}`,
  vehicle: cars[i % 6],
  x: 28 + ((i * 23) % 60),
  y: 18 + ((i * 17) % 65),
  lastSeen: 'Just now',
}))
const passengerNames = [
  'Anjali Silva',
  'Sachini Perera',
  'Kavindu Fernando',
  'Dinithi Jayawardena',
  'Ashan Rodrigo',
  'Shanika Gamage',
  'Hasini De Silva',
  'Pasindu Wickramasinghe',
  'Nethmi Karunaratne',
  'Vihan Senaratne',
  'Fathima Nazeer',
  'Oshada Peiris',
  'Senuri Bandara',
  'Dulaj Ranasinghe',
  'Yasara Gunasekara',
  'Minul Jayasuriya',
  'Ayesha Fawaz',
  'Janith Abeysekara',
  'Hiruni Wijesinghe',
  'Thilina Dias',
  'Rashmi Pathirana',
  'Devinda Silva',
  'Sithumi Fernando',
  'Malith Perera',
]
export const seedPassengers: Passenger[] = passengerNames.map((name, i) => ({
  id: `PS-${2041 + i}`,
  name,
  email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
  phone: `+94 71 ${3456700 + i * 153}`,
  status: [5, 16].includes(i) ? 'Suspended' : 'Active',
  verified: i % 7 !== 0,
  joined: `2026-${i % 2 ? '10' : '11'}-${String(i + 1).padStart(2, '0')}`,
  trips: 8 + i * 7,
  rating: Number((4.5 + (i % 5) / 10).toFixed(1)),
  area: areas[i % 6],
}))
const pickups = [
  'Cinnamon Grand, Colombo 03',
  'Liberty Plaza, Kollupitiya',
  'Independence Square',
  'One Galle Face Mall',
  'Nugegoda Junction',
  'Bambalapitiya Station',
]
const dropoffs = [
  'World Trade Center, Fort',
  'Nugegoda High Level Road',
  'Rajagiriya Junction',
  'Dehiwala Junction',
  'Colombo City Centre',
  'Havelock City Mall',
]
export const seedRides: Ride[] = Array.from({ length: 32 }, (_, i) => ({
  id: `HP-${8824 - i}`,
  passengerId: seedPassengers[i % 24].id,
  driverId: seedDrivers[[0, 2, 3, 5, 6, 8, 9, 11, 13, 16][i % 10]].id,
  pickup: pickups[i % 6],
  dropoff: dropoffs[i % 6],
  status:
    i === 1 || i === 5
      ? 'Active'
      : i === 2
        ? 'Accepted'
        : i === 3
          ? 'Cancelled'
          : i === 7
            ? 'Requested'
            : 'Completed',
  fare: 450 + ((i * 137) % 2100),
  distance: `${(3.2 + (i % 12)).toFixed(1)} km`,
  time: `${String(14 - Math.floor(i / 6)).padStart(2, '0')}:${String(52 - (i % 6) * 8).padStart(2, '0')}`,
  date: i < 16 ? '2026-11-26' : i < 26 ? '2026-11-25' : '2026-11-24',
  method: i % 3 === 0 ? 'Cash' : 'Card',
  ...(i === 3
    ? { cancellationReason: 'Passenger changed travel plans before pickup.' }
    : {}),
}))
export const seedAudit: AuditEntry[] = [
  {
    id: 'AU-1003',
    action: 'Driver approved',
    target: 'Kasun Perera',
    actor: 'Alex Morgan',
    time: '2026-11-26T08:25:00Z',
    category: 'Verification',
    reason: 'All submitted documents verified.',
  },
  {
    id: 'AU-1002',
    action: 'Account suspended',
    target: 'Shanika Gamage',
    actor: 'Alex Morgan',
    time: '2026-11-26T06:45:00Z',
    category: 'Accounts',
    reason: 'Account flagged for repeated misuse of promotions.',
  },
  {
    id: 'AU-1001',
    action: 'Driver rejected',
    target: 'Ravindu De Silva',
    actor: 'Alex Morgan',
    time: '2026-11-25T09:10:00Z',
    category: 'Verification',
    reason: 'Driving license expired. Updated document required.',
  },
]
export const seedNotifications: Notification[] = [
  {
    id: 'NT-1',
    title: 'Applications ready for review',
    message: '5 drivers are waiting for document verification.',
    time: '10 minutes ago',
    read: false,
    link: '/drivers?status=Pending',
  },
  {
    id: 'NT-2',
    title: 'Daily report is ready',
    message: 'Explore ride activity and revenue for November 26.',
    time: '35 minutes ago',
    read: false,
    link: '/reports',
  },
  {
    id: 'NT-3',
    title: 'Driver verification completed',
    message: 'Kasun Perera has been approved to drive with HopOn.',
    time: '1 hour ago',
    read: true,
    link: '/drivers/DR-1041',
  },
]
export const weeklyMetrics = [
  { day: 'Mon', rides: 820, previous: 640, revenue: 234000 },
  { day: 'Tue', rides: 960, previous: 720, revenue: 285000 },
  { day: 'Wed', rides: 870, previous: 790, revenue: 264000 },
  { day: 'Thu', rides: 1180, previous: 860, revenue: 348000 },
  { day: 'Fri', rides: 1030, previous: 810, revenue: 312000 },
  { day: 'Sat', rides: 1380, previous: 1010, revenue: 412000 },
  { day: 'Sun', rides: 1248, previous: 960, revenue: 386450 },
]
