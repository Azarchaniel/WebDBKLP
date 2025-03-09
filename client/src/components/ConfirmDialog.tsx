import React, { FC, useCallback } from "react";
import { Modal } from "./Modal";
import { createRoot } from "react-dom/client";

interface ConfirmDialogProps {
	text: string;
	title: string;
	onOk?: () => void;
	onCancel?: () => void;
}

const ConfirmDialog: FC<ConfirmDialogProps> = React.memo(({
															  text,
															  title,
															  onOk,
															  onCancel
														  }: ConfirmDialogProps) => {
	const handleOk = useCallback(() => {
		if (onOk) onOk();
	}, [onOk]);

	const handleCancel = useCallback(() => {
		if (onCancel) onCancel();
	}, [onCancel]);

	const bodyElement = <span>{text}</span>;
	const footerElement = (
		<div className="buttons">
			<button
				type="button"
				className="btn btn-secondary"
				onClick={handleCancel}
			>
				Zrušiť
			</button>
			<button
				type="submit"
				onClick={handleOk}
				className="btn btn-success"
			>
				Potvrdiť
			</button>
		</div>
	);

	return (
		<Modal
			customKey={`confirmDialog-${title}`}
			title={title}
			body={bodyElement}
			footer={footerElement}
			onClose={handleCancel}
			overrideStyle={{
				minHeight: "100px",
				minWidth: "350px",
				alignItems: "flex-start",
			}}
		/>
	);
});

const DialogManager = (() => {
	let rootElement: HTMLDivElement | null = null;
	let rootInstance: ReturnType<typeof createRoot> | null = null;

	const getRoot = () => {
		if (!rootElement) {
			rootElement = document.createElement('div');
			rootElement.id = 'confirm-dialog-root';
			document.body.appendChild(rootElement);
			rootInstance = createRoot(rootElement);
		}
		return rootInstance;
	};

	return {
		show: (props: ConfirmDialogProps) => {
			const root = getRoot();
			const handleClose = () => {
				root?.render(null);
			};

			root?.render(
				<ConfirmDialog
					{...props}
					onOk={() => {
						if (props.onOk) props.onOk();
						handleClose();
					}}
					onCancel={() => {
						if (props.onCancel) props.onCancel();
						handleClose();
					}}
				/>
			);
		}
	};
})();

interface ConfirmDialogOptions {
	text: string;
	title: string;
	onOk?: () => void;
	onCancel?: () => void;
}

export const openConfirmDialog = (options: ConfirmDialogOptions) => {
	requestAnimationFrame(() => {
		DialogManager.show(options);
	});
};