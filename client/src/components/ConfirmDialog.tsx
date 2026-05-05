import React, { FC, useCallback } from "react";
import { Modal } from "./Modal";
import { createRoot } from "react-dom/client";
import { useTranslation, I18nextProvider } from "react-i18next";
import i18n from "../i18n";

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
	const { t } = useTranslation();
	const handleOk = useCallback(() => {
		if (onOk) onOk();
	}, [onOk]);

	const handleCancel = useCallback(() => {
		if (onCancel) onCancel();
	}, [onCancel]);

	// pre-line - if text contains \n, create new line
	const bodyElement = <span style={{ whiteSpace: 'pre-line' }}>{text}</span>;
	const footerElement = (
		<div className="buttons">
			<button
				type="button"
				className="btn btn-secondary"
				onClick={handleCancel}
			>
				{t("common.cancel")}
			</button>
			<button
				type="submit"
				onClick={handleOk}
				className="btn btn-success"
			>
				{t("common.confirm")}
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
	let isShowing = false;
	let queue: ConfirmDialogProps[] = [];

	const getRoot = () => {
		if (!rootElement) {
			rootElement = document.createElement('div');
			rootElement.id = 'confirm-dialog-root';
			document.body.appendChild(rootElement);
			rootInstance = createRoot(rootElement);
		}
		return rootInstance;
	};

	const showNext = () => {
		if (queue.length === 0) {
			isShowing = false;
			getRoot()?.render(null);
			return;
		}
		isShowing = true;
		const props = queue.shift()!;
		const root = getRoot();
		const handleClose = () => showNext();

		root?.render(
			<I18nextProvider i18n={i18n}>
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
			</I18nextProvider>
		);
	};

	return {
		show: (props: ConfirmDialogProps) => {
			queue.push(props);
			if (!isShowing) showNext();
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