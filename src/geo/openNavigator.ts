import { Linking } from 'react-native';
import type { LatLng } from './route';

export async function openExternalNavigator(target: LatLng): Promise<void> {
  const naviUrl = `yandexnavi://build_route_on_map?lat_to=${target.lat}&lon_to=${target.lng}`;
  const webMapsUrl = `https://yandex.uz/maps/?rtext=~${target.lat},${target.lng}&rtt=auto`;
  try {
    const canOpen = await Linking.canOpenURL(naviUrl);
    await Linking.openURL(canOpen ? naviUrl : webMapsUrl);
  } catch {
    await Linking.openURL(webMapsUrl);
  }
}
