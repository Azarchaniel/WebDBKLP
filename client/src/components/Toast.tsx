import React from "react";
import {Slide, ToastContainer} from "react-toastify";

const Toast: React.FC = () => {
	return (
		<ToastContainer
			position="bottom-center"
			autoClose={3000}
			transition={Slide}
			hideProgressBar={false}
			newestOnTop={false}
			closeOnClick
			rtl={false}
			pauseOnFocusLoss
			draggable
			pauseOnHover
		/>
	);
}

export default Toast;
