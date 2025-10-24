import React, { createContext, useState, useContext, ReactElement, useCallback, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { createPortal } from 'react-dom';

// Global state for tracking modal dragging
// Using a module-level variable allows sharing state between components
const activeDragState = {
    activeModalKey: null as string | null,
    dragTimer: null as NodeJS.Timeout | null
};

interface ModalState {
    isOpen: boolean;
    customKey: string;
    title: string;
    body: ReactElement;
    footer?: ReactElement;
    minimized: boolean;
    position: { x: number | null, y: null | number };
    previousPosition?: { x: number | null, y: null | number };
}

interface ModalContextType {
    showModal: (props: {
        customKey: string,
        title: string,
        body: ReactElement,
        footer?: ReactElement
    }) => void;
    hideModal: (key: string) => void;
    minimizeModal: (key: string) => void;
    maximizeModal: (key: string) => void;
    updatePosition: (key: string, position: { x: number, y: number }, isDragging?: boolean) => void;
    modals: ModalState[];
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modals, setModals] = useState<ModalState[]>([]);

    // Handle window resize to reposition minimized modals
    useEffect(() => {
        const handleResize = () => {
            setModals(prevModals => {
                const minimizedModals = prevModals.filter(modal => modal.isOpen && modal.minimized);

                if (minimizedModals.length === 0) return prevModals;

                // Recalculate positions for all minimized modals
                const newPositions = new Map<string, { x: number, y: number }>();

                minimizedModals.forEach((modal, index) => {
                    // Get all modals that come before this one (already positioned)
                    const previousModals = minimizedModals.slice(0, index);
                    const mockPreviousModals = previousModals.map(prevModal => ({
                        ...prevModal,
                        position: newPositions.get(prevModal.customKey) || prevModal.position
                    }));

                    const newPosition = getMinimizedPosition(mockPreviousModals);
                    newPositions.set(modal.customKey, newPosition);
                });

                // Update all modals with new positions
                return prevModals.map(modal => {
                    const newPosition = newPositions.get(modal.customKey);
                    if (newPosition) {
                        return { ...modal, position: newPosition };
                    }
                    return modal;
                });
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [window.innerHeight, window.innerWidth]);

    const showModal = useCallback((props: {
        customKey: string,
        title: string,
        body: ReactElement,
        footer?: ReactElement
    }) => {
        setModals(prevModals => {
            // Check if modal with this key already exists
            const existingModal = prevModals.find(modal => modal.customKey === props.customKey);

            if (existingModal) {
                // Update existing modal but keep its position and state
                return prevModals.map(modal =>
                    modal.customKey === props.customKey
                        ? {
                            ...modal,
                            ...props,
                            isOpen: true,
                            // Only restore to non-minimized if it was previously closed
                            // If it was just minimized, keep it minimized
                            minimized: modal.isOpen ? modal.minimized : false
                        }
                        : modal
                );
            } else {
                // Add new modal with null position so that the Modal component
                // applies CSS centering (50% / 50% with translate(-50%, -50%)).
                // Using null avoids relying on an approximate width/height and ensures
                // true visual centering based on the actual rendered size.
                // Any subsequent movement (drag/minimize) will replace null with concrete coordinates.
                return [...prevModals, {
                    ...props,
                    isOpen: true,
                    minimized: false,
                    position: { x: null, y: null }
                }];
            }
        });
    }, []);

    const hideModal = useCallback((key: string) => {
        // Instead of filtering out the modal, mark it as closed and save its position
        setModals(prevModals =>
            prevModals.map(modal =>
                modal.customKey === key
                    ? {
                        ...modal,
                        isOpen: false,
                        // Store position so we can restore it when reopened
                        previousPosition: modal.position
                    }
                    : modal
            )
        );

        // Clean up any closed modals after some time to prevent state bloat
        // This timeout can be adjusted based on UX needs
        setTimeout(() => {
            setModals(prevModals => {
                // Only remove modals that have been closed for a while
                // Keep recent ones in case they get reopened
                return prevModals.filter(modal =>
                    modal.isOpen || modal.customKey === key
                );
            });
        }, 5000); // Keep closed modals for 5 seconds
    }, []);

    // Function to calculate position for minimized modals to appear side by side
    const getMinimizedPosition = useCallback((existingMinimizedModals: ModalState[]) => {
        const PADDING = 5; // edge padding
        const MINIMIZED_WIDTH = 285; // width of minimized modal
        const MINIMIZED_HEIGHT = 50; // height of minimized modal

        if (existingMinimizedModals.length === 0) {
            // If this is the first minimized modal, position at bottom left
            return {
                x: PADDING + 46,
                y: window.innerHeight - MINIMIZED_HEIGHT - PADDING
            };
        }

        // Sort minimized modals by x position, then by y position for proper row handling
        const sortedModals = [...existingMinimizedModals].sort((a, b) => {
            const aY = a.position.y || 0;
            const bY = b.position.y || 0;
            if (aY !== bY) return bY - aY; // Higher y values first (bottom rows first)

            const aX = a.position.x || 0;
            const bX = b.position.x || 0;
            return aX - bX; // Then by x position (left to right)
        });

        // Find the bottom-most row
        const bottomRow = sortedModals.filter(modal =>
            modal.position.y === sortedModals[0].position.y
        );

        // Sort bottom row by x position to find rightmost
        const rightmostInBottomRow = bottomRow.sort((a, b) => {
            const aX = a.position.x || 0;
            const bX = b.position.x || 0;
            return bX - aX; // Descending to get rightmost first
        })[0];

        const rightEdge = (rightmostInBottomRow.position.x || 0) + MINIMIZED_WIDTH;
        const currentY = rightmostInBottomRow.position.y || 0;

        // Check if we need to wrap to a new row
        if (rightEdge + 5 + MINIMIZED_WIDTH > window.innerWidth - PADDING) {
            // Start a new row above the current bottom row
            const newPosition = {
                x: PADDING,
                y: currentY - MINIMIZED_HEIGHT - 5 // 5px gap between rows
            };

            return newPosition;
        }

        // Position next to the rightmost modal in the bottom row
        const newPosition = {
            x: rightEdge + 5, // 5px gap between modals
            y: currentY
        };

        return newPosition;
    }, []);

    const minimizeModal = useCallback((key: string) => {
        setModals(prevModals => {
            // First, get all other minimized modals (excluding the one being minimized)
            const otherMinimizedModals = prevModals.filter(modal =>
                modal.customKey !== key && modal.isOpen && modal.minimized
            );

            // Calculate position based on existing minimized modals
            const newPosition = getMinimizedPosition([...otherMinimizedModals]);

            // Now update all modals, setting the minimized modal to its new position
            return prevModals.map(modal =>
                modal.customKey === key ? {
                    ...modal,
                    minimized: true,
                    previousPosition: modal.minimized ? modal.previousPosition : modal.position,
                    position: newPosition
                } : modal
            );
        });
    }, [getMinimizedPosition]);

    const maximizeModal = useCallback((key: string) => {
        setModals(prevModals =>
            prevModals.map(modal =>
                modal.customKey === key ? {
                    ...modal,
                    minimized: false,
                    // Restore previous position if available
                    position: modal.previousPosition || modal.position
                } : modal
            )
        );
    }, []);

    // Refs for tracking position updates and DOM manipulation
    const positionUpdatesRef = React.useRef<Map<string, {
        position: { x: number, y: number },
        timestamp: number,
        rafId: number | null,
        isDragging: boolean
    }>>(new Map());

    // We use the module-level activeDragState instead of a ref

    const updatePosition = useCallback((key: string, position: { x: number, y: number }, isDragging?: boolean) => {
        // Store current position in ref
        if (!positionUpdatesRef.current.has(key)) {
            positionUpdatesRef.current.set(key, {
                position,
                timestamp: Date.now(),
                rafId: null,
                isDragging: Boolean(isDragging)
            });
        } else {
            const modalData = positionUpdatesRef.current.get(key)!;
            modalData.position = position;
            modalData.timestamp = Date.now();

            // Set dragging state if provided
            if (isDragging !== undefined) {
                modalData.isDragging = isDragging;
            }
        }

        // Get the DOM element for this modal
        const modalElement = document.querySelector(`[data-modal-key="${key}"]`) as HTMLElement;

        // Apply position directly to DOM during dragging for smooth performance
        if (modalElement) {
            modalElement.style.left = `${position.x}px`;
            modalElement.style.top = `${position.y}px`;
        }

        // During active dragging, don't update React state
        if (isDragging) {
            console.log("Modal is dragging, skipping React state update:", key);
            // Mark this modal as currently being dragged
            activeDragState.activeModalKey = key;

            // Clear any existing timeout
            if (activeDragState.dragTimer) {
                clearTimeout(activeDragState.dragTimer);
            }

            // Set a timer to commit position to state after dragging stops
            activeDragState.dragTimer = setTimeout(() => {
                const modalData = positionUpdatesRef.current.get(key);
                if (modalData) {
                    // Update React state with final position
                    setModals(prevModals =>
                        prevModals.map(modal =>
                            modal.customKey === key ? { ...modal, position: modalData.position } : modal
                        )
                    );

                    // Reset drag state
                    modalData.isDragging = false;
                    activeDragState.activeModalKey = null;
                }
            }, 150); // Wait a bit after dragging stops

            return;
        }

        // For non-dragging updates (like initial positioning or minimize/maximize),
        // update React state directly but still use requestAnimationFrame for smoothness
        console.log("Non-dragging position update, updating React state:", key, position);
        const modalData = positionUpdatesRef.current.get(key);
        if (modalData?.rafId) {
            cancelAnimationFrame(modalData.rafId);
        }

        // Schedule the state update
        const rafId = requestAnimationFrame(() => {
            setModals(prevModals =>
                prevModals.map(modal =>
                    modal.customKey === key ? { ...modal, position } : modal
                )
            );

            const updatedData = positionUpdatesRef.current.get(key);
            if (updatedData) {
                updatedData.rafId = null;
            }
        });

        // Store the animation frame ID
        if (modalData) {
            modalData.rafId = rafId;
        }
    }, []); return (
        <ModalContext.Provider value={{
            showModal,
            hideModal,
            minimizeModal,
            maximizeModal,
            updatePosition,
            modals
        }}>
            {children}
            <ModalContainer />
        </ModalContext.Provider>
    );
};

// Individual modal component - temporarily removing memo to test
const MemoizedModal = ({
    modal,
    onClose,
    onMinimizeToggle,
    onPositionChange
}: {
    modal: ModalState,
    onClose: () => void,
    onMinimizeToggle: () => void,
    onPositionChange: (position: { x: number, y: number }, isDragging?: boolean) => void
}) => {
    return createPortal(
        <Modal
            key={modal.customKey}
            customKey={modal.customKey}
            title={modal.title}
            body={modal.body}
            footer={modal.footer}
            onClose={onClose}
            isMinimized={modal.minimized}
            onMinimizeToggle={onMinimizeToggle}
            position={modal.position}
            onPositionChange={onPositionChange}
        />,
        document.body
    );
};

// Modal container component that will persist across route changes
const ModalContainer: React.FC = () => {
    const context = useContext(ModalContext);

    if (!context) {
        throw new Error('ModalContainer must be used within ModalProvider');
    }

    const { modals, hideModal, minimizeModal, maximizeModal, updatePosition } = context;

    // Create portal for each modal that should be displayed
    return (
        <>
            {modals
                .filter(modal => modal.isOpen) // Only render open modals
                .map(modal => {
                    const handleClose = () => hideModal(modal.customKey);

                    const handleMinimizeToggle = () => {
                        if (modal.minimized) {
                            maximizeModal(modal.customKey);
                        } else {
                            minimizeModal(modal.customKey);
                        }
                    };

                    const handlePositionChange = (position: { x: number, y: number }, isDragging?: boolean) => {
                        updatePosition(modal.customKey, position, isDragging);
                    };

                    return (
                        <MemoizedModal
                            key={modal.customKey}
                            modal={modal}
                            onClose={handleClose}
                            onMinimizeToggle={handleMinimizeToggle}
                            onPositionChange={handlePositionChange}
                        />
                    );
                })}
        </>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);

    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }

    return context;
};