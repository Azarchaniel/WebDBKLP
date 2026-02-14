import React, { ReactElement, useCallback, useState, useEffect, useRef, useLayoutEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faWindowMinimize, faWindowMaximize } from "@fortawesome/free-solid-svg-icons";
import { ValidationError } from "type";
import LoadingSpinner from "./LoadingSpinner";

interface ModalProps {
    customKey: string;
    title: string;
    body: ReactElement;
    footer?: ReactElement;
    onClose?: () => void;
    overrideStyle?: React.CSSProperties;
    isMinimized?: boolean;
    onMinimizeToggle?: () => void;
    position?: { x: number | null, y: number | null };
    onPositionChange?: (position: { x: number, y: number }, isDragging?: boolean) => void;
    modalIndex?: number;
}

export const Modal: React.FC<ModalProps> = ({
    customKey,
    title,
    body,
    footer,
    onClose,
    overrideStyle,
    // New props with fallback to local state
    isMinimized: externalMinimized,
    onMinimizeToggle,
    position: externalPosition,
    onPositionChange
}: ModalProps) => {
    // State for tracking modal position - use local state as fallback
    const [localPosition, setLocalPosition] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });
    const [dragging, setDragging] = useState(false);
    const [rel, setRel] = useState({ x: 0, y: 0 }); // Position relative to the mouse
    const [localMinimized, setLocalMinimized] = useState(false);
    const [previousPosition, setPreviousPosition] = useState<{ x: number | null, y: number | null }>({
        x: null,
        y: null
    });

    // Performance optimization refs
    const modalRef = useRef<HTMLDivElement>(null);
    const lastUpdateRef = useRef<number>(0);
    const lastPositionRef = useRef<{ x: number, y: number } | null>(null);
    const rafRef = useRef<number | null>(null);

    // Use either external state from context or local state
    const minimized = externalMinimized !== undefined ? externalMinimized : localMinimized;
    const position = externalPosition || localPosition;
    const hasExplicitPosition = position.x !== null && position.y !== null;
    const [initialized, setInitialized] = useState(hasExplicitPosition);

    /**
     * Function to update position - either via callback or local state
     * @param x - top to bottom
     * @param y - left to rigth
     **/
    const setPosition = useCallback((newPosition: { x: number | null, y: number | null }) => {
        if (onPositionChange && newPosition.x !== null && newPosition.y !== null) {
            // Pass dragging state to the position change handler
            onPositionChange(newPosition as { x: number, y: number }, dragging);
        } else {
            setLocalPosition(newPosition);
        }
    }, [onPositionChange, dragging]);

    // Window boundaries with padding
    const PADDING = 5; // 5px padding from the edges

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left mouse button
        // Only start dragging if clicking directly on the header, not its children (e.g. buttons)
        if (e.target !== e.currentTarget) return;

        if (modalRef.current) {
            const modalRect = modalRef.current.getBoundingClientRect();

            // Always use the current visual position from getBoundingClientRect()
            // This ensures we get the exact pixel position regardless of how it's currently positioned
            const currentX = modalRect.left;
            const currentY = modalRect.top;

            setRel({
                x: e.clientX - currentX,
                y: e.clientY - currentY
            });

            // Always set explicit position to prevent jump
            setPosition({
                x: currentX,
                y: currentY
            });

            setDragging(true);
            e.stopPropagation();
            e.preventDefault();
        }
    }, [setPosition]);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging) return;

        // Calculate the new position
        let newX = e.clientX - rel.x;
        let newY = e.clientY - rel.y;

        // Apply bounds with padding to keep modal within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const modalWidth = modalRef.current?.offsetWidth || 300;
        const modalHeight = modalRef.current?.offsetHeight || 200;

        // Make sure at least 100px of modal width is always visible
        // and title bar (approx 40px) is accessible
        const minVisibleWidth = Math.min(100, modalWidth * 0.3);
        const minVisibleHeight = Math.min(40, modalHeight * 0.2);

        // Enforce bounds with minimums for usability
        newX = Math.max(-modalWidth + minVisibleWidth, Math.min(viewportWidth - minVisibleWidth, newX));
        newY = Math.max(0, Math.min(viewportHeight - minVisibleHeight, newY));

        // Track the position change for performance optimization
        if (!lastPositionRef.current) {
            lastPositionRef.current = { x: newX, y: newY };
        }

        // Throttle updates for performance - only update if position changed significantly
        // or enough time has passed
        const now = performance.now();
        const positionDelta = lastPositionRef.current ?
            Math.abs(lastPositionRef.current.x - newX) + Math.abs(lastPositionRef.current.y - newY) : 0;

        // Update if significant change (>3px) or sufficient time passed (16ms ~ 60fps)
        if (positionDelta > 3 || now - lastUpdateRef.current > 16) {
            lastUpdateRef.current = now;
            lastPositionRef.current = { x: newX, y: newY };

            // Apply position change
            setPosition({ x: newX, y: newY });
        } else {
            // For very rapid movements, use requestAnimationFrame to throttle updates
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }

            rafRef.current = requestAnimationFrame(() => {
                if (lastPositionRef.current) {
                    setPosition({ x: lastPositionRef.current.x, y: lastPositionRef.current.y });
                }
                rafRef.current = null;
            });
        }

        e.stopPropagation();
        e.preventDefault();
    }, [dragging, rel]);

    // Simple mouse up handler - just end dragging
    const onMouseUp = useCallback((e: MouseEvent) => {
        if (!dragging) return;

        // Cancel any pending animation frames
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        setDragging(false);

        e.stopPropagation();
        e.preventDefault();
    }, [dragging]);        // Set up and clean up event listeners - simplified

    useEffect(() => {
        if (dragging) {
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        } else {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);

            // Clean up any pending animation frames
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [dragging, onMouseMove, onMouseUp]);

    // After first paint, replace the centering transform with explicit pixel coordinates
    // so dragging starts from the on-screen position without the translate jump.
    useLayoutEffect(() => {
        if (hasExplicitPosition) return;
        if (!modalRef.current) return;

        const rect = modalRef.current.getBoundingClientRect();
        const centeredX = Math.max(PADDING, (window.innerWidth - rect.width) / 2);
        const centeredY = Math.max(PADDING, (window.innerHeight - rect.height) / 2);

        setPosition({ x: centeredX, y: centeredY });
        setInitialized(true);
    }, [hasExplicitPosition, setPosition]);

    // If an explicit position arrives later (e.g., from context), mark initialized
    useEffect(() => {
        if (hasExplicitPosition && !initialized) {
            setInitialized(true);
        }
    }, [hasExplicitPosition, initialized]);

    // Handle minimizing/maximizing the modal
    const toggleMinimize = useCallback(() => {
        // If external control is provided, use it
        if (onMinimizeToggle) {
            onMinimizeToggle();
            return;
        }

        // Otherwise handle locally
        if (minimized) {
            setPosition(previousPosition);
            setLocalMinimized(false);
        } else {
            setPreviousPosition(position);
            const viewportHeight = window.innerHeight;

            setPosition({
                x: PADDING + 46,
                y: viewportHeight - 50 - PADDING
            });
            setLocalMinimized(true);
        }
    }, [minimized, position, previousPosition, onMinimizeToggle]);

    const modalStyle: React.CSSProperties = {
        ...overrideStyle,
        position: "fixed",
        left: hasExplicitPosition ? position.x! : "50%",
        top: hasExplicitPosition ? position.y! : "50%",
        transform: hasExplicitPosition ? undefined : "translate(-50%, -50%)",
        margin: 0,
        zIndex: 1010,
        width: minimized ? "100px" : undefined,
        // Remove transition during drag to prevent visual lag
        transition: dragging ? "none" : hasExplicitPosition ? "all 0.2s ease" : "none",
        maxHeight: minimized ? "50px" : "80vh",
        boxShadow: minimized ? "0 2px 10px rgba(0, 0, 0, 0.3)" : undefined,
        opacity: initialized ? 1 : 0,
        pointerEvents: initialized ? undefined : "none",
    };

    // Direct render instead of using portal since the context will handle the portal
    return (
        <div
            className={`customModalWrapper ${minimized ? "minimized" : ""}`}
            key={customKey}
        >
            {!minimized && <div className="customModalBackdrop" />}
            <div
                className="customModal"
                ref={modalRef}
                style={modalStyle}
                data-draggable="true"
                data-modal-key={customKey}
            >
                <div
                    className="customModalHeader"
                    onMouseDown={onMouseDown}
                    style={{
                        cursor: dragging ? "grabbing" : "grab",
                        fontSize: minimized ? "1rem" : "1.5rem"
                    }}
                >
                    {title}
                    <p className="hiddenId">{customKey}</p>
                    <div className="modalControls">
                        <button
                            type="button"
                            className="minimizeModal"
                            onClick={e => { e.stopPropagation(); toggleMinimize(); }}
                            title={minimized ? "Maximalizovať okno" : "Minimalizovať okno"}
                        >
                            <FontAwesomeIcon icon={minimized ? faWindowMaximize : faWindowMinimize} />
                        </button>
                        <button
                            type="button"
                            className="closeModal"
                            onClick={e => { e.stopPropagation(); if (onClose) onClose(); }}
                            title="Zavrieť okno"
                        >
                            &times;
                        </button>
                    </div>
                </div>
                {!minimized && (
                    <>
                        <div className="customModalBody">{body}</div>
                        {footer && <div className="customModalFooter">{footer}</div>}
                    </>
                )}
            </div>
        </div>
    );
};

