import {
	BtnBold,
	BtnItalic,
	BtnRedo,
	BtnUndo,
	Editor, EditorProps,
	EditorProvider,
	Separator,
	Toolbar
} from "react-simple-wysiwyg";
import React, {useEffect} from "react";

interface Props extends EditorProps {
    style?: React.CSSProperties;
	hideToolbar?: boolean;
	customerror?: string;
	id?: string;
}

export const Wysiwyg: React.FC<Props> = props => {
	useEffect(() => {
		const inputElement: any = document.getElementById(`${props.id}`);
		if (inputElement) {
			if (props.customerror) {
				inputElement.style.border = "2px dotted red";
				inputElement.style.borderBottomRightRadius = "4px";
				inputElement.style.borderBottomLefttRadius = "4px";
			} else {
				inputElement.style.border = "none";
			}}

	}, [props.customerror]);


	return (
		<EditorProvider>
			<Editor {...props}>
				{!props.hideToolbar && <Toolbar>
					<BtnUndo />
					<BtnRedo />
					<Separator />
					<BtnBold />
					<BtnItalic />
				</Toolbar>}
			</Editor>
		</EditorProvider>
	)
}