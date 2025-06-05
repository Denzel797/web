(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/Map.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/leaflet/dist/leaflet-src.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2d$routing$2d$machine$2f$dist$2f$leaflet$2d$routing$2d$machine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/leaflet-routing-machine/dist/leaflet-routing-machine.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
// Fix for default markers
const DefaultIcon = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Icon.Default;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/';
// Default coordinates (Moscow center)
const DEFAULT_COORDS = [
    55.7558,
    37.6173
];
const Map = ({ departureCoords = DEFAULT_COORDS, destinationCoords = DEFAULT_COORDS, onMapClick, onMarkerDrag, interactive = true })=>{
    _s();
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const routingControlRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(`map-${Math.random().toString(36).substr(2, 9)}`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Map.useEffect": ()=>{
            // Validate coordinates
            const validDeparture = Array.isArray(departureCoords) && departureCoords.length === 2 && !isNaN(departureCoords[0]) && !isNaN(departureCoords[1]);
            const validDestination = Array.isArray(destinationCoords) && destinationCoords.length === 2 && !isNaN(destinationCoords[0]) && !isNaN(destinationCoords[1]);
            if (!validDeparture || !validDestination) {
                console.error('Invalid coordinates provided:', {
                    departureCoords,
                    destinationCoords
                });
                return;
            }
            // Define marker icons
            const blueIcon = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [
                    25,
                    41
                ],
                iconAnchor: [
                    12,
                    41
                ],
                popupAnchor: [
                    1,
                    -34
                ],
                shadowSize: [
                    41,
                    41
                ]
            });
            const redIcon = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [
                    25,
                    41
                ],
                iconAnchor: [
                    12,
                    41
                ],
                popupAnchor: [
                    1,
                    -34
                ],
                shadowSize: [
                    41,
                    41
                ]
            });
            // Clean up existing map and routing control
            const cleanup = {
                "Map.useEffect.cleanup": ()=>{
                    if (routingControlRef.current) {
                        routingControlRef.current.remove();
                        routingControlRef.current = null;
                    }
                    if (mapRef.current) {
                        mapRef.current.remove();
                        mapRef.current = null;
                    }
                }
            }["Map.useEffect.cleanup"];
            // Clean up before initializing new map
            cleanup();
            // Initialize map
            mapRef.current = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].map(mapId.current, {
                center: departureCoords,
                zoom: 13,
                layers: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors'
                    })
                ]
            });
            // Add markers
            const departureMarker = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].marker([
                departureCoords[0],
                departureCoords[1]
            ], {
                icon: blueIcon
            }).bindPopup('Отправление').addTo(mapRef.current);
            const destinationMarker = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].marker([
                destinationCoords[0],
                destinationCoords[1]
            ], {
                icon: redIcon
            }).bindPopup('Прибытие').addTo(mapRef.current);
            // Create custom router
            const customRouter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Routing.OSRMv1.extend({
                options: {
                    serviceUrl: 'https://router.project-osrm.org/route/v1'
                },
                _route: {
                    "Map.useEffect.customRouter": function(waypoints, callback, context, options) {
                        const url = this.options.serviceUrl;
                        const coordinates = waypoints.map({
                            "Map.useEffect.customRouter.coordinates": (w)=>`${w.latLng.lng},${w.latLng.lat}`
                        }["Map.useEffect.customRouter.coordinates"]).join(';');
                        fetch(`${url}/driving/${coordinates}?overview=false&alternatives=true&steps=true`, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json'
                            }
                        }).then({
                            "Map.useEffect.customRouter": (response)=>response.json()
                        }["Map.useEffect.customRouter"]).then({
                            "Map.useEffect.customRouter": (data)=>{
                                if (data.error) {
                                    callback.call(context, data.error);
                                    return;
                                }
                                const route = {
                                    name: '',
                                    coordinates: data.routes[0].geometry.coordinates.map({
                                        "Map.useEffect.customRouter": (coord)=>[
                                                coord[1],
                                                coord[0]
                                            ]
                                    }["Map.useEffect.customRouter"]),
                                    summary: {
                                        totalDistance: data.routes[0].distance,
                                        totalTime: data.routes[0].duration
                                    },
                                    instructions: data.routes[0].legs[0].steps.map({
                                        "Map.useEffect.customRouter": (step)=>({
                                                text: step.maneuver.instruction,
                                                distance: step.distance,
                                                time: step.duration,
                                                type: step.maneuver.type
                                            })
                                    }["Map.useEffect.customRouter"])
                                };
                                callback.call(context, null, [
                                    route
                                ]);
                            }
                        }["Map.useEffect.customRouter"]).catch({
                            "Map.useEffect.customRouter": (error)=>{
                                console.error('Routing error:', error);
                                callback.call(context, error);
                            }
                        }["Map.useEffect.customRouter"]);
                    }
                }["Map.useEffect.customRouter"]
            });
            // Add routing control
            routingControlRef.current = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Routing.control({
                waypoints: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].latLng(departureCoords[0], departureCoords[1]),
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].latLng(destinationCoords[0], destinationCoords[1])
                ],
                router: new customRouter(),
                routeWhileDragging: false,
                showAlternatives: false,
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                lineOptions: {
                    styles: [
                        {
                            color: '#4F46E5',
                            opacity: 0.8,
                            weight: 6
                        }
                    ]
                },
                createMarker: {
                    "Map.useEffect": (i, waypoint)=>{
                        const icon = i === 0 ? blueIcon : redIcon;
                        const marker = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].marker(waypoint.latLng, {
                            icon
                        });
                        marker.bindPopup(i === 0 ? 'Отправление' : 'Прибытие');
                        return marker;
                    }
                }["Map.useEffect"],
                show: true
            }).addTo(mapRef.current);
            // Fit bounds to show the entire route
            const bounds = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].latLngBounds([
                departureCoords,
                destinationCoords
            ]);
            mapRef.current.fitBounds(bounds, {
                padding: [
                    50,
                    50
                ]
            });
            // Add click handler if interactive
            if (interactive && onMapClick) {
                mapRef.current.on('click', {
                    "Map.useEffect": (e)=>{
                        const { lat, lng } = e.latlng;
                        onMapClick([
                            lat,
                            lng
                        ]);
                    }
                }["Map.useEffect"]);
            }
            // Cleanup function
            return cleanup;
        }
    }["Map.useEffect"], [
        departureCoords,
        destinationCoords,
        interactive,
        onMapClick
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: mapContainerRef,
        id: mapId.current,
        className: "w-full h-full rounded-lg shadow-md",
        style: {
            minHeight: '400px'
        }
    }, void 0, false, {
        fileName: "[project]/src/components/Map.tsx",
        lineNumber: 232,
        columnNumber: 5
    }, this);
};
_s(Map, "JYfyXYEagY8tmW5tZPMmx+fNlaI=");
_c = Map;
const __TURBOPACK__default__export__ = Map;
var _c;
__turbopack_context__.k.register(_c, "Map");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/Map.tsx [app-client] (ecmascript, next/dynamic entry)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/Map.tsx [app-client] (ecmascript)"));
}}),
}]);

//# sourceMappingURL=src_components_Map_tsx_80bcc3a8._.js.map