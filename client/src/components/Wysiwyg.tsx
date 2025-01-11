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
import React from "react";

interface Props extends EditorProps {
    style?: React.CSSProperties;
	hideToolbar?: boolean;
}

export const Wysiwyg: React.FC<Props> = props => {

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