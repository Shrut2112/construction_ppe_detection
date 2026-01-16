"use client";
import React, { useRef, useEffect, useState } from 'react';
import { Camera, AlertCircle } from 'lucide-react';

export default function WebcamStream() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let isLooping = true;

        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                // Initialize WebSocket
                const ws = new WebSocket('ws://127.0.0.1:8000/ws_stream');
                wsRef.current = ws;

                // Function to send the next frame
                const sendFrame = () => {
                    if (!isLooping) return;

                    if (ws.readyState === WebSocket.OPEN && videoRef.current && videoRef.current.readyState >= 2) {
                        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
                            requestAnimationFrame(sendFrame);
                            return;
                        }

                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = videoRef.current.videoWidth;
                        tempCanvas.height = videoRef.current.videoHeight;
                        const ctx = tempCanvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(videoRef.current, 0, 0);
                            tempCanvas.toBlob((blob) => {
                                if (blob && ws.readyState === WebSocket.OPEN) {
                                    ws.send(blob);
                                } else {
                                    // Retry if socket not ready or blob failed
                                    requestAnimationFrame(sendFrame);
                                }
                            }, 'image/jpeg', 0.8);
                        }
                    } else {
                        // Retry if video or socket not ready
                        requestAnimationFrame(sendFrame);
                    }
                };

                ws.onopen = () => {
                    setIsConnected(true);
                    setError(null);
                    console.log("WebSocket connected");
                    // Start the loop
                    sendFrame();
                };

                ws.onclose = (event) => {
                    console.log("WebSocket closed", event.code, event.reason);
                    setIsConnected(false);
                    if (!event.wasClean) {
                        setError(`Connection Closed (${event.code})`);
                    }
                    isLooping = false; // Stop loop
                };

                ws.onmessage = (event) => {
                    const blob = event.data;
                    const url = URL.createObjectURL(blob);
                    if (canvasRef.current) {
                        const img = new Image();
                        img.onload = () => {
                            const ctx = canvasRef.current?.getContext('2d');
                            if (ctx && canvasRef.current) {
                                // Ensure canvas matches image dims
                                canvasRef.current.width = img.width;
                                canvasRef.current.height = img.height;
                                ctx.drawImage(img, 0, 0);
                                URL.revokeObjectURL(url);
                            }
                            // Trigger next frame ONLY after we finished processing/rendering the previous one
                            requestAnimationFrame(sendFrame);
                        };
                        img.src = url;
                    }
                };

                ws.onerror = (e) => {
                    console.error("WebSocket error", e);
                    setError("Connection Failed");
                    isLooping = false;
                };

            } catch (err) {
                console.error("Error accessing webcam", err);
                setError("Camera Access Denied");
            }
        };

        startWebcam();

        return () => {
            isLooping = false;
            if (wsRef.current) wsRef.current.close();
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full bg-black flex flex-col items-center justify-center text-slate-500 overflow-hidden">
            {/* Hidden Source Video */}
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />

            {/* Output Canvas */}
            <canvas ref={canvasRef} className="w-full h-full object-contain" />

            {!isConnected && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <span className="text-tech-neon animate-pulse font-bold tracking-widest">INITIALIZING_UPLINK...</span>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 text-tech-alert gap-4">
                    <AlertCircle size={48} />
                    <span className="font-bold tracking-widest">{error}</span>
                </div>
            )}

            {/* Overlay Status */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <span className={`flex items-center gap-1 border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${isConnected ? 'bg-green-600/20 border-green-500 text-green-500' : 'bg-red-600/20 border-red-500 text-red-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-1 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    {isConnected ? 'LIVE_WEBCAM_FEED' : 'OFFLINE'}
                </span>
            </div>
        </div>
    );
}
