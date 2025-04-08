import React, {useState, useRef, useEffect} from 'react';
import {BrowserMultiFormatReader, DecodeHintType, Result, NotFoundException} from '@zxing/library';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBarcode, faBan, faTimes} from '@fortawesome/free-solid-svg-icons';

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
        if (!videoRef.current || codeReaderRef.current) return; // Prevent multiple starts

        setShowNotFoundIcon(false);
        const hints = new Map<DecodeHintType, any>();
        codeReaderRef.current = new BrowserMultiFormatReader(hints);

        try {
            // Ensure video element exists before accessing srcObject
            if (!videoRef.current) throw new Error("Video element not available.");

            const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
            videoRef.current.srcObject = stream;
            // Wait for metadata to load to avoid race conditions
            await new Promise((resolve) => {
                if (videoRef.current) videoRef.current.onloadedmetadata = resolve;
            });
            await videoRef.current.play();

            // Start decoding
            await codeReaderRef.current.decodeFromVideoDevice(null, videoRef.current, (result: Result | null, error?: Error) => {
                if (result) {
                    setShowNotFoundIcon(false);
                    onBarcodeDetected(result.getText());
                    // No need to call stopScanning here, useEffect cleanup will handle it when isScanning changes
                    setIsScanning(false);
                } else if (error) {
                    if (error instanceof NotFoundException) {
                        setShowNotFoundIcon(true);
                    } else {
                        setShowNotFoundIcon(false);
                        if (onError) onError(error);
                        console.error('Error during decoding:', error);
                        // Consider if you want to stop on other errors
                        // setIsScanning(false);
                    }
                } else {
                    // No result, no error, likely just waiting for a barcode
                    setShowNotFoundIcon(false);
                }
            });
        } catch (error: any) {
            if (onError) onError(error as Error);
            console.error('Error setting up scanner:', error);
            stopScanning();
        }
    };

    const stopScanning = () => {
        // Check if codeReader is still active
        if (codeReaderRef.current) {
            try {
                codeReaderRef.current.reset();
            } catch (e) {
                console.error("Error resetting code reader:", e);
            }
            codeReaderRef.current = null; // Clear the reference
        }

        // Stop camera stream
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop()); // Stop all tracks
            videoRef.current.srcObject = null; // Release the stream from the video element
        }

        setShowNotFoundIcon(false);
        // Ensure isScanning state is false if called directly
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
            <button onClick={toggleScanning} type="button" className="isbnScanner" title="Scan ISBN">
                <FontAwesomeIcon icon={faBarcode}/>
            </button>
            {isScanning && (
                <div className="videoWrapper">
                    <video
                        ref={videoRef}
                        style={{ display: 'block', width: '100%', height: 'auto' }}
                        autoPlay
                        playsInline
                        muted // Often required for autoplay on mobile
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
                        <span className="fa-stack fa-lg videErrorIconWrapper">
                            <FontAwesomeIcon icon={faBarcode} className="fa-stack-1x" style={{color: 'white'}}/>
                            <FontAwesomeIcon icon={faBan} className="fa-stack-1x"/>
                        </span>
                    )}
                </div>
            )}
        </>
    );
};

export default BarcodeScannerButton;