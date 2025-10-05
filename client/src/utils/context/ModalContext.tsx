import React, { createContext, useState, useContext, ReactElement, useCallback } from 'react';
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
                // Add new modal centered in the viewport
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const modalWidth = 600; // Default modal width estimate
                const modalHeight = 400; // Default modal height estimate

                // Center the modal in the viewport
                const centerPosition = {
                    x: Math.max(0, (viewportWidth - modalWidth) / 2),
                    y: Math.max(0, (viewportHeight - modalHeight) / 3) // Slightly above center
                };

                return [...prevModals, {
                    ...props,
                    isOpen: true,
                    minimized: false,
                    position: centerPosition
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
    const getMinimizedPosition = useCallback((modals: ModalState[]) => {
        const PADDING = 5; // edge padding
        const MINIMIZED_WIDTH = 250; // width of minimized modal
        const MINIMIZED_HEIGHT = 50; // height of minimized modal

        // Get all currently open and minimized modals
        const minimizedModals = modals.filter(m => m.isOpen && m.minimized);

        if (minimizedModals.length === 0) {
            // If this is the first minimized modal, position at bottom left
            return {
                x: PADDING,
                y: window.innerHeight - MINIMIZED_HEIGHT - PADDING
            };
        }

        // Sort minimized modals by x position to find the rightmost
        const sortedModals = [...minimizedModals].sort((a, b) => {
            const aX = a.position.x || 0;
            const bX = b.position.x || 0;
            return bX - aX; // descending order to get rightmost first
        });

        // Get the rightmost modal's position
        const rightmostModal = sortedModals[0];
        const rightEdge = (rightmostModal.position.x || 0) + MINIMIZED_WIDTH;

        // Check if we need to wrap to a new row
        if (rightEdge + MINIMIZED_WIDTH + PADDING > window.innerWidth) {
            // Start a new row above the current row
            return {
                x: PADDING,
                y: (rightmostModal.position.y || 0) - MINIMIZED_HEIGHT - 5 // 5px gap between rows
            };
        }

        // Position next to the rightmost modal
        return {
            x: rightEdge + 5, // 5px gap between modals
            y: rightmostModal.position.y || 0
        };
    }, []);

    const minimizeModal = useCallback((key: string) => {
        setModals(prevModals => {
            // First, mark the modal as minimized
            const updatedModals = prevModals.map(modal =>
                modal.customKey === key ? {
                    ...modal,
                    minimized: true,
                    // Store current position as a reference for maximizing
                    previousPosition: modal.minimized ? modal.previousPosition : modal.position
                } : modal
            );

            // Then calculate its position alongside other minimized modals
            const newPosition = getMinimizedPosition(updatedModals);

            // Apply the position to the minimized modal
            return updatedModals.map(modal =>
                modal.customKey === key ? {
                    ...modal,
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

// Individual modal component wrapped in memo to prevent unnecessary re-renders
const MemoizedModal = React.memo(
    ({
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
    },
    // Enhanced comparison function for better performance during dragging
    (prevProps, nextProps) => {
        const prevModal = prevProps.modal;
        const nextModal = nextProps.modal;

        // Check if the modal key matches the one currently being dragged
        const isDragging = activeDragState.activeModalKey === prevModal.customKey;

        // Skip all re-renders during active dragging since we're using direct DOM manipulation
        if (isDragging) {
            // Allow only critical changes during dragging like minimize/maximize
            if (prevModal.minimized !== nextModal.minimized) {
                return false; // Re-render needed
            }
            return true; // Skip most re-renders during dragging
        }

        // For normal operation (not dragging), re-render for these changes
        if (prevModal.title !== nextModal.title ||
            prevModal.minimized !== nextModal.minimized ||
            prevProps.onClose !== nextProps.onClose) {
            return false;
        }

        // For body and footer, only re-render if they change
        if (prevModal.body !== nextModal.body ||
            prevModal.footer !== nextModal.footer) {
            return false;
        }

        // For position changes, only re-render for significant changes
        if (prevModal.position.x !== nextModal.position.x ||
            prevModal.position.y !== nextModal.position.y) {

            // If both positions are defined, check the magnitude of change
            if (prevModal.position.x !== null && prevModal.position.y !== null &&
                nextModal.position.x !== null && nextModal.position.y !== null) {

                const dx = Math.abs((prevModal.position.x || 0) - (nextModal.position.x || 0));
                const dy = Math.abs((prevModal.position.y || 0) - (nextModal.position.y || 0));

                // Only re-render for large position changes
                return (dx < 5 && dy < 5); // Skip re-render for small changes
            }

            return false; // Different position types, re-render
        }

        return true; // Default to not re-rendering if nothing significant changed
    }
);

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