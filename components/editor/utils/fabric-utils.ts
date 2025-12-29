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

    const { width, height, ...restProps } = commonProps;

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
            ...restProps, // Exclude width/height, rely on radius
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

    if (obj.type === CanvasObjectType.Triangle) {
        return new fabric.Triangle({
            ...commonProps,
            fill: typeof obj.fill === 'string' ? obj.fill : '#3B82F6'
        });
    }

    if (obj.type === CanvasObjectType.Polygon) {
        // Create a regular polygon points
        const sides = (obj as any).sides || 5;
        const radius = obj.width / 2;
        const points = [];
        for (let i = 0; i < sides; i++) {
            const theta = (i / sides) * 2 * Math.PI;
            const x = radius * Math.sin(theta);
            const y = radius * -Math.cos(theta); // -cos to start at top
            points.push({ x, y });
        }

        return new fabric.Polygon(points, {
            ...restProps, // Exclude width/height, rely on points
            fill: typeof obj.fill === 'string' ? obj.fill : '#10B981',
            originX: 'center',
            originY: 'center',
            // Reposition because origin is center
            left: obj.x + radius,
            top: obj.y + radius
        });
    }

    if (obj.type === CanvasObjectType.Line) {
        // Line needs coordinates [x1, y1, x2, y2]
        return new fabric.Line([(obj as any).x, (obj as any).y, (obj as any).x2, (obj as any).y2], {
            ...commonProps,
            fill: (obj as any).stroke || '#000000',
            stroke: (obj as any).stroke || '#000000',
            strokeWidth: (obj as any).strokeWidth || 4,
            width: undefined, // Let coords define
            height: undefined
        });
    }

    if (obj.type === CanvasObjectType.Arrow) {
        // Arrow is complex. For now, implement as a simple Path arrow
        const fromX = (obj as any).x;
        const fromY = (obj as any).y;
        const toX = (obj as any).x2;
        const toY = (obj as any).y2;

        const headlen = 20; // length of head in pixels
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // Path drawing command
        const d = `M ${fromX} ${fromY} L ${toX} ${toY} L ${toX - headlen * Math.cos(angle - Math.PI / 6)} ${toY - headlen * Math.sin(angle - Math.PI / 6)} M ${toX} ${toY} L ${toX - headlen * Math.cos(angle + Math.PI / 6)} ${toY - headlen * Math.sin(angle + Math.PI / 6)}`;

        return new fabric.Path(d, {
            ...commonProps,
            fill: '', // No fill for arrow lines usually
            stroke: (obj as any).stroke || '#000000',
            strokeWidth: (obj as any).strokeWidth || 4,
            objectCaching: false
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
        console.log('[Fabric] Requesting SVG for model:', (obj as any).deviceModel);
        const svgString = getDeviceFrameSVG((obj as any).deviceModel);
        console.log('[Fabric] SVG String len:', svgString ? svgString.length : 'NULL');

        return new Promise((resolve) => {
            // 1. Load the Frame (SVG)
            fabric.loadSVGFromString(svgString, (objects, options) => {
                console.log('[Fabric] loadSVGFromString callback triggered.');

                if (!objects || objects.length === 0) {
                    console.error('[Fabric] Error: No objects loaded from SVG!');
                    resolve(null);
                    return;
                }

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
                            const { width, height, ...restProps } = commonProps;
                            frameGroup.set({
                                ...restProps,
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
                        } else if (model === DeviceModel.iPhone17Pro || model.includes('iphone') || model.includes('iPhone')) {
                            screenPadding = 8; // Reduce padding to 8 (4px on each side) to fit tight against the 8px centered stroke (4px inner)
                        } else {
                            screenPadding = 19; // Default
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
                        } else if (model === DeviceModel.iPhone17Pro || model.includes('iphone')) {
                            clipRadius = 60; // iPhone 17 (rx=64 - 4px stroke = 60 inner)
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
                    // Use left/top origin to match store coordinates (obj.x/y as top-left)
                    frameGroup.set({
                        originX: 'left',
                        originY: 'top',
                    });

                    // EXCLUDE width/height from commonProps to preserve Group's natural size
                    // Otherwise we scale the Group AND set its width to the target width -> double scaling.
                    const { width, height, ...restProps } = commonProps;

                    frameGroup.set({
                        ...restProps,
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
