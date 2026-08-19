import { type } from '@tauri-apps/plugin-os';
import { DesktopEngine } from '../../desktop/services/DesktopEngine';
import { AndroidEngine } from '../../mobile/services/AndroidEngine';
import { VideoEvents } from './VideoEvents';

const osType = type();
export const VideoPlayer = osType === 'android' ? AndroidEngine : DesktopEngine;

export { VideoEvents };