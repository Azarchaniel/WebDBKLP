import React, {FC} from "react";
import {Modal} from "./Modal";
import {createRoot, Root} from "react-dom/client";

interface ConfirmDialogProps {
    text: string;
    title: string;
    onOk?: () => void;
    onCancel?: () => void;
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({text, title, onOk, onCancel}: ConfirmDialogProps) => {
	return (
		<Modal
			key="confirmDialog"
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

let root: Root | null = null;
let container: HTMLElement | null = null;

export const openConfirmDialog = ({
									  text,
									  title,
									  onOk,
									  onCancel,
								  }: ConfirmDialogOptions) => {
	const handleClose = () => {
		if (root && container) {
			root.unmount();
			document.body.removeChild(container);
			root = null;
			container = null;
		}
	};

	const handleOk = () => {
		if (onOk) onOk();
		handleClose();
	};

	const handleCancel = () => {
		if (onCancel) onCancel();
		handleClose();
	};

	if (!container) {
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
	}

	root?.render(
		<ConfirmDialog
			text={text}
			title={title}
			onOk={handleOk}
			onCancel={handleCancel}
		/>
	);
};
