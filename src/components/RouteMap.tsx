import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { LatLng } from '../geo/route';

export type RouteMapProps = {
  pickup: LatLng;
  dropoff: LatLng;
  route: LatLng[];
  user?: LatLng | null;
  heading?: number | null;
  follow?: boolean;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

type MapPayload = {
  pickup: LatLng;
  dropoff: LatLng;
  route: LatLng[];
  user: LatLng | null;
  heading: number | null;
  follow: boolean;
};

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html,body,#map{margin:0;height:100%;background:#F2F4F7}
    .leaflet-control-attribution{font-size:10px;background:rgba(255,255,255,.8)}
  </style>
</head>
<body>
<div id="map"></div>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map('map', { zoomControl: true, attributionControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  map.setView([41.3, 69.24], 12);

  const pickupIcon = L.divIcon({ className: '', html: '<div style="width:16px;height:16px;border-radius:8px;background:#2457F5;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>', iconSize: [16,16], iconAnchor: [8,8] });
  const dropoffIcon = L.divIcon({ className: '', html: '<div style="width:16px;height:16px;border-radius:8px;background:#F97316;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>', iconSize: [16,16], iconAnchor: [8,8] });
  const userIcon = L.divIcon({ className: '', html: '<div style="width:18px;height:18px;border-radius:9px;background:#2457F5;border:3px solid #fff;box-shadow:0 0 0 6px rgba(36,87,245,.25)"></div>', iconSize: [18,18], iconAnchor: [9,9] });

  let pickupM = L.marker([41.3, 69.24], { icon: pickupIcon }).addTo(map);
  let dropoffM = L.marker([41.3, 69.24], { icon: dropoffIcon }).addTo(map);
  let userM = null;
  let line = L.polyline([], { color: '#2457F5', weight: 5, opacity: 0.9 }).addTo(map);
  let fitted = false;

  function toLatLngs(pts) {
    return (pts || []).map(function (p) { return [p.lat, p.lng]; });
  }

  window.__apply = function (s) {
    if (!s) return;
    pickupM.setLatLng([s.pickup.lat, s.pickup.lng]);
    dropoffM.setLatLng([s.dropoff.lat, s.dropoff.lng]);
    var latlngs = toLatLngs(s.route);
    if (latlngs.length < 2) {
      latlngs = [[s.pickup.lat, s.pickup.lng], [s.dropoff.lat, s.dropoff.lng]];
    }
    line.setLatLngs(latlngs);
    if (s.user) {
      if (!userM) userM = L.marker([s.user.lat, s.user.lng], { icon: userIcon }).addTo(map);
      else userM.setLatLng([s.user.lat, s.user.lng]);
      if (s.follow) {
        map.setView([s.user.lat, s.user.lng], Math.max(map.getZoom(), 15), { animate: true });
        fitted = true;
        return;
      }
    }
    if (!fitted) {
      var b = L.latLngBounds(latlngs.concat([[s.pickup.lat, s.pickup.lng], [s.dropoff.lat, s.dropoff.lng]]));
      if (s.user) b.extend([s.user.lat, s.user.lng]);
      map.fitBounds(b, { padding: [28, 28], maxZoom: 15 });
      fitted = true;
    }
  };

  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
  }
</script>
</body>
</html>`;

export function RouteMap({
  pickup,
  dropoff,
  route,
  user = null,
  heading = null,
  follow = false,
  interactive = true,
  style,
}: RouteMapProps) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  const payload: MapPayload = useMemo(
    () => ({
      pickup,
      dropoff,
      route,
      user: user ?? null,
      heading: heading ?? null,
      follow,
    }),
    [pickup, dropoff, route, user, heading, follow],
  );

  const inject = (next: MapPayload) => {
    const json = JSON.stringify(next);
    webRef.current?.injectJavaScript(`window.__apply && window.__apply(${json}); true;`);
  };

  useEffect(() => {
    if (readyRef.current) inject(payload);
  }, [payload]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type?: string };
      if (msg.type === 'ready') {
        readyRef.current = true;
        inject(payload);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={[styles.wrap, style]} pointerEvents={interactive ? 'auto' : 'none'}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html: MAP_HTML, baseUrl: 'https://localhost' }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={interactive}
        setSupportMultipleWindows={false}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#F2F4F7' },
  web: { flex: 1, backgroundColor: 'transparent' },
});
