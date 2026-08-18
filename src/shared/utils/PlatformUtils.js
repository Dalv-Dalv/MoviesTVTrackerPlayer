import { type } from '@tauri-apps/plugin-os';

const osType = type();

export const isMobile = osType === 'android' || osType === 'ios';
export const isDesktop = !isMobile;