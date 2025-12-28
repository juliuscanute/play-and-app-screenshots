import { fabric } from 'fabric';
import { CanvasObject, DeviceModel, CanvasObjectType } from '@/types/canvas';
import { getDeviceFrameSVG } from '@/components/assets/frames';

// Async Helper to map Store Objects to Fabric Objects
export const createFabricObject = async (obj: CanvasObject): Promise<fabric.Object | null> => {
    const commonProps = {
        id: obj.id,
        left: obj.x,
        top: obj.y,
        width: obj.width,
        height: obj.height,
        angle: obj.rotation,
        opacity: obj.opacity,
    };

    if (obj.type === CanvasObjectType.Rect) {
        return new fabric.Rect({
            ...commonProps,
            fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
            rx: (obj as any).cornerRadius || 0,
            ry: (obj as any).cornerRadius || 0,
        });
    }

    if (obj.type === CanvasObjectType.Circle) {
        return new fabric.Circle({
            ...commonProps,
            radius: obj.width / 2,
            fill: typeof obj.fill === 'string' ? obj.fill : '#cccccc',
        });
    }

    if (obj.type === CanvasObjectType.Text) {
        return new fabric.Textbox((obj as any).text, {
            ...commonProps,
            fontFamily: (obj as any).fontFamily,
            fontSize: (obj as any).fontSize,
            fontWeight: (obj as any).fontWeight || 'normal',
            fontStyle: (obj as any).fontStyle || 'normal',
            underline: (obj as any).underline || false,
            fill: typeof (obj as any).fill === 'string' ? (obj as any).fill : '#000000',
            textAlign: (obj as any).textAlign
        });
    }

    if (obj.type === CanvasObjectType.Path && (obj as any).pathData) {
        // EXCLUDE width/height from props so Fabric calculates them from pathData
        const { width, height, ...pathProps } = commonProps;
        const path = new fabric.Path((obj as any).pathData, {
            ...pathProps,
            fill: typeof (obj as any).fill === 'string' ? (obj as any).fill : '#000000',
        });
        // We can force override width/height after creation if needed, 
        // but typically pathData dictates native size, then scaleX/Y handles visual size.
        // If we want to accept the store's width/height:
        if ('width' in obj && typeof obj.width === 'number') {
            path.scaleToWidth(obj.width);
        }

        // 2. Position correctly
        // We centre the object, so we move it by half its TARGET size
        path.set({
            left: obj.x + obj.width / 2,
            top: obj.y + obj.height / 2
        });

        return path;
    }




    if (obj.type === CanvasObjectType.DeviceFrame) {
        const svgString = getDeviceFrameSVG((obj as any).deviceModel);

        return new Promise((resolve) => {
            // 1. Load the Frame (SVG)
            fabric.loadSVGFromString(svgString, (objects, options) => {
                const frameGroup = fabric.util.groupSVGElements(objects, options);

                console.log(`[Fabric] Loaded SVG for ${(obj as any).deviceModel}`);
                console.log(`[Fabric] Objects count: ${objects.length}`);
                console.log(`[Fabric] Group Dim: ${frameGroup.width} x ${frameGroup.height}`);
                console.log(`[Fabric] Target Dim: ${obj.width} x ${obj.height}`);

                // 2. Load the Screenshot (Image) if exists
                if ((obj as any).screenshotImageId) {
                    console.log("   [createFabricObject] Loading screenshot image...");
                    fabric.Image.fromURL((obj as any).screenshotImageId, (img) => {
                        if (!img) {
                            console.error("   [createFabricObject] Failed to load image!");
                            // Fallback: Just return frame
                            frameGroup.set({
                                ...commonProps,
                                scaleX: obj.width / (frameGroup.width || 1),
                                scaleY: obj.height / (frameGroup.height || 1),
                            });
                            // Attach metadata
                            (frameGroup as any).screenshotImageId = (obj as any).screenshotImageId;
                            (frameGroup as any).deviceModel = (obj as any).deviceModel;
                            resolve(frameGroup);
                            return;
                        }

                        console.log("   [createFabricObject] Image loaded:", img.width, img.height);
                        console.log("   [createFabricObject] Frame Group Dim:", frameGroup.width, frameGroup.height);
                        console.log("   [createFabricObject] Frame Scale:", frameGroup.scaleX, frameGroup.scaleY);

                        // Scale image to fit *inside* the frame
                        // Logic: FORCE FILL (Stretch) with BLEED
                        // We use a slightly smaller padding (18 instead of 20) to lets the image 
                        // bleed 1px under the bezel on each side, preventing anti-aliasing gaps.

                        const frameWidth = frameGroup.width || 100;
                        const frameHeight = frameGroup.height || 100;

                        // Determine padding based on device model
                        let screenPadding = 20; // Default (iPhone)
                        const model = (obj as any).deviceModel;

                        if (model === DeviceModel.SamsungS24 || model.includes('s24')) {
                            screenPadding = 10; // Thinner bezels for S24
                        } else if (model === DeviceModel.Pixel9 || model.includes('pixel')) {
                            screenPadding = 14;
                        } else if (model === DeviceModel.iPadPro13 || model.includes('ipad')) {
                            screenPadding = 30; // Thicker bezel for Tablet
                        } else if (model === DeviceModel.AndroidTablet || model.includes('tablet')) {
                            screenPadding = 30; // Thicker bezel for Tablet
                        } else {
                            screenPadding = 19; // iPhone
                        }

                        const targetWidth = frameWidth - screenPadding;
                        const targetHeight = frameHeight - screenPadding;

                        // Force Stretch
                        // We reset crop values to ensure full image is used
                        img.cropX = 0;
                        img.cropY = 0;

                        // Fabric Image types sometimes mark width/height as optional
                        // Access natural dimensions safely
                        const element = img.getElement() as HTMLImageElement;
                        const validWidth = element?.naturalWidth || img.width || 100;
                        const validHeight = element?.naturalHeight || img.height || 100;

                        img.width = validWidth;
                        img.height = validHeight;

                        const scaleX = targetWidth / validWidth;
                        const scaleY = targetHeight / validHeight;

                        console.log(`   [Fabric] ForceStretch: Scales(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`);

                        img.scaleX = scaleX;
                        img.scaleY = scaleY;

                        // Align image to center of frame
                        img.set({
                            originX: 'center',
                            originY: 'center',
                            left: 0,
                            top: 0
                        });
                        frameGroup.set({
                            originX: 'center',
                            originY: 'center',
                            left: 0,
                            top: 0
                        });

                        // Clip the image to rounded corners
                        // Determine radius based on device model
                        let clipRadius = 32;
                        // model variable already defined above
                        if (model === DeviceModel.SamsungS24 || model.includes('s24')) {
                            clipRadius = 10; // S24 has sharper corners (SVG rx=12)
                        } else if (model === DeviceModel.Pixel9 || model.includes('pixel')) {
                            clipRadius = 22; // Pixel 9 (SVG rx=24)
                        } else if (model === DeviceModel.iPhone16Pro || model.includes('iphone')) {
                            clipRadius = 46; // iPhone 16 (approx rx=55)
                        } else if (model === DeviceModel.iPadPro13 || model.includes('ipad')) {
                            clipRadius = 20; // iPad Pro (SVG rx=24)
                        } else if (model === DeviceModel.AndroidTablet || model.includes('tablet')) {
                            clipRadius = 16; // Android Tablet (SVG rx=20)
                        }

                        const clipRect = new fabric.Rect({
                            width: targetWidth,
                            height: targetHeight,
                            rx: clipRadius,
                            ry: clipRadius,
                            originX: 'center',
                            originY: 'center',
                            left: 0,
                            top: 0,
                            absolutePositioned: false
                        });

                        // Scale the clipRect inversely so it looks correct even if image is stretched
                        // Wait, if image is stretched non-uniformly, we need to inverse scale non-uniformly.

                        clipRect.scaleX = 1 / scaleX;
                        clipRect.scaleY = 1 / scaleY;

                        img.clipPath = clipRect;

                        // Create Master Group
                        // We stack: [Image, Frame]
                        const masterGroup = new fabric.Group([img, frameGroup], {
                            ...commonProps,
                            width: frameGroup.width, // Set explicit dimensions for group
                            height: frameGroup.height,
                            scaleX: obj.width / frameWidth,
                            scaleY: obj.height / (frameGroup.height || 1),
                        });

                        // Attach metadata 
                        (masterGroup as any).screenshotImageId = (obj as any).screenshotImageId;
                        (masterGroup as any).deviceModel = (obj as any).deviceModel;

                        resolve(masterGroup);
                    });
                } else {
                    // No image, just frame
                    // We also center-align the frameGroup to be consistent
                    frameGroup.set({
                        originX: 'center',
                        originY: 'center',
                    });

                    frameGroup.set({
                        ...commonProps,
                        scaleX: obj.width / (frameGroup.width || 1),
                        scaleY: obj.height / (frameGroup.height || 1),
                    });

                    // Attach metadata
                    (frameGroup as any).screenshotImageId = (obj as any).screenshotImageId;
                    (frameGroup as any).deviceModel = (obj as any).deviceModel;

                    resolve(frameGroup);
                }
            });
        });
    }

    return null;
};
