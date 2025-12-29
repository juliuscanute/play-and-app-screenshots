// Device Frame SVGs
// We use a transparent rect at the bottom to ensure Fabric calculates the bounding box correctly.

export const IPHONE_17_PRO_SVG = `
<svg width="442" height="914" viewBox="0 0 442 914" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="442" height="914" fill="transparent" opacity="0"/>
    <rect x="4" y="4" width="434" height="906" rx="64" fill="none" stroke="#222222" stroke-width="8"/>
    <rect x="158" y="18" width="126" height="37" rx="18" fill="black"/>
</svg>
`;

export const PIXEL_9_SVG = `
<svg width="412" height="915" viewBox="0 0 412 915" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="412" height="915" fill="transparent" opacity="0"/>
    <rect x="4" y="4" width="404" height="907" rx="24" fill="none" stroke="#333333" stroke-width="8"/>
    <circle cx="206" cy="24" r="12" fill="black"/>
</svg>
`;

export const SAMSUNG_S24_SVG = `
<svg width="412" height="892" viewBox="0 0 412 892" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="412" height="892" fill="transparent" opacity="0"/>
    <rect x="4" y="4" width="404" height="884" rx="12" fill="none" stroke="#333333" stroke-width="8"/>
    <circle cx="206" cy="24" r="10" fill="black"/>
</svg>
`;

export const IPAD_PRO_SVG = `
<svg width="1032" height="1376" viewBox="0 0 1032 1376" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1032" height="1376" fill="transparent" opacity="0"/>
    <rect x="10" y="10" width="1012" height="1356" rx="24" fill="none" stroke="#000000" stroke-width="12"/>
    <path d="M516 24H516C526 24 536 32 536 42V42C536 52 526 60 516 60H516C506 60 496 52 496 42V42C496 32 506 24 516 24Z" fill="black"/>
</svg>
`;

export const ANDROID_TABLET_SVG = `
<svg width="800" height="1280" viewBox="0 0 800 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="1280" fill="transparent" opacity="0"/>
    <rect x="10" y="10" width="780" height="1260" rx="20" fill="none" stroke="#000000" stroke-width="12"/>
    <circle cx="400" cy="32" r="8" fill="black"/>
</svg>
`;

import { DeviceModel } from '@/types/canvas';

export const getDeviceFrameSVG = (model: DeviceModel | string) => {
    // Keeping string for backward compat if needed, but preferring Enum
    const m = model?.toLowerCase() || '';
    if (m === DeviceModel.Pixel9 || m.includes('pixel')) return PIXEL_9_SVG;
    if (m === DeviceModel.SamsungS24 || m.includes('samsung') || m.includes('galaxy')) return SAMSUNG_S24_SVG;
    if (m === DeviceModel.iPadPro13 || m.includes('ipad')) return IPAD_PRO_SVG;
    if (m === DeviceModel.AndroidTablet || m.includes('android_tablet') || m.includes('tablet')) return ANDROID_TABLET_SVG;
    return IPHONE_17_PRO_SVG;
};