export const showError = (error: string | any[] | undefined) => {
    if (!error || (Array.isArray(error) && error.length === 0)) return null;

    let errorMessage: string;
    if (Array.isArray(error) && error.length > 0) {
        errorMessage = error[0].label;
    } else {
        errorMessage = String(error);
    }

    return (
        <div className="alert alert-danger">
            <FontAwesomeIcon icon={faExclamationTriangle} /> {errorMessage}
        </div>
    );
};

interface ModalButtonsProps {
    onSave: () => void | Promise<{ success: boolean; message: string } | any>;
    onClear: () => void;
    onRevert?: () => void;
    error?: ValidationError[] | undefined;
    saveResultSuccess?: boolean; // legacy flag, can be removed later
    saveLabel?: string;
    clearLabel?: string;
}

export const ModalButtons: React.FC<ModalButtonsProps> = ({
    onSave,
    onClear,
    onRevert,
    error,
    saveResultSuccess,
    saveLabel = "Uložiť",
    clearLabel = "Vymazať polia"
}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<{ success: boolean; message: string } | null>(null);
    const startRef = useRef<number | null>(null);
    const fallbackRef = useRef<number | null>(null);

    // Timing configuration
    const MIN_SPINNER_MS = 300;      // minimum visible spinner time
    const AUTO_HIDE_MS = 5000;       // fallback for fire-and-forget saves without success signal

    useEffect(() => {
        // External success/failure arrived: hide spinner respecting minimum display time
        if (loading && saveResultSuccess !== undefined) {
            const elapsed = startRef.current ? performance.now() - startRef.current : 0;
            const remaining = Math.max(MIN_SPINNER_MS - elapsed, 0);
            setTimeout(() => setLoading(false), remaining);
        }
    }, [saveResultSuccess, loading]);

    // Cleanup fallback timeout on unmount or when loading ends
    useEffect(() => {
        if (!loading && fallbackRef.current) {
            clearTimeout(fallbackRef.current);
            fallbackRef.current = null;
        }
        return () => {
            if (fallbackRef.current) {
                clearTimeout(fallbackRef.current);
                fallbackRef.current = null;
            }
        };
    }, [loading]);

    const handleSave = useCallback(() => {
        startRef.current = performance.now();
        setLoading(true);
        let maybePromise: any;
        try {
            maybePromise = onSave();
        } catch (err) {
            // Synchronous exception: hide after minimum time
            const elapsed = performance.now() - (startRef.current || performance.now());
            const remaining = Math.max(MIN_SPINNER_MS - elapsed, 0);
            setTimeout(() => setLoading(false), remaining);
            return;
        }

        const isPromise = typeof maybePromise === 'object' && maybePromise !== null && typeof maybePromise.then === 'function';
        if (isPromise) {
            (maybePromise as Promise<any>)
                .then((result) => {
                    // Expecting { success, message }
                    if (result && typeof result === 'object' && 'success' in result && 'message' in result) {
                        setStatusMessage({ success: result.success, message: result.message });
                    }
                })
                .finally(() => {
                    const elapsed = performance.now() - (startRef.current || performance.now());
                    const remaining = Math.max(MIN_SPINNER_MS - elapsed, 0);
                    setTimeout(() => setLoading(false), remaining);
                });
        } else {
            // Fire-and-forget: rely on external success flag, but ensure auto-hide eventually
            if (fallbackRef.current) clearTimeout(fallbackRef.current);
            fallbackRef.current = window.setTimeout(() => {
                if (loading) setLoading(false);
            }, AUTO_HIDE_MS);
        }
    }, [onSave, loading]);

    return (
        <div className="modal-buttons-wrapper">
            <div className="modal-footer-left">
                {showError(error)}
                {statusMessage && (
                    <div
                        className={`modal-status-message ${statusMessage.success ? 'success' : 'fail'}`}
                        title={statusMessage.message}
                    >
                        {statusMessage.message}
                    </div>
                )}
            </div>
            <div className="buttons modal-footer-right">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onRevert}
                >Vrátiť zmeny
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { onClear(); setStatusMessage(null); }}>
                    {clearLabel}
                </button>
                <button
                    type="submit"
                    disabled={Boolean(error?.length) || loading}
                    onClick={handleSave}
                    className="btn btn-success"
                >
                    {loading ? <LoadingSpinner color="white" size={50} marginTop={1} /> : saveLabel}
                </button>
            </div>
        </div>
    );
};