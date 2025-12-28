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

    if (toolName === 'create_canvas') {
        store.addCanvas();
        return;
    }

    if (toolName === 'duplicate_canvas') {
        const { canvasId } = args;
        store.duplicateCanvas(canvasId);
        return;
    }

    const { canvasId } = args;
    // Resolve target canvas dimensions
    // Store might be a proxy with width/height, OR real store with canvases
    // If it's the real store, we need to find the canvas.
    // If it's a proxy (from Sidebar), it might have width/height directly.

    let width = 1080;
    let height = 1920;
    let targetId = canvasId || store.activeCanvasId;

    if (store.canvases) {
        // Real store
        const targetCanvas = store.canvases.find(c => c.id === targetId);
        if (targetCanvas) {
            width = targetCanvas.width;
            height = targetCanvas.height;
        } else {
            console.error(`Target canvas not found: ${targetId}`);
            // Fallback to active if possible or return?
            // If implicit targeting failed, maybe we are just setting global props?
        }
    } else {
        // Proxy store from sidebar (has width/height directly)
        // Check if types allow this? Typescript might yell if we access width on CanvasStore.
        // We can cast to any for this hybrid logic until refined.
        width = (store as any).width || 1080;
        height = (store as any).height || 1920;
    }


    if (toolName === 'set_background') {
        const { type, colors } = args;
        store.setBackground(colors[0]); // Action targets active by default, or we update store to accept ID?
        // Store actions currently target activeCanvasId. 
        // If args has canvasId, we should set activeCanvasId first? 
        // Or update store actions to accept canvasId.
        // I updated store actions to target active.
        // For now, assume AI targets active canvas (as per prompt instructions).
    }

    if (toolName === 'add_decorative_shape') {
        const { shape, position, color, size, sides, x, y, rotation } = args;
        const dimension = getSize(size || 'medium');

        // Calculate preset position first as fallback or base
        const pos = getPosition(position || 'center', width, height, dimension, dimension);

        // Use exact coords if provided, otherwise preset
        const finalX = (x !== undefined && x !== null) ? x : pos.x;
        const finalY = (y !== undefined && y !== null) ? y : pos.y;

        const newShape: any = {
            id: uuidv4(),
            type: shape as any,
            x: finalX,
            y: finalY,
            width: dimension,
            height: dimension,
            fill: color,
            rotation: rotation || 0,
            opacity: 0.8,
            zIndex: 0,
            cornerRadius: shape === CanvasObjectType.Rect ? 50 : 0,
            sides: shape === CanvasObjectType.Polygon ? (sides || 5) : undefined
        };
        store.addObject(newShape);
    }

    if (toolName === 'add_line_arrow') {
        const { type, startPosition, endPosition, color, width: strokeWidth } = args;
        const start = getPosition(startPosition, width, height, 0, 0);
        const end = getPosition(endPosition, width, height, 0, 0);

        const newLine: any = {
            id: uuidv4(),
            type: type === 'arrow' ? CanvasObjectType.Arrow : CanvasObjectType.Line,
            x: start.x,
            y: start.y,
            x2: end.x,
            y2: end.y,
            width: Math.abs(end.x - start.x),
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
        const { content, style, position, color, x, y, rotation, fontFamily, fontSize, fontWeight, fontStyle, underline } = args;

        // Default size based on style if not provided
        const finalFontSize = fontSize || (style === 'title' ? 80 : style === 'subtitle' ? 50 : 30);
        const wEstimate = content.length * (finalFontSize * 0.6);
        const pos = getPosition(position || 'center', width, height, wEstimate, finalFontSize);

        const finalX = (x !== undefined && x !== null) ? x : pos.x;
        const finalY = (y !== undefined && y !== null) ? y : pos.y;

        // Default weight based on style if not provided
        const finalFontWeight = fontWeight || (style === 'title' ? '900' : '400');

        const newText: CanvasObject = {
            id: uuidv4(),
            type: CanvasObjectType.Text,
            text: content,
            x: finalX,
            y: finalY,
            width: wEstimate,
            height: finalFontSize,
            fill: color || '#000000',
            fontFamily: fontFamily || 'Inter',
            fontSize: finalFontSize,
            fontWeight: finalFontWeight,
            fontStyle: fontStyle || 'normal',
            underline: underline || false,
            textAlign: 'center',
            rotation: rotation || 0,
            zIndex: 10,
            opacity: 1
        };
        store.addObject(newText);
    }

    if (toolName === 'configure_device') {
        // Logic to find device frame needs objects.
        // Store proxy has objects, real store has canvases.
        let objects: any[] = [];
        if (store.canvases) {
            const c = store.canvases.find(c => c.id === targetId);
            objects = c ? c.objects : [];
        } else {
            objects = (store as any).objects || [];
        }

        const existingDevice = objects.find(o => o.type === CanvasObjectType.DeviceFrame);

        const deviceWidth = 1000;
        const deviceHeight = 2000;

        if (!existingDevice) {

            const defX = width / 2 - deviceWidth / 2;
            const defY = height / 2 - deviceHeight / 2;
            const finalX = (args.x !== undefined && args.x !== null) ? args.x : defX;
            const finalY = (args.y !== undefined && args.y !== null) ? args.y : defY;

            const newDevice: DeviceFrameObject = {
                id: uuidv4(),
                type: CanvasObjectType.DeviceFrame,
                deviceModel: args.model || 'iphone_15_pro',
                frameColor: 'black',
                x: finalX,
                y: finalY,
                width: deviceWidth,
                height: deviceHeight,
                rotation: args.rotation || 0,
                opacity: 1,
                zIndex: 5,
                tilt: { x: args.tiltX || 0, y: args.tiltY || 0, perspective: 1000 }
            };
            store.addObject(newDevice);
        } else {
            const updates: any = {};
            if (args.rotation !== undefined) updates.rotation = args.rotation;
            if (args.x !== undefined) updates.x = args.x;
            if (args.y !== undefined) updates.y = args.y;
            // TODO: Handle tilt updates if needed in future, currently just position/rotation requested
            store.updateObject(existingDevice.id, updates);
        }
    }

    if (toolName === 'add_vector_shape') {
        const { pathData, name, color, position, scale, x, y, rotation } = args;

        const baseSize = 300;
        const appliedScale = scale || 1;
        const finalSize = baseSize * appliedScale;

        const pos = getPosition(position || 'center', width, height, finalSize, finalSize);

        const finalX = (x !== undefined && x !== null) ? x : pos.x;
        const finalY = (y !== undefined && y !== null) ? y : pos.y;

        const newPath: CanvasObject = {
            id: uuidv4(),
            type: CanvasObjectType.Path,
            pathData: pathData,
            x: finalX,
            y: finalY,
            width: finalSize,
            height: finalSize,
            fill: color,
            rotation: rotation || 0,
            opacity: 1,
            zIndex: 1,
        };
        store.addObject(newPath);
    }

    if (toolName === 'update_object') {
        const { id, updates } = args;
        store.updateObject(id, updates);
    }
};

