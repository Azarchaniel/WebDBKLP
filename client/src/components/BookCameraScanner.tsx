import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faRulerCombined } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { Tooltip } from "react-tooltip";
import { Modal, showError } from "./Modal";
import {
    BarcodeQuadrilateral, BarcodeSearchArea, decodeBookBarcode, decodeBookBarcodeInQuadrilateral
} from "../utils/bookBarcode";
import {
    PixelImage, Point, MatMarkers, MAT_POINTS,
    compensateBookHeight, findMatMarkers, measureBook, measureBookCorners, perspectiveTransform, rectifyMat
} from "../utils/bookMeasurement";

export interface BookCameraResult {
    barcode: string;
    widthMm: number;
    heightMm: number;
}

interface Props { onDetected: (result: BookCameraResult) => void }

const ScannerSession: React.FC<Props & { onClose: () => void }> = ({ onDetected, onClose }) => {
    const { t, i18n } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const selectionOverlayRef = useRef<HTMLCanvasElement>(null);
    const snapshotRef = useRef<HTMLCanvasElement | null>(null);
    const referenceRef = useRef<PixelImage | null>(null);
    const captureRequestedRef = useRef(false);
    const bookCaptureRequestedRef = useRef(false);
    const frozenRef = useRef(false);
    const measurementRef = useRef<{ widthMm: number; heightMm: number } | null>(null);
    const markersRef = useRef<MatMarkers | null>(null);
    const dragRef = useRef<{ kind: "book" | "barcode"; index: number; pointerId: number } | null>(null);
    const [bookCorners, setBookCorners] = useState<Point[]>([]);
    const [calibrated, setCalibrated] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [markersVisible, setMarkersVisible] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [frozen, setFrozen] = useState(false);
    const [selectingBarcode, setSelectingBarcode] = useState(false);
    const [barcodeCorners, setBarcodeCorners] = useState<Point[]>([]);
    const [searchingBarcode, setSearchingBarcode] = useState(false);
    const [status, setStatus] = useState("starting");
    const [error, setError] = useState("");
    const [result, setResult] = useState<BookCameraResult | null>(null);
    const [cameraHeightCm, setCameraHeightCm] = useState("30");
    const [bookThicknessCm, setBookThicknessCm] = useState("0");
    const cameraHeight = Number(cameraHeightCm), bookThickness = Number(bookThicknessCm);
    const invalidGeometry = cameraHeightCm.trim() === "" || bookThicknessCm.trim() === "" ||
        !Number.isFinite(cameraHeight) || !Number.isFinite(bookThickness) ||
        cameraHeight <= 0 || bookThickness < 0 || bookThickness >= cameraHeight;
    const correctedResult = result && !invalidGeometry ? {
        ...result, ...compensateBookHeight(result, cameraHeight * 10, bookThickness * 10)
    } : null;
    const previewDimensions = frozen && measurementRef.current && !invalidGeometry
        ? compensateBookHeight(measurementRef.current, cameraHeight * 10, bookThickness * 10) : null;

    useEffect(() => {
        const canvas = selectionOverlayRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) {
            setError(i18n.t("bookCamera.canvasError"));
            return;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (!frozen) return;
        for (const [points, color] of [[bookCorners, "#00ff80"], [barcodeCorners, "#ffb000"]] as const) {
            context.strokeStyle = color;
            context.lineWidth = Math.max(3, canvas.width / 320);
            context.beginPath();
            points.forEach((point, index) => {
                if (index === 0) context.moveTo(point.x, point.y);
                else context.lineTo(point.x, point.y);
            });
            if (points.length === 4) context.closePath();
            context.stroke();
            points.forEach(point => {
                context.beginPath();
                context.arc(point.x, point.y, Math.max(8, canvas.width / 100), 0, Math.PI * 2);
                context.fillStyle = "#202020";
                context.fill();
                context.stroke();
            });
        }
    }, [bookCorners, barcodeCorners, frozen, i18n]);

    useEffect(() => {
        let disposed = false;
        let failed = false;
        let stream: MediaStream | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const frame = document.createElement("canvas");
        const snapshot = document.createElement("canvas");
        snapshotRef.current = null;
        referenceRef.current = null;
        measurementRef.current = null;
        markersRef.current = null;
        setBookCorners([]);
        captureRequestedRef.current = false;
        bookCaptureRequestedRef.current = false;
        frozenRef.current = false;
        setCalibrated(false);
        setCapturing(false);
        setMarkersVisible(false);
        setCameraReady(false);
        setFrozen(false);
        setResult(null);
        setSelectingBarcode(false);
        setBarcodeCorners([]);
        setBookCorners([]);
        setSearchingBarcode(false);
        setError("");
        setStatus("starting");

        const fail = (cause: unknown) => {
            if (disposed || failed) return;
            failed = true;
            clearTimeout(timer);
            captureRequestedRef.current = false;
            bookCaptureRequestedRef.current = false;
            setCapturing(false);
            console.error("Book camera scanner failed:", cause);
            setError(cause instanceof Error ? cause.message : String(cause));
            setResult(null);
            setMarkersVisible(false);
            setCameraReady(false);
            stream?.getTracks().forEach(track => track.stop());
        };

        const tick = () => {
            if (disposed || failed) return;
            if (frozenRef.current) {
                timer = setTimeout(tick, 250);
                return;
            }
            try {
                const video = videoRef.current, overlay = overlayRef.current;
                if (!video || !overlay || video.readyState < 2) {
                    setResult(null);
                    setCameraReady(false);
                    setStatus(captureRequestedRef.current ? "capturing" : "starting");
                    timer = setTimeout(tick, 250);
                    return;
                }
                const scale = Math.min(1, 960 / video.videoWidth);
                setCameraReady(true);
                frame.width = Math.round(video.videoWidth * scale);
                frame.height = Math.round(video.videoHeight * scale);
                const context = frame.getContext("2d", { willReadFrequently: true });
                const drawing = overlay.getContext("2d");
                if (!context || !drawing) throw new Error(i18n.t("bookCamera.canvasError"));
                const captureBook = bookCaptureRequestedRef.current;
                if (captureBook) {
                    snapshot.width = video.videoWidth;
                    snapshot.height = video.videoHeight;
                    const snapshotContext = snapshot.getContext("2d");
                    if (!snapshotContext) throw new Error(i18n.t("bookCamera.canvasError"));
                    snapshotContext.drawImage(video, 0, 0);
                    snapshotRef.current = snapshot;
                    setBarcodeCorners([]);
                    setSelectingBarcode(false);
                    setSearchingBarcode(false);
                }
                context.drawImage(captureBook ? snapshot : video, 0, 0, frame.width, frame.height);
                const image = context.getImageData(0, 0, frame.width, frame.height);
                overlay.width = frame.width;
                overlay.height = frame.height;
                const selectionOverlay = selectionOverlayRef.current;
                if (selectionOverlay) {
                    selectionOverlay.width = frame.width;
                    selectionOverlay.height = frame.height;
                }
                if (captureBook) {
                    bookCaptureRequestedRef.current = false;
                    frozenRef.current = true;
                    setFrozen(true);
                    drawing.drawImage(frame, 0, 0);
                    setCapturing(false);
                }
                const markers = findMatMarkers(image);
                setMarkersVisible(!!markers);
                setResult(null);
                if (!markers) {
                    setStatus("markersMissing");
                } else {
                    const rectified = rectifyMat(image, markers);
                    drawing.strokeStyle = "#00ff80";
                    drawing.lineWidth = 3;
                    markers.forEach(p => drawing.strokeRect(p.x - 8, p.y - 8, 16, 16));
                    const reference = referenceRef.current;
                    if (captureRequestedRef.current) {
                        referenceRef.current = rectified;
                        captureRequestedRef.current = false;
                        setCapturing(false);
                        setCalibrated(true);
                        setStatus("placeBook");
                    } else if (!reference) {
                        setStatus("emptyMat");
                    } else {
                        if (!captureBook) {
                            setStatus("placeBook");
                            timer = setTimeout(tick, 350);
                            return;
                        }
                        const measurement = measureBook(reference, rectified);
                        if (!measurement) {
                            setStatus("outlineMissing");
                        } else {
                            measurementRef.current = measurement;
                            markersRef.current = markers;
                            const project = perspectiveTransform(MAT_POINTS, markers);
                            setBookCorners(measurement.corners.map(project));
                            const snapshotContext = snapshot.getContext("2d");
                            if (!snapshotContext) throw new Error(i18n.t("bookCamera.canvasError"));
                            const pixels = snapshotContext.getImageData(0, 0, snapshot.width, snapshot.height).data;
                            const bookCorners = measurement.corners.map(project);
                            const left = Math.min(...bookCorners.map(point => point.x));
                            const top = Math.min(...bookCorners.map(point => point.y));
                            const right = Math.max(...bookCorners.map(point => point.x));
                            const bottom = Math.max(...bookCorners.map(point => point.y));
                            const bookArea: BarcodeSearchArea = {
                                x: left * snapshot.width / frame.width,
                                y: top * snapshot.height / frame.height,
                                width: (right - left) * snapshot.width / frame.width,
                                height: (bottom - top) * snapshot.height / frame.height
                            };
                            const barcode = decodeBookBarcode(
                                { width: snapshot.width, height: snapshot.height, data: pixels }, bookArea
                            );
                            if (!barcode) {
                                setStatus("barcodeMissing");
                            } else {
                                setResult({
                                    barcode,
                                    widthMm: measurement.widthMm,
                                    heightMm: measurement.heightMm
                                });
                                setStatus("ready");
                            }
                        }
                    }
                }
                timer = setTimeout(tick, 350);
            } catch (cause) {
                fail(cause);
            }
        };

        const start = async () => {
            try {
                if (!navigator.mediaDevices?.getUserMedia) throw new Error(i18n.t("bookCamera.cameraUnavailable"));
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
                });
                if (disposed) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                stream.getVideoTracks().forEach(track => track.addEventListener("ended",
                    () => fail(new Error(i18n.t("bookCamera.cameraUnavailable")))));
                const video = videoRef.current;
                if (!video) throw new Error(i18n.t("bookCamera.cameraUnavailable"));
                video.srcObject = stream;
                await video.play();
                if (!disposed) tick();
            } catch (cause) {
                fail(cause);
            }
        };
        void start();
        return () => {
            disposed = true;
            clearTimeout(timer);
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [i18n]);

    const calibrate = () => {
        // Capture in the next valid tick instead of rejecting an aging preview on slower devices.
        captureRequestedRef.current = true;
        bookCaptureRequestedRef.current = false;
        frozenRef.current = false;
        setFrozen(false);
        setResult(null);
        measurementRef.current = null;
        setBookCorners([]);
        setBarcodeCorners([]);
        setSelectingBarcode(false);
        dragRef.current = null;
        setCapturing(true);
        setStatus("capturing");
    };

    const captureBook = () => {
        frozenRef.current = false;
        setFrozen(false);
        setResult(null);
        setBookCorners([]);
        dragRef.current = null;
        setSelectingBarcode(false);
        setBarcodeCorners([]);
        setSearchingBarcode(false);
        const selectionCanvas = selectionOverlayRef.current;
        selectionCanvas?.getContext("2d")?.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        if (frozen) {
            setStatus("placeBook");
            return;
        }
        bookCaptureRequestedRef.current = true;
        setCapturing(true);
        setStatus("analyzing");
    };

    const startBarcodeSelection = () => {
        setBarcodeCorners([]);
        setSelectingBarcode(true);
        setStatus("selectBarcodeCorners");
    };

    const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>, clamp = false): Point | null => {
        const canvas = event.currentTarget;
        const bounds = canvas.getBoundingClientRect();
        const scale = Math.min(bounds.width / canvas.width, bounds.height / canvas.height);
        const renderedWidth = canvas.width * scale, renderedHeight = canvas.height * scale;
        const imageLeft = bounds.left + (bounds.width - renderedWidth) / 2;
        const imageTop = bounds.top + (bounds.height - renderedHeight) / 2;
        if (!clamp && (event.clientX < imageLeft || event.clientX > imageLeft + renderedWidth ||
            event.clientY < imageTop || event.clientY > imageTop + renderedHeight)) return null;
        return {
            x: Math.max(0, Math.min(canvas.width - 1, (event.clientX - imageLeft) / scale)),
            y: Math.max(0, Math.min(canvas.height - 1, (event.clientY - imageTop) / scale))
        };
    };

    const handleBarcodeSelection = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!frozen || searchingBarcode || event.button !== 0) return;
        const point = pointerPosition(event);
        if (!point) return;
        const canvas = event.currentTarget;
        const bounds = canvas.getBoundingClientRect();
        const scale = Math.min(bounds.width / canvas.width, bounds.height / canvas.height);
        if (!selectingBarcode) {
            const handles = [
                ...barcodeCorners.map((corner, index) => ({ corner, index, kind: "barcode" as const })),
                ...bookCorners.map((corner, index) => ({ corner, index, kind: "book" as const }))
            ].sort((a, b) => Math.hypot(a.corner.x - point.x, a.corner.y - point.y) -
                Math.hypot(b.corner.x - point.x, b.corner.y - point.y));
            const handle = handles[0];
            if (handle && Math.hypot(handle.corner.x - point.x, handle.corner.y - point.y) * scale <= 20) {
                dragRef.current = { kind: handle.kind, index: handle.index, pointerId: event.pointerId };
                canvas.setPointerCapture(event.pointerId);
                event.preventDefault();
            }
            return;
        }
        if (barcodeCorners.length >= 4) return;
        const nextCorners = [...barcodeCorners, point];
        setBarcodeCorners(nextCorners);
        if (nextCorners.length === 4) {
            setSelectingBarcode(false);
            setStatus("barcodeSelectionReady");
        }
    };

    const moveCorner = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const point = pointerPosition(event, true);
        if (!point) return;
        if (drag.kind === "barcode") {
            setBarcodeCorners(previous => previous.map((corner, index) => index === drag.index ? point : corner));
            setResult(null);
            setStatus("barcodeSelectionReady");
        } else {
            const markers = markersRef.current;
            if (!markers || bookCorners.length !== 4) return;
            const points = bookCorners.map((corner, index) => index === drag.index ? point : corner);
            const corners: MatMarkers = [points[0], points[1], points[2], points[3]];
            try {
                const measurement = measureBookCorners(corners, markers);
                const dimensions = { widthMm: measurement.widthMm, heightMm: measurement.heightMm };
                measurementRef.current = dimensions;
                setBookCorners(points);
                setResult(previous => previous ? { ...previous, ...dimensions } : null);
            } catch (cause) {
                console.error("Book outline adjustment failed:", cause);
                setStatus("invalidBookOutline");
            }
        }
    };

    const endCornerDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const searchSelectedBarcode = () => {
        const snapshot = snapshotRef.current;
        const measurement = measurementRef.current;
        if (!snapshot || !measurement || barcodeCorners.length !== 4) return;
        setSearchingBarcode(true);
        try {
            const context = snapshot.getContext("2d");
            if (!context) throw new Error(i18n.t("bookCamera.canvasError"));
            const corners = barcodeCorners.map(point => ({
                x: point.x * snapshot.width / (selectionOverlayRef.current?.width ?? snapshot.width),
                y: point.y * snapshot.height / (selectionOverlayRef.current?.height ?? snapshot.height)
            })) as BarcodeQuadrilateral;
            const barcode = decodeBookBarcodeInQuadrilateral({
                width: snapshot.width,
                height: snapshot.height,
                data: context.getImageData(0, 0, snapshot.width, snapshot.height).data
            }, corners);
            if (!barcode) {
                setStatus("barcodeSelectionMissing");
            } else {
                setResult({ barcode, ...measurement });
                setStatus("ready");
            }
        } catch (cause) {
            console.error("Selected barcode scan failed:", cause);
            setStatus("barcodeSelectionError");
        } finally {
            setSearchingBarcode(false);
        }
    };

    return <Modal
        customKey="book-camera-scanner"
        title={t("bookCamera.title")}
        headerContent={<>
            <button type="button" className="minimizeModal" aria-label={t("bookCamera.instructionsLabel")}
                data-tooltip-id="book-camera-instructions"
                onMouseDown={event => event.stopPropagation()}>
                <FontAwesomeIcon icon={faCircleInfo} />
            </button>
            <Tooltip id="book-camera-instructions" clickable openOnClick place="bottom-end"
                positionStrategy="fixed" style={{ maxWidth: "min(400px, calc(100vw - 30px))", fontSize: "1rem", zIndex: 11000 }}>
                <p>{t("bookCamera.instructions")}</p>
                <p>{t("bookCamera.editCorners")}</p>
                <a href={`${import.meta.env.BASE_URL}book-measurement-mat.svg`} target="_blank" rel="noreferrer">
                    {t("bookCamera.downloadMat")}
                </a>
            </Tooltip>
        </>}
        onClose={onClose}
        overrideStyle={{ width: "min(900px, calc(100vw - 10px))", minWidth: 0, maxWidth: "calc(100vw - 10px)" }}
        body={<div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <label>{t("bookCamera.cameraHeight")}
                    <input type="number" min="0.1" step="0.1" value={cameraHeightCm}
                        aria-invalid={invalidGeometry}
                        onChange={event => setCameraHeightCm(event.target.value)} />
                </label>
                <label>{t("bookCamera.bookThickness")}
                    <input type="number" min="0" step="0.1" value={bookThicknessCm}
                        aria-invalid={invalidGeometry}
                        onChange={event => setBookThicknessCm(event.target.value)} />
                </label>
            </div>
            <div style={{ position: "relative" }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ display: "block", width: "100%", maxHeight: "55vh", objectFit: "contain" }} />
                <canvas ref={overlayRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
                <canvas ref={selectionOverlayRef} onPointerDown={handleBarcodeSelection}
                    onPointerMove={moveCorner} onPointerUp={endCornerDrag} onPointerCancel={endCornerDrag}
                    onLostPointerCapture={() => { dragRef.current = null; }}
                    style={{
                        position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain",
                        pointerEvents: frozen && !searchingBarcode ? "auto" : "none",
                        touchAction: "none",
                        cursor: selectingBarcode ? "crosshair" : frozen ? "grab" : "default"
                    }} />
            </div>
            {correctedResult && <p><strong>{correctedResult.barcode}</strong><br />
                {t("bookCamera.result", { width: correctedResult.widthMm, height: correctedResult.heightMm })}
            </p>}
            {!result && previewDimensions && <p>
                {t("bookCamera.result", { width: previewDimensions.widthMm, height: previewDimensions.heightMm })}
            </p>}
        </div>}
        footer={<div className="modal-buttons-wrapper">
            <div className="modal-footer-left" role={error ? "alert" : "status"}>
                {showError(error
                    ? t("bookCamera.error", { message: error })
                    : invalidGeometry ? t("bookCamera.invalidGeometry")
                    : t(searchingBarcode ? "bookCamera.searchingBarcode" : `bookCamera.${status}`, { count: barcodeCorners.length }))}
            </div>
            <div className="buttons modal-footer-right" style={{ justifyContent: "flex-end", gap: "0.5rem", flexWrap: "wrap" }}>
            {frozen && status === "barcodeMissing" && <button type="button" className="btn btn-secondary"
                onClick={startBarcodeSelection}>{t("bookCamera.selectBarcode")}</button>}
            {frozen && barcodeCorners.length === 4 && <>
                <button type="button" className="btn btn-secondary" disabled={searchingBarcode}
                    onClick={searchSelectedBarcode}>{t(searchingBarcode ? "bookCamera.searchingBarcode" : "bookCamera.searchBarcode")}</button>{" "}
                <button type="button" className="btn btn-secondary" disabled={searchingBarcode}
                    onClick={startBarcodeSelection}>{t("bookCamera.redrawBarcodeSelection")}</button>
            </>}
            <button type="button" className="btn btn-secondary" disabled={!cameraReady || (!frozen && !markersVisible) || capturing || !!error} onClick={calibrate}>
                {t(calibrated ? "bookCamera.recalibrate" : "bookCamera.calibrate")}
            </button>{" "}
            <button type="button" className="btn btn-secondary" disabled={!calibrated || !cameraReady || capturing || !!error} onClick={captureBook}>
                {t(frozen ? "bookCamera.retake" : "bookCamera.captureBook")}
            </button>{" "}
            <button type="button" className="btn btn-primary" disabled={!correctedResult || capturing || !!error} onClick={() => {
                if (correctedResult) {
                    onDetected(correctedResult);
                }
            }}>{t("bookCamera.apply")}</button>
            </div>
        </div>}
    />;
};

const BookCameraScanner: React.FC<Props> = ({ onDetected }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    return <>
        <button type="button" className="btn btn-secondary" aria-label={t("bookCamera.title")}
            data-tooltip-id="global-tooltip" data-tooltip-content={t("bookCamera.title")} onClick={() => setOpen(true)}>
            <FontAwesomeIcon icon={faRulerCombined} /> {t("bookCamera.title")}
        </button>
        {open && <ScannerSession onClose={() => setOpen(false)} onDetected={result => {
            onDetected(result);
            setOpen(false);
        }} />}
    </>;
};

export default BookCameraScanner;
