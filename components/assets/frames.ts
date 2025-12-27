export const IPHONE_15_PRO_SVG = `
<svg width="400" height="800" viewBox="0 0 430 932" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M125 0H305V35C305 45 295 55 285 55H145C135 55 125 45 125 35V0Z" fill="#000000"/>
<rect x="25" y="25" width="380" height="882" rx="45" fill="none" stroke="none" /> 
<!-- Screen hole is implicitly transparent if we don't draw it, but original SVG had rect x=5 width=420 which is the body. -->
<!-- To simulate a hole, we'd need a mask. For MVP, let's just draw the BORDER (Stroke) and the Dynamic Island. -->
<!-- The user image is Layer 0, Frame is Layer 1. The Frame should have a transparent middle. -->
<!-- Updating SVG to be Stroke Only for the body -->
<rect x="5" y="5" width="420" height="922" rx="55" stroke="#333333" stroke-width="10" fill="none"/>
</svg>
`;

export const PIXEL_10_SVG = `
<svg width="412" height="915" viewBox="0 0 412 915" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="5" y="5" width="402" height="905" rx="36" stroke="#333333" stroke-width="10" fill="none"/>
<circle cx="206" cy="40" r="10" fill="black"/>
</svg>
`;

export const getDeviceFrameSVG = (model: string) => {
    if (model && model.toLowerCase().includes('pixel')) {
        return PIXEL_10_SVG;
    }
    // Return iPhone by default for MVP
    return IPHONE_15_PRO_SVG;
};
