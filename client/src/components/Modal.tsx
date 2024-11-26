import {createPortal} from "react-dom";
import React, {ReactElement} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";

interface ModalProps {
    title: string;
    body: ReactElement;
    footer?: ReactElement;
    onClose?: () => void;
    overrideStyle?: React.CSSProperties;
}

export const Modal: React.FC<ModalProps> = ({title, body, footer, onClose, overrideStyle}: ModalProps) => {
    return createPortal(
        <div className="customModalWrapper">
            <div className="customModalBackdrop"
                 onClick={onClose}
            />

            <div className="customModal" style={overrideStyle}>
                <div className="customModalHeader">
                    <span>{title}</span>
                    <button
                        type="button"
                        className="closeModal"
                        onClick={onClose}
                        title="Zavrieť okno"
                    ><span>&times;</span></button>
                </div>
                <div className="customModalBody">
                    {body}
                </div>
                {footer && <div className="customModalFooter">
                    {footer}
                </div>}
            </div>
        </div>, document.body);

}

export const showError = (error: string | any[] | undefined) => {
    if (!error || (Array.isArray(error) && error.length === 0)) return <></>;

    if (Array.isArray(error) && error.length > 0) {
        error = error[0].label;
    }

    return (
        <div className="alert alert-danger"><FontAwesomeIcon icon={faExclamationTriangle}/> {error}</div>
    );
}