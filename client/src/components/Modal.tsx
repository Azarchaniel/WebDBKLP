import React, { ReactElement, memo, useCallback, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
    // New props for persistent modal functionality
    isMinimized?: boolean;
    onMinimizeToggle?: () => void;
    position?: { x: number | null, y: number | null };
    onPositionChange?: (position: { x: number, y: number }, isDragging?: boolean) => void;
}

// Custom comparison function for memo to prevent unnecessary re-renders
const arePropsEqual = (prevProps: ModalProps, nextProps: ModalProps) => {
    // Always re-render if these core props change
    if (prevProps.title !== nextProps.title ||
        prevProps.customKey !== nextProps.customKey ||
        prevProps.isMinimized !== nextProps.isMinimized) {
        return false;
    }

    // For position changes during dragging, skip re-renders
    // This is critical for performance
    const prevPosition = prevProps.position;
    const nextPosition = nextProps.position;

    if (prevPosition && nextPosition &&
        prevPosition.x !== null && prevPosition.y !== null &&
        nextPosition.x !== null && nextPosition.y !== null) {
        // Only re-render if the position change is significant (>5px)
        const xDiff = Math.abs((prevPosition.x || 0) - (nextPosition.x || 0));
        const yDiff = Math.abs((prevPosition.y || 0) - (nextPosition.y || 0));

        // Skip small movements to improve performance
        if (xDiff < 5 && yDiff < 5) {
            return true; // skip re-render
        }
    }

    // For all other props, do a normal comparison
    return false;
}; export const Modal: React.FC<ModalProps> = memo(({
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
    const [previousPosition, setPreviousPosition] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });

    // Performance optimization refs
    const modalRef = useRef<HTMLDivElement>(null);
    const lastUpdateRef = useRef<number>(0);
    const lastPositionRef = useRef<{ x: number, y: number } | null>(null);
    const rafRef = useRef<number | null>(null);
    const dragStateRef = useRef<{
        dragging: boolean,
        initialX: number | null,
        initialY: number | null,
        totalDelta: { x: number, y: number }
    }>({
        dragging: false,
        initialX: null,
        initialY: null,
        totalDelta: { x: 0, y: 0 }
    });

    // Use either external state from context or local state
    const minimized = externalMinimized !== undefined ? externalMinimized : localMinimized;
    const position = externalPosition || localPosition;

    // Function to update position - either via callback or local state
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

    // Handle the start of the drag - simplified to match LoginModal behavior
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left mouse button

        if (modalRef.current) {
            // Get the current position of the modal
            const modalRect = modalRef.current.getBoundingClientRect();

            // Calculate the position of the mouse relative to the modal
            const relX = e.clientX - modalRect.left;
            const relY = e.clientY - modalRect.top;

            setRel({ x: relX, y: relY });

            // If this is the first time dragging, set initial position to current position
            if (position.x === null || position.y === null) {
                setPosition({
                    x: modalRect.left,
                    y: modalRect.top
                });
            }

            setDragging(true);
            e.stopPropagation();
            e.preventDefault();
        }
    }, [position.x, position.y]);    // Enhanced drag motion handler with better edge handling
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
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        } else {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // Clean up any pending animation frames
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [dragging, onMouseMove, onMouseUp]);

    // Make sure we maintain the modal's centered positioning until user starts dragging
    // This empty effect is intentional to document our approach - we don't set position
    // until the user actually starts dragging

    // Handle minimizing/maximizing the modal
    const toggleMinimize = useCallback(() => {
        // If external control is provided, use it
        if (onMinimizeToggle) {
            onMinimizeToggle();
            return;
        }

        // Otherwise handle locally
        if (minimized) {
            // Restore previous position
            setPosition(previousPosition);
            setLocalMinimized(false);
        } else {
            // Save current position before minimizing
            setPreviousPosition(position);

            // Calculate position for bottom left corner
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const modalWidth = modalRef.current?.offsetWidth || 300;

            // Position at the bottom left with padding
            setPosition({
                x: PADDING,
                y: viewportHeight - 50 - PADDING // 50px for minimized height
            });
            setLocalMinimized(true);
        }
    }, [minimized, position, previousPosition, onMinimizeToggle]);

    // Prepare the style for the modal - simpler like LoginModal
    const modalStyle: React.CSSProperties = {
        ...overrideStyle,
        position: position.x !== null && position.y !== null ? 'fixed' : undefined,
        left: position.x !== null ? position.x : undefined,
        top: position.y !== null ? position.y : undefined,
        margin: position.x !== null || position.y !== null ? 0 : undefined,
        zIndex: 1010, // Increased z-index to ensure it's always on top
        width: minimized ? '250px' : undefined,
        transition: dragging ? 'none' : 'width 0.2s ease, height 0.2s ease', // Disable transitions during drag
        maxHeight: minimized ? '50px' : '80vh',
        boxShadow: minimized ? '0 2px 10px rgba(0, 0, 0, 0.3)' : undefined, // Add shadow when minimized for better visibility
    };

    // Direct render instead of using portal since the context will handle the portal
    return (
        <div
            className={`customModalWrapper ${minimized ? 'minimized' : ''}`}
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
                        cursor: dragging ? 'grabbing' : 'grab',
                        fontSize: minimized ? '1rem' : '1.5rem'
                    }}
                >
                    {title}
                    <p className="hiddenId">{customKey}</p>
                    <div className="modalControls">
                        <button
                            type="button"
                            className="minimizeModal"
                            onClick={toggleMinimize}
                            title={minimized ? "Maximalizovať okno" : "Minimalizovať okno"}
                        >
                            <FontAwesomeIcon icon={minimized ? faWindowMaximize : faWindowMinimize} />
                        </button>
                        <button
                            type="button"
                            className="closeModal"
                            onClick={onClose}
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
}, arePropsEqual);

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
    onSave: () => void;
    onClear: () => void;
    onRevert?: () => void;
    error?: ValidationError[] | undefined;
    saveResultSuccess?: boolean;
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

    useEffect(() => {
        if (saveResultSuccess !== undefined && loading) setLoading(false);
    }, [saveResultSuccess, loading]);

    const handleSave = useCallback(() => {
        setLoading(true);
        onSave();
    }, [onSave]);

    return (
        <div className="column">
            <div>{showError(error)}</div>
            <div className="buttons">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onRevert}
                >Vrátiť zmeny</button>
                <button type="button" className="btn btn-secondary" onClick={onClear}>
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