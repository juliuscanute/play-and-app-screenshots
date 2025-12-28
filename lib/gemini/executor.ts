import { v4 as uuidv4 } from 'uuid';
import { CanvasStore } from '@/types/canvas';
import { CanvasObject, DeviceFrameObject, CanvasObjectType } from '@/types/canvas';

const getPosition = (pos: string, width: number, height: number, objWidth: number, objHeight: number) => {
    switch (pos) {
        case 'top_left': return { x: width * 0.1, y: height * 0.1 };
        case 'top_right': return { x: width * 0.9 - objWidth, y: height * 0.1 };
        case 'bottom_left': return { x: width * 0.1, y: height * 0.9 - objHeight };
        case 'bottom_right': return { x: width * 0.9 - objWidth, y: height * 0.9 - objHeight };
        case 'center_behind_phone': return { x: width / 2 - objWidth / 2, y: height / 2 - objHeight / 2 };
        case 'top':
        case 'top_center': return { x: width / 2 - objWidth / 2, y: height * 0.15 };
        case 'bottom':
        case 'bottom_center': return { x: width / 2 - objWidth / 2, y: height * 0.85 };
        case 'center': return { x: width / 2 - objWidth / 2, y: height / 2 - objHeight / 2 };
        case 'center_left': return { x: width * 0.1, y: height / 2 - objHeight / 2 };
        case 'center_right': return { x: width * 0.9 - objWidth, y: height / 2 - objHeight / 2 };
        default: return { x: width / 2 - objWidth / 2, y: height / 2 - objHeight / 2 };
    }
};

const getSize = (size: string) => {
    switch (size) {
        case 'small': return 200;
        case 'medium': return 500;
        case 'large': return 900;
        default: return 500;
    }
}

export const executeToolCall = (
    toolName: string,
    args: any,
    store: CanvasStore
) => {
    console.log(`Executing Tool: ${toolName}`, args);
    const { width, height } = store;

    if (toolName === 'set_background') {
        const { type, colors } = args;
        store.setBackground(colors[0]);
    }

    if (toolName === 'add_decorative_shape') {
        const { shape, position, color, size, sides } = args;
        const dimension = getSize(size || 'medium');
        const pos = getPosition(position, width, height, dimension, dimension);

        const newShape: any = {
            id: uuidv4(),
            type: shape as any,
            x: pos.x,
            y: pos.y,
            width: dimension,
            height: dimension,
            fill: color,
            rotation: 0,
            opacity: 0.8,
            zIndex: 0,
            cornerRadius: shape === CanvasObjectType.Rect ? 50 : 0,
            sides: shape === CanvasObjectType.Polygon ? (sides || 5) : undefined
        };
        store.addObject(newShape);
    }

    if (toolName === 'add_line_arrow') {
        const { type, startPosition, endPosition, color, width: strokeWidth } = args;
        // Simple mapping for demonstration
        const start = getPosition(startPosition, width, height, 0, 0); // Point
        const end = getPosition(endPosition, width, height, 0, 0);

        const newLine: any = {
            id: uuidv4(),
            type: type === 'arrow' ? CanvasObjectType.Arrow : CanvasObjectType.Line,
            x: start.x,
            y: start.y,
            x2: end.x,
            y2: end.y,
            width: Math.abs(end.x - start.x), // Bounding box approx
            height: Math.abs(end.y - start.y),
            stroke: color,
            strokeWidth: strokeWidth || 5,
            rotation: 0,
            opacity: 1,
            zIndex: 10
        };
        store.addObject(newLine);
    }

    if (toolName === 'add_text_overlay') {
        const { content, style, position, color } = args;
        const fontSize = style === 'title' ? 80 : style === 'subtitle' ? 50 : 30;
        const wEstimate = content.length * (fontSize * 0.6);
        const pos = getPosition(position, width, height, wEstimate, fontSize);

        const newText: CanvasObject = {
            id: uuidv4(),
            type: CanvasObjectType.Text,
            text: content,
            x: pos.x,
            y: pos.y,
            width: wEstimate,
            height: fontSize,
            fill: color || '#000000',
            fontFamily: 'Inter',
            fontSize: fontSize,
            fontWeight: style === 'title' ? '900' : '400',
            textAlign: 'center',
            rotation: 0,
            zIndex: 10,
            opacity: 1
        };
        store.addObject(newText);
    }

    if (toolName === 'configure_device') {
        // This usually modifies the existing device frame or adds one if missing
        // For MVP, if no device exists, we add one.
        const existingDevice = store.objects.find(o => o.type === CanvasObjectType.DeviceFrame);

        const deviceWidth = 1000; // Approx for iPhone 15 Pro scaled
        const deviceHeight = 2000;

        if (!existingDevice) {
            const newDevice: DeviceFrameObject = {
                id: uuidv4(),
                type: CanvasObjectType.DeviceFrame,
                deviceModel: args.model || 'iphone_15_pro',
                frameColor: 'black',
                x: width / 2 - deviceWidth / 2,
                y: height / 2 - deviceHeight / 2, // Center vertically
                width: deviceWidth,
                height: deviceHeight,
                rotation: args.rotation || 0,
                opacity: 1,
                zIndex: 5,
                tilt: { x: args.tiltX || 0, y: args.tiltY || 0, perspective: 1000 }
            };
            store.addObject(newDevice);
        } else {
            // Update existing
            store.updateObject(existingDevice.id, {
                rotation: args.rotation,
                // TODO: Update position based on args.y_position
            });
        }
    }

    if (toolName === 'add_vector_shape') {
        const { pathData, name, color, position, scale } = args;

        // Base size for vector shapes - allow this to be overridden or derived?
        // Let's assume a "base" size of 100x100 for normalization, then scale it.
        // HOWEVER, for SVG paths, the 'width'/'height' in the store should represent the TARGET display size.
        // FabricCanvas.tsx uses (targetSize / nativeSize) to calculate scaleX/scaleY.

        const baseSize = 300; // Reasonable default
        const appliedScale = scale || 1;
        const finalSize = baseSize * appliedScale;

        const pos = getPosition(position, width, height, finalSize, finalSize);

        const newPath: CanvasObject = {
            id: uuidv4(),
            type: CanvasObjectType.Path,
            pathData: pathData,
            x: pos.x,
            y: pos.y,
            width: finalSize,
            height: finalSize,
            fill: color,
            rotation: 0,
            opacity: 1,
            zIndex: 1, // Above background
        };
        store.addObject(newPath);
    }

    if (toolName === 'update_object') {
        const { id, updates } = args;
        store.updateObject(id, updates);
    }
};
