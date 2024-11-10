import {createPortal} from "react-dom";
import React, {ReactElement} from "react";

interface ModalProps {
    title: string;
    body: ReactElement;
    footer?: ReactElement;
    onClose?: () => void;
}

export const Modal: React.FC<ModalProps> = ({title, body, footer, onClose}: ModalProps) => {

    return createPortal(<div className="customModal">
        <div className="customModalWrapper">
            <div className="customModalBackdrop"
                 onClick={onClose}
            />

            <div className="customModal">
                <div className="customModalHeader">
                    <span>{title}</span>
                    <button
                        type="button"
                        className="closeModal"
                        onClick={onClose}
                        title="Zavrieť okno"
                    ><span>&times;</span></button>
                </div>
                <div className="customModalBody">{body}</div>
                {footer && <div className="customModalFooter">
                    {footer}
                </div>}
            </div>
        </div>
    </div>, document.body);

}