import React, { useState, useEffect, useCallback } from 'react';
import { ILP, ValidationError } from '../../type';
import { Modal, ModalButtons } from '@components/Modal';
import { LPsModalBody } from './LPsModal';
import { toast } from 'react-toastify';
import { addLP } from '../../API';

interface LPModalProps {
    /**
     * LPs to edit (undefined or empty array for new LP)
     */
    lps?: ILP[];

    /**
     * Called when the modal is closed
     */
    onClose?: () => void;

    /**
     * Called after a successful save
     * @param savedLPs The LPs that were saved
     */
    onSaveSuccess?: (savedLPs: ILP[]) => void;

    /**
     * Whether the modal is initially visible
     */
    initiallyVisible?: boolean;

    /**
     * Custom title for the modal (defaults to "Edit LP" or "Add LP")
     */
    title?: string;

    /**
     * Indicates the success state of the save operation
     */
    saveResultSuccess?: boolean | undefined;
}

/**
 * A standalone LP modal component that manages its own state
 */
export const StandaloneLPModal: React.FC<LPModalProps> = ({
    lps,
    onClose,
    onSaveSuccess,
    initiallyVisible = false,
    title,
    saveResultSuccess: externalSaveResultSuccess
}) => {
    const [visible, setVisible] = useState<boolean>(initiallyVisible || Boolean(lps));
    const [lpData, setLpData] = useState<ILP[]>(lps || [{}] as ILP[]);
    const [saveResultSuccess, setSaveResultSuccess] = useState<boolean | undefined>(externalSaveResultSuccess);
    const [error, setError] = useState<ValidationError[] | undefined>([{
        label: "Názov LP musí obsahovať aspoň jeden znak!",
        target: "title"
    }]);
    const [outline, setOutline] = useState<React.CSSProperties>();

    // Reset form data when lps prop changes
    useEffect(() => {
        if (lps) {
            setLpData(lps);
        }
    }, [lps]);

    // Update outline based on save result
    useEffect(() => {
        switch (saveResultSuccess) {
            case true:
                setOutline({ outline: "10px solid green" });
                break;
            case false:
                setOutline({ outline: "10px solid red" });
                break;
            default:
                setOutline({ outline: "none" });
                break;
        }
    }, [saveResultSuccess]);

    // Handle LP data changes from the form
    const handleChange = useCallback((data: ILP | object | ILP[]) => {
        // If data is an array of ILP, set directly; otherwise, wrap in array
        if (Array.isArray(data)) {
            setLpData(data as ILP[]);
        } else if (typeof data === "object") {
            setLpData([data as ILP]);
        } else {
            setLpData([{}] as ILP[]);
        }
    }, []);

    // Handle saving the LP
    const handleSave = useCallback(() => {
        setSaveResultSuccess(undefined);

        // Multi-edit support
        if (lpData.length > 1) {
            // Implement batch update
            Promise.all(lpData.map(lp => addLP(lp)))
                .then((results) => {
                    toast.success(`Uložených ${results.length} LP.`);
                    setSaveResultSuccess(true);

                    // Notify parent component of successful save
                    if (onSaveSuccess) {
                        const savedLPs = results.map(res => res.data.lp);
                        onSaveSuccess(savedLPs);
                    }
                })
                .catch((err) => {
                    setSaveResultSuccess(false);
                    toast.error("Niektoré LP sa nepodarilo uložiť!");
                    console.trace(err);
                });
        } else {
            // Single LP edit/add
            addLP(lpData[0])
                .then(({ status, data }) => {
                    const isEdit = !!lpData[0]?._id;

                    if (status !== 201) {
                        toast.error(`Chyba! LP ${data.lp?.title} nebolo ${isEdit ? "uložené" : "pridané"}.`);
                        throw new Error("LP sa nepodarilo pridať!");
                    }

                    toast.success(`LP ${data.lp?.title} bolo úspešne ${isEdit ? "uložené" : "pridané"}.`);
                    setSaveResultSuccess(true);

                    // Notify parent component of successful save
                    if (onSaveSuccess) {
                        onSaveSuccess([data.lp]);
                    }
                })
                .catch((err) => {
                    setSaveResultSuccess(false);
                    toast.error("LP sa nepodarilo pridať!");
                    console.trace(err);
                });
        }
    }, [lpData, onSaveSuccess]);

    // Handle clearing the form
    const handleClear = useCallback(() => {
        setLpData([{}] as ILP[]);
        setSaveResultSuccess(undefined);
        setOutline({ outline: "none" });
    }, []);

    // Handle reverting changes
    const handleRevert = useCallback(() => {
        setLpData(lps || [{}] as ILP[]);
        setSaveResultSuccess(undefined);
        setOutline({ outline: "none" });
    }, [lps]);

    // Handle closing the modal
    const handleClose = useCallback(() => {
        setVisible(false);
        if (onClose) onClose();
    }, [onClose]);

    // Show modal button if it's not initially visible
    const modalButton = (
        <button
            type="button"
            className="addBtnTable"
            onClick={() => setVisible(true)}
            title={title || "Pridať LP"}
        />
    );

    // Determine the modal title
    const modalTitle = title || (
        (lps && lps.length > 0 && lps[0]._id)
            ? (lps.length > 1 ? `Upraviť ${lps.length} LP` : "Upraviť LP")
            : "Pridať LP"
    );

    return (
        <>
            {/* Show button only if modal is not automatically visible */}
            {!initiallyVisible && !visible && modalButton}

            {/* Modal */}
            {visible && (
                <Modal
                    customKey={lpData[0]?._id || "new-lp"}
                    title={modalTitle}
                    onClose={handleClose}
                    body={
                        <LPsModalBody
                            data={lpData}
                            onChange={handleChange}
                            error={setError}
                        />
                    }
                    footer={
                        <ModalButtons
                            onSave={handleSave}
                            onClear={handleClear}
                            onRevert={handleRevert}
                            error={error}
                            saveResultSuccess={saveResultSuccess}
                        />
                    }
                    overrideStyle={outline}
                />
            )}
        </>
    );
};

/**
 * Hook to use the LPModal component programmatically
 */
export const useStandaloneLPModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentLPs, setCurrentLPs] = useState<ILP[]>([{}] as ILP[]);

    const openModal = useCallback((lps?: ILP[]) => {
        if (lps) {
            setCurrentLPs(lps);
        } else {
            setCurrentLPs([{}] as ILP[]);
        }
        setIsVisible(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Render function to be used in your component
    const renderLPModal = useCallback((props: Omit<LPModalProps, 'initiallyVisible' | 'lps'> = {}) => (
        <StandaloneLPModal
            {...props}
            initiallyVisible={isVisible}
            lps={currentLPs}
            onClose={() => {
                closeModal();
                if (props.onClose) props.onClose();
            }}
        />
    ), [isVisible, currentLPs]);

    return {
        openModal,
        closeModal,
        renderLPModal
    };
};

export default StandaloneLPModal;