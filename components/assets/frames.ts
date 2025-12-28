// Device Frame SVGs
// We use a transparent rect at the bottom to ensure Fabric calculates the bounding box correctly.

export const IPHONE_16_PRO_SVG = `
<svg width="433" height="932" viewBox="0 0 433 932" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="433" height="932" fill="transparent" opacity="0"/>
    <path d="M0 65C0 29.1015 29.1015 0 65 0H368C403.899 0 433 29.1015 433 65V867C433 902.899 403.899 932 368 932H65C29.1015 932 0 902.899 0 867V65Z" fill="none" stroke="#333333" stroke-width="8"/>
    <path d="M125 0H305V35C305 45 295 55 285 55H145C135 55 125 45 125 35V0Z" fill="black"/>
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
    <path d="M34 10 L998 10 Q1022 10 1022 34 L1022 1342 Q1022 1366 998 1366 L34 1366 Q10 1366 10 1342 L10 34 Q10 10 34 10 Z" fill="none" stroke="#000000" stroke-width="12"/>
    <path d="M516 24H516C526 24 536 32 536 42V42C536 52 526 60 516 60H516C506 60 496 52 496 42V42C496 32 506 24 516 24Z" fill="black"/>
</svg>
`;

export const ANDROID_TABLET_SVG = `
<svg width="800" height="1280" viewBox="0 0 800 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="1280" fill="transparent" opacity="0"/>
    <path d="M30 10 L770 10 Q790 10 790 30 L790 1250 Q790 1270 770 1270 L30 1270 Q10 1270 10 1250 L10 30 Q10 10 30 10 Z" fill="none" stroke="#000000" stroke-width="12"/>
    <circle cx="400" cy="32" r="8" fill="black"/>
</svg>
`;

export const getDeviceFrameSVG = (model: string) => {
    const m = model?.toLowerCase() || '';
    if (m.includes('pixel')) return PIXEL_9_SVG;
    if (m.includes('samsung') || m.includes('galaxy')) return SAMSUNG_S24_SVG;
    if (m.includes('ipad')) return IPAD_PRO_SVG;
    if (m.includes('android_tablet') || m.includes('tablet')) return ANDROID_TABLET_SVG;
    return IPHONE_16_PRO_SVG;
};
