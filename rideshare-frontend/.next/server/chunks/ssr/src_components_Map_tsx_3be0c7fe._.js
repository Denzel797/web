module.exports = {

"[project]/src/components/Map.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Map)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/leaflet/dist/leaflet-src.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function Map({ onMapClick, onMarkerDrag, departureCoords, destinationCoords }) {
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const departureMarkerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const destinationMarkerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const routeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Initialize map
        if (!mapRef.current) {
            mapRef.current = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].map('map').setView([
                55.76,
                37.64
            ], 10);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapRef.current);
            // Add click handler
            mapRef.current.on('click', (e)=>{
                const { lat, lng } = e.latlng;
                onMapClick([
                    lat,
                    lng
                ]);
            });
        }
        // Cleanup on unmount
        return ()=>{
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!mapRef.current) return;
        // Update departure marker
        if (departureCoords) {
            if (departureMarkerRef.current) {
                departureMarkerRef.current.setLatLng(departureCoords);
            } else {
                departureMarkerRef.current = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].marker(departureCoords, {
                    draggable: true,
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].divIcon({
                        className: 'bg-blue-500 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold',
                        html: 'A'
                    })
                }).addTo(mapRef.current);
                departureMarkerRef.current.on('dragend', (e)=>{
                    const marker = e.target;
                    const position = marker.getLatLng();
                    onMarkerDrag('departure', [
                        position.lat,
                        position.lng
                    ]);
                });
            }
        } else if (departureMarkerRef.current) {
            departureMarkerRef.current.remove();
            departureMarkerRef.current = null;
        }
        // Update destination marker
        if (destinationCoords) {
            if (destinationMarkerRef.current) {
                destinationMarkerRef.current.setLatLng(destinationCoords);
            } else {
                destinationMarkerRef.current = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].marker(destinationCoords, {
                    draggable: true,
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].divIcon({
                        className: 'bg-red-500 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold',
                        html: 'B'
                    })
                }).addTo(mapRef.current);
                destinationMarkerRef.current.on('dragend', (e)=>{
                    const marker = e.target;
                    const position = marker.getLatLng();
                    onMarkerDrag('destination', [
                        position.lat,
                        position.lng
                    ]);
                });
            }
        } else if (destinationMarkerRef.current) {
            destinationMarkerRef.current.remove();
            destinationMarkerRef.current = null;
        }
        // Update route
        if (departureCoords && destinationCoords) {
            if (routeRef.current) {
                routeRef.current.setLatLngs([
                    departureCoords,
                    destinationCoords
                ]);
            } else {
                routeRef.current = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].polyline([
                    departureCoords,
                    destinationCoords
                ], {
                    color: '#3B82F6',
                    weight: 3,
                    opacity: 0.8
                }).addTo(mapRef.current);
            }
            // Fit bounds to show both markers
            const bounds = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].latLngBounds([
                departureCoords,
                destinationCoords
            ]);
            mapRef.current.fitBounds(bounds, {
                padding: [
                    50,
                    50
                ]
            });
        } else if (routeRef.current) {
            routeRef.current.remove();
            routeRef.current = null;
        }
    }, [
        departureCoords,
        destinationCoords
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        id: "map",
        className: "w-full h-full rounded-lg"
    }, void 0, false, {
        fileName: "[project]/src/components/Map.tsx",
        lineNumber: 123,
        columnNumber: 10
    }, this);
}
}}),

};

//# sourceMappingURL=src_components_Map_tsx_3be0c7fe._.js.map