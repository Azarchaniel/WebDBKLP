import React, {FC} from "react";
import {Modal} from "./Modal";
import ReactDOM from 'react-dom';

interface ConfirmDialogProps {
    text: string;
    title: string;
    onOk?: () => void;
    onCancel?: () => void;
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({text, title, onOk, onCancel}: ConfirmDialogProps) => {
    return (
        <Modal
            title={title}
            body={<span>{text}</span>}
            footer={
                <div className="buttons">
                    <button type="button" className="btn btn-secondary"
                            onClick={onCancel}>Zrušiť
                    </button>
                    <button type="submit"
                            onClick={onOk}
                            className="btn btn-success">Potvrdiť
                    </button>
                </div>
            }
            onClose={onCancel}
            overrideStyle={{
                minHeight: "100px",
                minWidth: "350px",
                alignItems: "flex-start",
            }}
        />
    )
}

interface ConfirmDialogOptions {
    text: string;
    title: string;
    onOk?: () => void;
    onCancel?: () => void;
}

export const openConfirmDialog = ({text, title, onOk, onCancel}: ConfirmDialogOptions) => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const handleClose = () => {
        ReactDOM.unmountComponentAtNode(container);
        document.body.removeChild(container);
    };

    const handleOk = () => {
        if (onOk) onOk();
        handleClose();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        handleClose();
    };

    ReactDOM.render(
        <ConfirmDialog
            text={text}
            title={title}
            onOk={handleOk}
            onCancel={handleCancel}
        />,
        container
    );
};