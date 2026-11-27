import { useState } from 'react'
import {
  CarFront,
  Bike,
  Navigation,
  Plus,
  Minus,
  LocateFixed,
  X,
  Maximize2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { Avatar, Badge } from '../../components/shared/common'
import { Button } from '../../components/ui/button'
import type { Driver } from '../../types'

export function OperationsMap({
  compact = false,
  status = 'All',
  type = 'All',
  area = 'All',
  focusId,
}: {
  compact?: boolean
  status?: string
  type?: string
  area?: string
  focusId?: string
}) {
  const drivers = useStore((s) => s.drivers)
  const [selected, setSelected] = useState<Driver | null>(null)
  const [zoom, setZoom] = useState(1)
  const visible = drivers.filter(
    (d) =>
      d.status === 'Active' &&
      d.verification === 'Approved' &&
      d.availability !== 'Offline' &&
      (status === 'All' || d.availability === status) &&
      (type === 'All' || d.vehicleType === type) &&
      (area === 'All' || d.area === area),
  )
  const focused = visible.find((d) => d.id === focusId)
  const selectedDriver = selected && visible.find((d) => d.id === selected.id)
  return (
    <div
      className={`operations-map relative overflow-hidden ${compact ? 'h-[310px]' : 'h-[560px] min-h-[420px]'}`}
    >
      <div
        className="absolute inset-0 transition-transform duration-300"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: focused ? `${focused.x}% ${focused.y}%` : '55% 50%',
        }}
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1000 650"
          preserveAspectRatio="xMidYMid slice"
          aria-label="Illustrated demo map of Colombo"
        >
          <defs>
            <pattern
              id="blocks"
              width="100"
              height="95"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-18)"
            >
              <rect width="100" height="95" fill="#f0f2ee" />
              <rect x="6" y="6" width="40" height="34" rx="3" fill="#e6e9e3" />
              <rect x="53" y="6" width="40" height="34" rx="3" fill="#e7eae5" />
              <rect x="6" y="48" width="87" height="40" rx="3" fill="#e8ebe5" />
              <path
                d="M0 44H100 M49 0V44 M0 92H100"
                stroke="#fff"
                strokeWidth="5"
              />
            </pattern>
          </defs>
          <rect width="1000" height="650" fill="url(#blocks)" />
          <path
            d="M0 0H185L170 90L205 170L190 280L235 350L242 450L270 540L260 650H0Z"
            fill="#d4e7e9"
          />
          <path
            d="M185 0L170 90L205 170L190 280L235 350L242 450L270 540L260 650"
            fill="none"
            stroke="#f9faf6"
            strokeWidth="13"
          />
          <path
            d="M690 0Q645 100 735 160T775 285Q820 340 940 300T1050 350"
            fill="none"
            stroke="#cee4e7"
            strokeWidth="32"
          />
          <path
            d="M330 110L455 60L550 125L500 230L365 255L310 175Z M680 420L760 390L820 475L740 520L660 480Z"
            fill="#cfe0c5"
            stroke="#c3d5bb"
            strokeWidth="1"
          />
          <path
            d="M240 650L286 480L300 360L277 210L306 0 M250 415L450 380L580 270L830 110L1000 75 M295 165L450 205L650 190L1000 230 M360 650L470 520L620 500L1000 570 M420 0L460 190L490 360L545 650 M1000 420L790 390L655 340L510 315L300 360"
            fill="none"
            stroke="#d8dcce"
            strokeWidth="15"
          />
          <path
            d="M240 650L286 480L300 360L277 210L306 0 M250 415L450 380L580 270L830 110L1000 75 M295 165L450 205L650 190L1000 230 M360 650L470 520L620 500L1000 570 M420 0L460 190L490 360L545 650 M1000 420L790 390L655 340L510 315L300 360"
            fill="none"
            stroke="#fffdf4"
            strokeWidth="9"
          />
          <path
            d="M460 190L490 360L620 500L790 390"
            fill="none"
            stroke="#b9d4cc"
            strokeWidth="3"
            strokeDasharray="6 7"
          />
          <g
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
            fill="#818c82"
            fontSize="12"
            fontWeight="500"
          >
            <text x="350" y="100">
              COLOMBO 02
            </text>
            <text x="360" y="310">
              KOLLUPITIYA
            </text>
            <text x="565" y="178">
              CINNAMON GARDENS
            </text>
            <text x="795" y="350">
              RAJAGIRIYA
            </text>
            <text x="600" y="550">
              NUGEGODA
            </text>
            <text x="340" y="530">
              BAMBALAPITIYA
            </text>
            <text
              x="83"
              y="350"
              fill="#87b2ba"
              transform="rotate(-76 83 350)"
              letterSpacing="4"
            >
              INDIAN OCEAN
            </text>
          </g>
          <g fontFamily="system-ui, sans-serif" fill="#8fa286" fontSize="10">
            <text x="355" y="161">
              Viharamahadevi Park
            </text>
            <text x="690" y="465">
              Diyatha Uyana
            </text>
          </g>
        </svg>
        {visible.map((driver) => (
          <button
            key={driver.id}
            title={`${driver.name} · ${driver.availability}`}
            aria-label={`View ${driver.name}, ${driver.availability}`}
            onClick={() => setSelected(driver)}
            className={`map-marker ${driver.availability === 'On trip' ? 'map-marker-busy' : ''} ${focused?.id === driver.id || selectedDriver?.id === driver.id ? 'map-marker-selected' : ''}`}
            style={{
              left: `${driver.x}%`,
              top: `${driver.y}%`,
              transform: `translate(-50%, -50%) scale(${1 / zoom})`,
            }}
          >
            {driver.vehicleType === 'Bike' ? (
              <Bike size={15} />
            ) : driver.vehicleType === 'Tuk' ? (
              <Navigation size={14} />
            ) : (
              <CarFront size={15} />
            )}
          </button>
        ))}
      </div>
      <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-white/80 bg-white/95 px-3 py-2 shadow-sm">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />
          <span className="relative size-2 rounded-full bg-location" />
        </span>
        <span className="text-sm font-medium">
          {visible.length} drivers on map
        </span>
      </div>
      <div className="absolute top-4 right-4 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <button
          aria-label="Zoom in"
          className="p-2.5 hover:bg-slate-50 disabled:opacity-30"
          disabled={zoom >= 2}
          onClick={() => setZoom((v) => Math.min(2, v + 0.25))}
        >
          <Plus size={15} />
        </button>
        <div className="border-t border-slate-100" />
        <button
          aria-label="Zoom out"
          className="p-2.5 hover:bg-slate-50 disabled:opacity-30"
          disabled={zoom <= 1}
          onClick={() => setZoom((v) => Math.max(1, v - 0.25))}
        >
          <Minus size={15} />
        </button>
      </div>
      <button
        className="absolute right-4 bottom-11 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50"
        onClick={() => {
          setZoom(1)
          setSelected(null)
        }}
        aria-label="Reset map view"
      >
        <LocateFixed size={16} />
      </button>
      {selectedDriver && (
        <div className="absolute bottom-10 left-4 w-[250px] rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <button
            aria-label="Close driver preview"
            className="absolute top-2 right-2 p-1 text-slate-400"
            onClick={() => setSelected(null)}
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-2">
            <Avatar name={selectedDriver.name} size="sm" />
            <div>
              <p className="text-sm font-semibold">{selectedDriver.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {selectedDriver.vehicle} · {selectedDriver.plate}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge>{selectedDriver.availability}</Badge>
            <Link
              className="text-sm font-medium text-brand-700"
              to={`/drivers/${selectedDriver.id}`}
            >
              View profile
            </Link>
          </div>
        </div>
      )}
      <div className="absolute right-0 bottom-0 left-0 flex items-center justify-between bg-white/85 px-4 py-2 text-[11px] text-slate-500">
        <span>Illustrated map · Simulated positions · Colombo, LK</span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
      {!visible.length && (
        <div className="absolute top-1/2 left-1/2 w-64 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/95 p-5 text-center text-sm text-slate-600 shadow-md">
          No drivers match these map filters.
        </div>
      )}
      {compact && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="absolute bottom-11 left-4"
        >
          <Link to="/live-map">
            <Maximize2 size={12} />
            Expand map
          </Link>
        </Button>
      )}
    </div>
  )
}
