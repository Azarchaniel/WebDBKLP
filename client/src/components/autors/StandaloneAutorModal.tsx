import React, { useState, useEffect, useCallback } from 'react';
import { IAutor, ValidationError } from '../../type';
import { Modal, ModalButtons } from '@components/Modal';
import { AutorsModalBody } from './AutorsModal';
import { toast } from 'react-toastify';
import { addAutor } from '../../API';

interface AutorModalProps {
    /**
     * Autors to edit (undefined or empty array for new autor)
     */
    autors?: IAutor[];

    /**
     * Called when the modal is closed
     */
    onClose?: () => void;

    /**
     * Called after a successful save
     * @param savedAutors The autors that were saved
     */
    onSaveSuccess?: (savedAutors: IAutor[]) => void;

    /**
     * Whether the modal is initially visible
     */
    initiallyVisible?: boolean;

    /**
     * Custom title for the modal (defaults to "Edit Autor" or "Add Autor")
     */
    title?: string;

    /**
     * Indicates the success state of the save operation
     */
    saveResultSuccess?: boolean | undefined;
}

/**
 * A standalone autor modal component that manages its own state
 */
export const StandaloneAutorModal: React.FC<AutorModalProps> = ({
    autors,
    onClose,
    onSaveSuccess,
    initiallyVisible = false,
    title,
    saveResultSuccess: externalSaveResultSuccess
}) => {
    const [visible, setVisible] = useState<boolean>(initiallyVisible || Boolean(autors));
    const [autorData, setAutorData] = useState<IAutor[]>(autors || [{}] as IAutor[]);
    const [saveResultSuccess, setSaveResultSuccess] = useState<boolean | undefined>(externalSaveResultSuccess);
    const [error, setError] = useState<ValidationError[] | undefined>([{
        label: "Priezvisko autora musí obsahovať aspoň jeden znak!",
        target: "lastName"
    }]);
    const [outline, setOutline] = useState<React.CSSProperties>();

    // Reset form data when autors prop changes
    useEffect(() => {
        if (autors) {
            setAutorData(autors);
        }
    }, [autors]);

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

    // Handle autor data changes from the form
    const handleChange = useCallback((data: IAutor[] | object) => {
        // If data is an array of IAutor, set directly; otherwise, wrap in array
        if (Array.isArray(data)) {
            setAutorData(data as IAutor[]);
        } else if (typeof data === "object") {
            setAutorData([data as IAutor]);
        } else {
            setAutorData([{}] as IAutor[]);
        }
    }, []);

    // Handle saving the autor
    const handleSave = useCallback(() => {
        setSaveResultSuccess(undefined);

        addAutor(autorData)
            .then((res) => {
                if (Array.isArray(autorData) && autorData.length > 1) {
                    let message = "";
                    if (res.length < 5) {
                        message = `${res.length} autori boli úspešne upravení.`;
                    } else {
                        message = `${res.length} autorov bolo úspešne upravených.`;
                    }

                    toast.success(message);
                } else {
                    const firstName = autorData[0].firstName || '';
                    const lastName = autorData[0].lastName || '';
                    const displayName = firstName && lastName
                        ? `${firstName} ${lastName}`
                        : lastName || firstName || 'Autor';

                    toast.success(
                        `${displayName} bol úspešne ${(autorData[0] as IAutor)._id ? "uložený" : "pridaný"}.`);
                }
                setSaveResultSuccess(true);

                // Notify parent component of successful save
                if (onSaveSuccess) {
                    const savedAutors = Array.isArray(res)
                        ? res.map(r => r.data.autor)
                        : [res.data.autor];
                    onSaveSuccess(savedAutors);
                }

                // Close modal after successful save (optional)
                // setTimeout(() => setVisible(false), 1500);
            })
            .catch((err) => {
                toast.error(err.response?.data?.error || "Chyba! Autor nebol uložený!");
                console.trace("Error saving autors", err)
                setSaveResultSuccess(false);
            });
    }, [autorData, onSaveSuccess]);

    // Handle clearing the form
    const handleClear = useCallback(() => {
        setAutorData([{}] as IAutor[]);
        setSaveResultSuccess(undefined);
        setOutline({ outline: "none" });
    }, []);

    // Handle reverting changes
    const handleRevert = useCallback(() => {
        setAutorData(autors || [{}] as IAutor[]);
        setSaveResultSuccess(undefined);
        setOutline({ outline: "none" });
    }, [autors]);

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
            title={title || "Pridať autora"}
        />
    );

    // Determine the modal title
    const modalTitle = title || (
        (autors && autors.length > 0 && autors[0]._id)
            ? "Upraviť autora"
            : "Pridať autora"
    );

    return (
        <>
            {/* Show button only if modal is not automatically visible */}
            {!initiallyVisible && !visible && modalButton}

            {/* Modal */}
            {visible && (
                <Modal
                    customKey={autorData[0]?._id || "new-autor"}
                    title={modalTitle}
                    onClose={handleClose}
                    body={
                        <AutorsModalBody
                            data={autorData}
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
 * Hook to use the AutorModal component programmatically
 */
export const useStandaloneAutorModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentAutors, setCurrentAutors] = useState<IAutor[]>([{}] as IAutor[]);

    const openModal = useCallback((autors?: IAutor[]) => {
        if (autors) {
            setCurrentAutors(autors);
        } else {
            setCurrentAutors([{}] as IAutor[]);
        }
        setIsVisible(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Render function to be used in your component
    const renderAutorModal = useCallback((props: Omit<AutorModalProps, 'initiallyVisible' | 'autors'> = {}) => (
        <StandaloneAutorModal
            {...props}
            initiallyVisible={isVisible}
            autors={currentAutors}
            onClose={() => {
                closeModal();
                if (props.onClose) props.onClose();
            }}
        />
    ), [isVisible, currentAutors]);

    return {
        openModal,
        closeModal,
        renderAutorModal
    };
};

export default StandaloneAutorModal;