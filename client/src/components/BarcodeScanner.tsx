import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, Result, NotFoundException } from '@zxing/library';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode, faBan, faTimes } from '@fortawesome/free-solid-svg-icons';

interface BarcodeScannerButtonProps {
    onBarcodeDetected: (barcode: string) => void;
    onError?: (error: Error) => void;
}

const BarcodeScannerButton: React.FC<BarcodeScannerButtonProps> = ({
    onBarcodeDetected,
    onError,
}) => {
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [showNotFoundIcon, setShowNotFoundIcon] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Track interval for cleanup
    const drawIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const barcodeLostTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const cleanup = () => {
            stopScanning();
        };

        if (isScanning) {
            startScanning();
        } else {
            stopScanning();
        }

        return cleanup;
    }, [isScanning]);

    const startScanning = async () => {
        if (!videoRef.current || codeReaderRef.current) return;

        setShowNotFoundIcon(false);
        const hints = new Map<DecodeHintType, any>();
        codeReaderRef.current = new BrowserMultiFormatReader(hints);

        try {
            if (!videoRef.current) throw new Error("Video element not available.");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (!stream || !videoRef.current) throw new Error("Could not get video stream.");
            videoRef.current.srcObject = stream;
            await new Promise((resolve, reject) => {
                if (videoRef.current) {
                    videoRef.current.onloadedmetadata = () => resolve(true);
                    videoRef.current.onerror = (e) => reject(e);
                } else {
                    reject(new Error("Video element not available after stream assignment."));
                }
            });
            if (!videoRef.current.srcObject) throw new Error("Video stream lost before play.");
            await videoRef.current.play();

            await codeReaderRef.current.decodeFromVideoDevice(null, videoRef.current, async (result: Result | null, error?: Error) => {
                drawScanAreaRect(!!result);
                if (result) {
                    setShowNotFoundIcon(false);

                    setTimeout(() => {
                        setIsScanning(false);
                        onBarcodeDetected(result!.getText());
                    }, 1000);
                } else {

                    if (!error) throw new Error("Unknown error during decoding.");

                    if (error instanceof NotFoundException) {
                        setShowNotFoundIcon(true);
                    } else {
                        setShowNotFoundIcon(false);
                        if (onError) onError(error);
                        console.error('Error during decoding:', error);
                    }
                }
            });
        } catch (error: any) {
            if (onError) onError(error as Error);
            console.error('Error setting up scanner:', error);
            if (codeReaderRef.current) {
                try { codeReaderRef.current.reset(); } catch (e) { }
                codeReaderRef.current = null;
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
                videoRef.current.srcObject = null;
            }
            setShowNotFoundIcon(false);
            setIsScanning(false);
        }
    };

    // Draw fixed scan area rectangle in the center of the video
    const drawScanAreaRect = (found: boolean) => {
        if (!canvasRef.current || !videoRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 4;
        ctx.strokeStyle = found ? 'lime' : 'white';
        const rectWidth = canvas.width * 0.5;
        const rectHeight = canvas.height * 0.35;
        const rectX = (canvas.width - rectWidth) / 2;
        const rectY = (canvas.height - rectHeight) / 2;
        ctx.beginPath();
        ctx.rect(rectX, rectY, rectWidth, rectHeight);
        ctx.stroke();
    };

    const stopScanning = () => {
        // Cancel draw interval
        if (drawIntervalRef.current) {
            clearInterval(drawIntervalRef.current);
            drawIntervalRef.current = null;
        }
        // Cancel barcode lost timer
        if (barcodeLostTimeoutRef.current) {
            clearTimeout(barcodeLostTimeoutRef.current);
            barcodeLostTimeoutRef.current = null;
        }
        if (codeReaderRef.current) {
            try {
                codeReaderRef.current.reset();
            } catch (e) {
                console.error("Error resetting code reader:", e);
            }
            codeReaderRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
                if (track.readyState === 'live') {
                    track.stop();
                }
            });
            videoRef.current.srcObject = null;
        }
        setShowNotFoundIcon(false);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        if (isScanning) {
            setIsScanning(false);
        }
    };

    const toggleScanning = () => {
        setIsScanning(prev => !prev);
        // Reset icon state immediately when toggling on
        if (!isScanning) {
            setShowNotFoundIcon(false);
        }
    };

    const handleCloseClick = () => {
        stopScanning(); // Directly call stopScanning to ensure immediate cleanup
    };


    return (
        <>
            <button onClick={toggleScanning} type="button" className="isbnScanner" title="Naskenuj ISBN">
                <FontAwesomeIcon icon={faBarcode} />
            </button>
            {isScanning && (
                <div className="videoWrapper">
                    <video
                        ref={videoRef}
                        style={{ display: 'block', width: '100%', height: 'auto' }}
                        autoPlay
                        playsInline
                        muted
                    />
                    {/* Canvas overlay for scan area rectangle */}
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                        }}
                    />
                    <button
                        onClick={handleCloseClick}
                        type="button"
                        title="Close Scanner"
                        className="closeScannerBtn"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                    {showNotFoundIcon && (
                        <div className="videoErrorIconWrapper">
                            <span className="fa-stack fa-lg">
                                <FontAwesomeIcon icon={faBarcode} className="fa-stack-1x" style={{ color: 'white' }} />
                                <FontAwesomeIcon icon={faBan} className="fa-stack-1x" />
                            </span>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default BarcodeScannerButton;