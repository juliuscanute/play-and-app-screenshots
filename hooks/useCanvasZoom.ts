import { useState, useEffect, useRef } from 'react';

export const useCanvasZoom = (width: number, height: number) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);

    // Auto-fit on load/resize
    useEffect(() => {
        if (!containerRef.current) return;
        const fitZoom = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth - 80;
            const containerHeight = containerRef.current.clientHeight - 80;
            const scaleX = containerWidth / width;
            const scaleY = containerHeight / height;

            setZoom(Math.min(scaleX, scaleY, 1));
        };

        fitZoom();

        const resizeObserver = new ResizeObserver(() => {
            fitZoom();
        });
        resizeObserver.observe(containerRef.current);

        window.addEventListener('resize', fitZoom);
        return () => {
            window.removeEventListener('resize', fitZoom);
            resizeObserver.disconnect();
        };
    }, [width, height]);

    // Manual Zoom Handlers
    const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
    const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
    const zoomFit = () => {
        if (!containerRef.current) return;
        const containerWidth = containerRef.current.clientWidth - 80;
        const containerHeight = containerRef.current.clientHeight - 80;
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        setZoom(Math.min(scaleX, scaleY, 1));
    };

    return {
        zoom,
        containerRef,
        zoomIn,
        zoomOut,
        zoomFit
    };
};
