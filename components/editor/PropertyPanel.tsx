import React from 'react';
import { CanvasObject, ShapeObject, TextObject, CanvasModel } from '@/types/canvas';
import { Trash2, Type, Square, Circle, Monitor, Image as ImageIcon, ChevronLeft, Layout, Palette, Lock, Unlock } from 'lucide-react';

interface PropertyPanelProps {
    object?: CanvasObject;
    activeCanvas?: CanvasModel;
    updateObject: (id: string, updates: Partial<CanvasObject>) => void;
    onUpdateCanvas?: (updates: { width?: number; height?: number; background?: string }) => void;
    onClose: () => void; // To deselect
    onDelete: () => void;
}

export default function PropertyPanel({ object, activeCanvas, updateObject, onUpdateCanvas, onClose, onDelete }: PropertyPanelProps) {

    const [lockCanvasRatio, setLockCanvasRatio] = React.useState(true);
    const [lockObjectRatio, setLockObjectRatio] = React.useState(true);

    // Helper to generic updates
    const handleChange = (key: keyof CanvasObject, value: any) => {
        if (object) updateObject(object.id, { [key]: value });
    };

    // Helper for specific type updates
    const handleSpecificChange = (updates: any) => {
        if (object) updateObject(object.id, updates);
    };

    const renderHeader = () => {
        let Icon = Square;
        let title = "Object";

        if (!object && activeCanvas) {
            Icon = Layout;
            title = "Canvas Settings";
        } else if (object) {
            if (object.type === 'rect') { Icon = Square; title = "Rectangle"; }
            if (object.type === 'circle') { Icon = Circle; title = "Circle"; }
            if (object.type === 'text') { Icon = Type; title = "Text"; }
            if (object.type === 'device_frame') { Icon = Monitor; title = "Device"; }
            if (object.type === 'image') { Icon = ImageIcon; title = "Image"; }
        }

        return (
            <div className="flex items-center gap-2 mb-6 text-gray-800 dark:text-gray-200">
                {object && (
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded mr-2">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
                <Icon className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-sm">{title}</span>
            </div>
        );
    };

    const renderCanvasProps = () => {
        if (!activeCanvas || !onUpdateCanvas) return null;

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 block flex items-center gap-2">
                        <Layout className="w-3 h-3" />
                        Dimensions
                    </label>
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] text-gray-400 mb-1 block">Width</label>
                            <input
                                type="number"
                                value={activeCanvas.width}
                                onChange={(e) => {
                                    const newW = Number(e.target.value);
                                    const updates: any = { width: newW };
                                    if (lockCanvasRatio && activeCanvas.height) {
                                        const aspect = activeCanvas.width / activeCanvas.height;
                                        updates.height = Math.round(newW / aspect);
                                    }
                                    onUpdateCanvas(updates);
                                }}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs font-mono"
                            />
                        </div>

                        <button
                            onClick={() => setLockCanvasRatio(!lockCanvasRatio)}
                            className={`p-2 mb-0.5 rounded-md transition-colors ${lockCanvasRatio ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            {lockCanvasRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        <div className="flex-1">
                            <label className="text-[10px] text-gray-400 mb-1 block">Height</label>
                            <input
                                type="number"
                                value={activeCanvas.height}
                                onChange={(e) => {
                                    const newH = Number(e.target.value);
                                    const updates: any = { height: newH };
                                    if (lockCanvasRatio && activeCanvas.width) {
                                        const aspect = activeCanvas.width / activeCanvas.height;
                                        updates.width = Math.round(newH * aspect);
                                    }
                                    onUpdateCanvas(updates);
                                }}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs font-mono"
                            />
                        </div>
                    </div>
                    {/* Aspect Ratio Presets */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                        {[
                            { label: '9:16', value: 9 / 16 },
                            { label: '19.5:9', value: 9 / 19.5 },
                            { label: '3:4', value: 3 / 4 },
                            { label: '1:1', value: 1 },
                        ].map((ratio) => (
                            <button
                                key={ratio.label}
                                onClick={() => {
                                    if (activeCanvas.width) {
                                        onUpdateCanvas({ height: Math.round(activeCanvas.width / ratio.value) });
                                    }
                                }}
                                className="px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 transition-colors"
                            >
                                {ratio.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 block flex items-center gap-2">
                        <Palette className="w-3 h-3" />
                        Background
                    </label>
                    <div className="flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                        <input
                            type="color"
                            value={activeCanvas.background}
                            onChange={(e) => onUpdateCanvas({ background: e.target.value })}
                            className="w-8 h-8 p-0 border-0 rounded overflow-hidden cursor-pointer"
                        />
                        <input
                            type="text"
                            value={activeCanvas.background}
                            onChange={(e) => onUpdateCanvas({ background: e.target.value })}
                            className="flex-1 p-1 bg-transparent border-none text-xs font-mono focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2 mt-2">
                        {['#ffffff', '#000000', '#F3F4F6', '#1F2937', '#EEF2FF', '#FAE8FF'].map(color => (
                            <button
                                key={color}
                                onClick={() => onUpdateCanvas({ background: color })}
                                className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-110"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderCommon = () => {
        if (!object) return null;
        return (
            <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">X Position</label>
                        <input
                            type="number"
                            value={object.x}
                            onChange={(e) => handleChange('x', Number(e.target.value))}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">Y Position</label>
                        <input
                            type="number"
                            value={object.y}
                            onChange={(e) => handleChange('y', Number(e.target.value))}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs"
                        />
                    </div>
                    <div className="col-span-2 flex items-end gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">Width</label>
                            <input
                                type="number"
                                value={Math.round(object.width!)}
                                onChange={(e) => {
                                    const newW = Number(e.target.value);
                                    const updates: any = { width: newW };
                                    if (lockObjectRatio && object.height && object.width) {
                                        const aspect = object.width / object.height;
                                        updates.height = Math.round(newW / aspect);
                                    }
                                    updateObject(object.id, updates);
                                }}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs"
                            />
                        </div>

                        <button
                            onClick={() => setLockObjectRatio(!lockObjectRatio)}
                            className={`p-2 mb-0.5 rounded-md transition-colors ${lockObjectRatio ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            {lockObjectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        <div className="flex-1">
                            <label className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">Height</label>
                            <input
                                type="number"
                                value={Math.round(object.height!)}
                                onChange={(e) => {
                                    const newH = Number(e.target.value);
                                    const updates: any = { height: newH };
                                    if (lockObjectRatio && object.width && object.height) {
                                        const aspect = object.width / object.height;
                                        updates.width = Math.round(newH * aspect);
                                    }
                                    updateObject(object.id, updates);
                                }}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs"
                            />
                        </div>
                    </div>
                    {/* Aspect Ratio Presets */}
                    <div className="col-span-2 flex gap-1 flex-wrap">
                        {[
                            { label: '19.5:9', value: 9 / 19.5 },
                            { label: '9:16', value: 9 / 16 },
                            { label: '3:4', value: 3 / 4 },
                            { label: '4:3', value: 4 / 3 },
                            { label: '1:1', value: 1 },
                        ].map((ratio) => (
                            <button
                                key={ratio.label}
                                onClick={() => {
                                    if (object.width) {
                                        updateObject(object.id, { height: Math.round(object.width / ratio.value) });
                                    }
                                }}
                                className="px-2 py-1 text-[10px] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 transition-colors"
                            >
                                {ratio.label}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">Rotation (deg)</label>
                        <input
                            type="number"
                            value={object.rotation || 0}
                            onChange={(e) => handleChange('rotation', Number(e.target.value))}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block flex justify-between">
                        <span>Opacity</span>
                        <span>{Math.round((object.opacity || 1) * 100)}%</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={object.opacity || 1}
                        onChange={(e) => handleChange('opacity', Number(e.target.value))}
                        className="w-full accent-blue-500"
                    />
                </div>
            </div>
        );
    };

    const renderShapeProps = () => {
        if (!object || (object.type !== 'rect' && object.type !== 'circle')) return null;
        const shape = object as ShapeObject;

        return (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4 mb-6">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Appearance</label>

                <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Fill Color</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="color"
                            value={typeof shape.fill === 'string' ? shape.fill : '#000000'}
                            onChange={(e) => handleSpecificChange({ fill: e.target.value })}
                            className="w-8 h-8 p-0 border-0 rounded overflow-hidden cursor-pointer"
                        />
                        <input
                            type="text"
                            value={typeof shape.fill === 'string' ? shape.fill : ''}
                            onChange={(e) => handleSpecificChange({ fill: e.target.value })}
                            className="flex-1 p-1.5 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs font-mono"
                        />
                    </div>
                </div>

                {object.type === 'rect' && (
                    <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">Corner Radius</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={shape.cornerRadius || 0}
                            onChange={(e) => handleSpecificChange({ cornerRadius: Number(e.target.value) })}
                            className="w-full accent-blue-500"
                        />
                    </div>
                )}
            </div>
        );
    };

    const renderTextProps = () => {
        if (!object || object.type !== 'text') return null;
        const text = object as TextObject;

        return (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4 mb-6">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Typography</label>

                <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Content</label>
                    <textarea
                        rows={3}
                        value={text.text}
                        onChange={(e) => handleSpecificChange({ text: e.target.value })}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">Font Size</label>
                        <input
                            type="number"
                            value={text.fontSize}
                            onChange={(e) => handleSpecificChange({ fontSize: Number(e.target.value) })}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">Color</label>
                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded p-1">
                            <input
                                type="color"
                                value={typeof text.fill === 'string' ? text.fill : '#000000'}
                                onChange={(e) => handleSpecificChange({ fill: e.target.value })}
                                className="w-6 h-6 p-0 border-0 rounded overflow-hidden cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Font Family</label>
                    <select
                        value={text.fontFamily || 'Inter'}
                        onChange={(e) => handleSpecificChange({ fontFamily: e.target.value })}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded text-xs"
                    >
                        <option value="Inter">Inter</option>
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                    </select>
                </div>

                <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Style</label>
                    <div className="flex bg-gray-50 dark:bg-gray-800 rounded p-1 gap-1">
                        <button
                            onClick={() => handleSpecificChange({ fontWeight: text.fontWeight === 'bold' || text.fontWeight === '700' ? 'normal' : 'bold' })}
                            className={`flex-1 py-1 text-[10px] rounded hover:bg-white dark:hover:bg-gray-700 ${text.fontWeight === 'bold' || text.fontWeight === '700' ? 'bg-white dark:bg-gray-700 shadow-sm font-bold' : 'text-gray-400'}`}
                            title="Bold"
                        >
                            B
                        </button>
                        <button
                            onClick={() => handleSpecificChange({ fontStyle: text.fontStyle === 'italic' ? 'normal' : 'italic' })}
                            className={`flex-1 py-1 text-[10px] rounded hover:bg-white dark:hover:bg-gray-700 ${text.fontStyle === 'italic' ? 'bg-white dark:bg-gray-700 shadow-sm italic' : 'text-gray-400'}`}
                            title="Italic"
                        >
                            I
                        </button>
                        <button
                            onClick={() => handleSpecificChange({ underline: !text.underline })}
                            className={`flex-1 py-1 text-[10px] rounded hover:bg-white dark:hover:bg-gray-700 ${text.underline ? 'bg-white dark:bg-gray-700 shadow-sm underline' : 'text-gray-400'}`}
                            title="Underline"
                        >
                            U
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Alignment</label>
                    <div className="flex bg-gray-50 dark:bg-gray-800 rounded p-1 gap-1">
                        {['left', 'center', 'right'].map((align) => (
                            <button
                                key={align}
                                onClick={() => handleSpecificChange({ textAlign: align })}
                                className={`flex-1 py-1 text-[10px] uppercase rounded ${text.textAlign === align ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {align}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderDeviceProps = () => {
        if (!object || object.type !== 'device_frame') return null;

        const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                if (result) {
                    handleSpecificChange({ screenshotImageId: result });
                }
            };
            reader.readAsDataURL(file);
        };

        return (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4 mb-6">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Screen Content</label>

                <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center cursor-pointer relative group">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-xs font-medium">Click to Upload Screenshot</span>
                    </div>
                </div>

                {(object as any).screenshotImageId && (
                    <div className="relative aspect-[9/16] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img
                            src={(object as any).screenshotImageId}
                            alt="Screenshot Preview"
                            className="w-full h-full object-contain"
                        />
                        <button
                            onClick={() => handleSpecificChange({ screenshotImageId: null })}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                            title="Remove Screenshot"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col animate-in slide-in-from-right-4 duration-200">
            {renderHeader()}

            <div className="flex-1 overflow-y-auto pr-2">
                {renderCanvasProps()}
                {renderCommon()}
                {renderShapeProps()}
                {renderTextProps()}
                {renderDeviceProps()}
            </div>

            {object && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onDelete}
                        className="w-full py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Object
                    </button>
                </div>
            )}
        </div>
    );
}
