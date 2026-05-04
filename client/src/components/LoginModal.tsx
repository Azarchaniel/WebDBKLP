import React, { ChangeEvent, useState } from "react";
import { Modal, showError } from "./Modal";
import { toast } from "react-toastify";
import { loginUser, loginGuestUser, logoutUser } from "@utils";
import { useAuth } from "@utils/context";
import { IUser } from "../type";
import { CustomPasswordField } from "./inputs";
import { useTranslation } from "react-i18next";

const LoginModal: React.FC = () => {
    const { t } = useTranslation();
    const { login, isLoggedIn, isGuest, currentUser } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        email: "",
        password: ""
    });
    const [errorKey, setErrorKey] = useState("auth.enterEmail");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getErrMsg = (form: any) => {
        const { email, password } = form;

        const getErrorMessage = (fieldId: string) => {
            return fieldId === "email" ? "auth.enterEmail" : "auth.enterPassword";
        };

        if (!email) {
            setErrorKey(getErrorMessage("email"));
        } else if (!password) {
            setErrorKey(getErrorMessage("password"));
        } else {
            setErrorKey("");
        }
    }

    const updateForm = (event: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = event.target;
        setForm((prevData) => {
            const updatedForm = { ...prevData, [id]: value }; // Compute updated form state
            getErrMsg(updatedForm);
            return updatedForm;
        });
    };

    const sendLogin = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        loginUser(form)
            .then((user: IUser | undefined) => {
                setShowModal(false);
                login(user!);
                toast.success(t("auth.loginSuccess"), { autoClose: 3000 });
            })
            .catch(err => {
                console.error(err.message);
                toast.error(t("auth.loginFailed"));
                setErrorKey("auth.loginFailedRetry");
            })
            .finally(() => setIsSubmitting(false));
    }

    const sendGuestLogin = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        loginGuestUser()
            .then((user: IUser | undefined) => {
                setShowModal(false);
                login(user!);
                toast.info(t("auth.continueAsGuestSuccess"));
            })
            .catch(err => {
                console.error(err.message);
                toast.error(t("auth.loginFailed"));
            })
            .finally(() => setIsSubmitting(false));
    }

    const sendLogout = async () => {
        setShowModal(false);
        await logoutUser();
    }

    return (
        <>
            <div
                className={`${isLoggedIn && currentUser ? "loggedIn" : ""} customLink loginBtn`}
                onClick={() => setShowModal(true)}
                data-tooltip-id="global-tooltip"
                data-tooltip-content={isLoggedIn ? t("auth.logoutTooltip") : t("auth.loginTooltip")}
            >
                {isLoggedIn && currentUser ? (isGuest ? t("auth.guest") : currentUser.firstName) : ""}
                <i className="fa fa-user-circle" />
            </div>
            {showModal && !isLoggedIn &&
                <Modal
                    customKey="login"
                    title={t("auth.loginTitle")}
                    onClose={() => setShowModal(false)}
                    body={<form
                        className="column"
                        style={{ gap: "0.5rem" }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault(); // Prevent default behavior like form submission
                                sendLogin().then(_ => null);
                            }
                        }}
                    >
                        <input type="email" placeholder={t("auth.emailPlaceholder")} className="form-control" id="email"
                            onChange={(e) => updateForm(e)} autoComplete="email"
                        />
                        <CustomPasswordField
                            placeholder={t("auth.passwordPlaceholder")}
                            maskCharacters={["ᛆ", "ᛒ", "ᛍ", "ᛋ", "ᛏ", "ᛁ", "ᚴ", "ᛚ", "ᛘ", "ᚾ", "ᚦ", "ᛓ", "ᛂ", "ᚠ", "ᚢ"]}
                            onPasswordChange={(value: string) =>
                                updateForm({
                                    target: {
                                        id: "password",
                                        value
                                    }
                                } as ChangeEvent<HTMLInputElement>)}
                        />

                    </form>}
                    footer={<div className="column">
                        <div>{showError(errorKey ? t(errorKey) : "")}</div>
                        <div className="buttons">
                            <button type="button" className="btn btn-secondary"
                                onClick={() => sendGuestLogin()}>{t("auth.continueAsGuest")}
                            </button>
                            <button type="button" className="btn btn-secondary"
                                onClick={() => setShowModal(false)}>{t("common.cancel")}
                            </button>
                            <button type="submit"
                                disabled={isSubmitting || Boolean(errorKey?.length)}
                                onClick={() => sendLogin()}
                                className="btn btn-success">{t("auth.login")}
                            </button>
                        </div>
                    </div>}
                    overrideStyle={{ width: "30rem" }}
                />
            }
            {showModal && isLoggedIn &&
                <Modal
                    customKey="logout"
                    title={t("auth.logoutTitle")}
                    onClose={() => setShowModal(false)}
                    body={<p>{t("auth.confirmLogout")}</p>}
                    footer={
                        <div className="buttons">
                            <button type="button" className="btn btn-secondary"
                                onClick={() => setShowModal(false)}>{t("common.cancel")}
                            </button>
                            <button type="submit"
                                onClick={() => sendLogout()}
                                className="btn btn-success">{t("auth.logout")}
                            </button>
                        </div>
                    }
                />
            }
        </>
    )
}

export default LoginModal;