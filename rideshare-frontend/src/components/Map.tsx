'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Extend the L namespace with routing types
declare global {
  namespace L {
    namespace Routing {
      interface RoutingControl extends L.Control {
        getPlan(): RoutingPlan;
        getRouter(): any;
        route(): void;
        setRouter(router: any): void;
        on(event: string, callback: (e: any) => void): void;
        remove(): void;
      }

      interface RoutingControlOptions {
        waypoints: L.LatLng[];
        routeWhileDragging?: boolean;
        showAlternatives?: boolean;
        addWaypoints?: boolean;
        draggableWaypoints?: boolean;
        fitSelectedRoutes?: boolean;
        lineOptions?: {
          styles: {
            color: string;
            opacity: number;
            weight: number;
          }[];
        };
        createMarker?(i: number, waypoint: any, n: number): L.Marker;
        show?: boolean;
        router?: any;
      }

      interface RoutingPlan extends L.Evented {
        setWaypoints(waypoints: L.LatLng[]): RoutingPlan;
      }
    }

    function routing(options: Routing.RoutingControlOptions): Routing.RoutingControl;
  }
}

// Fix for default markers
const DefaultIcon = L.Icon.Default;
L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/';

// Default coordinates (Moscow center)
const DEFAULT_COORDS: [number, number] = [55.7558, 37.6173];

interface MapProps {
  departureCoords?: [number, number];
  destinationCoords?: [number, number];
  onMapClick?: (coords: [number, number]) => void;
  onMarkerDrag?: (coords: [number, number]) => void;
  interactive?: boolean;
}

const Map = ({ 
  departureCoords = DEFAULT_COORDS, 
  destinationCoords = DEFAULT_COORDS, 
  onMapClick, 
  onMarkerDrag, 
  interactive = true 
}: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Validate coordinates
    const validDeparture = Array.isArray(departureCoords) && departureCoords.length === 2 &&
      !isNaN(departureCoords[0]) && !isNaN(departureCoords[1]);
    const validDestination = Array.isArray(destinationCoords) && destinationCoords.length === 2 &&
      !isNaN(destinationCoords[0]) && !isNaN(destinationCoords[1]);

    if (!validDeparture || !validDestination) {
      console.error('Invalid coordinates provided:', { departureCoords, destinationCoords });
      return;
    }

    // Define marker icons
    const blueIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const redIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Clean up existing map and routing control
    const cleanup = () => {
      if (routingControlRef.current) {
        routingControlRef.current.remove();
        routingControlRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };

    // Clean up before initializing new map
    cleanup();

    // Initialize map
    mapRef.current = L.map(mapId.current, {
      center: departureCoords,
      zoom: 13,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        })
      ]
    });

    // Add markers
    const departureMarker = L.marker([departureCoords[0], departureCoords[1]], { icon: blueIcon })
      .bindPopup('Отправление')
      .addTo(mapRef.current);

    const destinationMarker = L.marker([destinationCoords[0], destinationCoords[1]], { icon: redIcon })
      .bindPopup('Прибытие')
      .addTo(mapRef.current);

    // Create custom router
    const customRouter = L.Routing.OSRMv1.extend({
      options: {
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      },
      _route: function(waypoints: L.Routing.Waypoint[], callback: Function, context: any, options: any) {
        const url = this.options.serviceUrl;
        const coordinates = waypoints.map(w => `${w.latLng.lng},${w.latLng.lat}`).join(';');
        
        fetch(`${url}/driving/${coordinates}?overview=false&alternatives=true&steps=true`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            callback.call(context, data.error);
            return;
          }

          const route = {
            name: '',
            coordinates: data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]),
            summary: {
              totalDistance: data.routes[0].distance,
              totalTime: data.routes[0].duration
            },
            instructions: data.routes[0].legs[0].steps.map((step: any) => ({
              text: step.maneuver.instruction,
              distance: step.distance,
              time: step.duration,
              type: step.maneuver.type
            }))
          };

          callback.call(context, null, [route]);
        })
        .catch(error => {
          console.error('Routing error:', error);
          callback.call(context, error);
        });
      }
    });

    // Add routing control
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(departureCoords[0], departureCoords[1]),
        L.latLng(destinationCoords[0], destinationCoords[1])
      ],
      router: new customRouter(),
      routeWhileDragging: false,
      showAlternatives: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [
          { color: '#4F46E5', opacity: 0.8, weight: 6 }
        ]
      },
      createMarker: (i: number, waypoint: any) => {
        const icon = i === 0 ? blueIcon : redIcon;
        const marker = L.marker(waypoint.latLng, { icon });
        marker.bindPopup(i === 0 ? 'Отправление' : 'Прибытие');
        return marker;
      },
      show: true
    }).addTo(mapRef.current);

    // Fit bounds to show the entire route
    const bounds = L.latLngBounds([departureCoords, destinationCoords]);
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });

    // Add click handler if interactive
    if (interactive && onMapClick) {
      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onMapClick([lat, lng]);
      });
    }

    // Cleanup function
    return cleanup;
  }, [departureCoords, destinationCoords, interactive, onMapClick]);

  return (
    <div 
      ref={mapContainerRef}
      id={mapId.current}
      className="w-full h-full rounded-lg shadow-md" 
      style={{ minHeight: '400px' }} 
    />
  );
};

export default Map; 