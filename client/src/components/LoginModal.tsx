import React, {ChangeEvent, useState} from "react";
import {Modal, showError} from "./Modal";
import {login} from "../API";
import {toast} from "react-toastify";
import {isUserLoggedIn} from "../utils/user";
import {CustomPasswordField, InputField} from "./InputFields";

const LoginModal: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        email: "",
        password: ""
    });
    const [error, setError] = useState("Zadaj užívateľský email!");


    const getErrMsg = (form: any) => {
        const {email, password} = form;

        const getErrorMessage = (fieldId: string) => {
            return fieldId === "email" ? "Zadaj užívateľský email!" : "Zadaj heslo!";
        };

        if (!email) {
            setError(getErrorMessage("email"));
        } else if (!password) {
            setError(getErrorMessage("password"));
        } else {
            setError("");
        }
    }

    const updateForm = (event: ChangeEvent<HTMLInputElement>) => {
        const {id, value} = event.target;
        setForm((prevData) => {
            const updatedForm = {...prevData, [id]: value}; // Compute updated form state
            getErrMsg(updatedForm);
            return updatedForm;
        });
    };

    const sendLogin = async () => {
        try {
            const res = await login(form); // Make the API call (assumes `login` is defined elsewhere)

            if (res.status === 200) {
                setError("");

                // @ts-ignore
                const {token, userId} = res.data;

                // Save token to localStorage or sessionStorage
                localStorage.setItem('token', token);

                // Optionally save the userId (if required elsewhere)
                localStorage.setItem('userId', userId);

                console.info("Login Successful:", res.data);
                window.location.replace("/"); //replace instead of navigate, so there is refresh
                setShowModal(false);
            } else {
                throw new Error('Unexpected response');
            }
        } catch (err: any) {
            console.error("Login Error:", err);

            toast.error("Nepodarilo sa prihlásiť!")
            setError("Prihlásenie sa nepodarilo, skús znova.")
        }
    }

    const sendLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.replace("/");
    }

    return (
        <>
            <button
                className="fa fa-user-circle"
                onClick={() => setShowModal(true)}
                title={isUserLoggedIn() ? "Odhlásiť sa" : "Prihlásiť sa"}
            />
            {showModal && !isUserLoggedIn() &&
                <Modal
                    customKey="login"
                    title="Prihlásenie"
                    onClose={() => setShowModal(false)}
                    body={<form
                            className="column"
                            style={{gap: "0.5rem"}}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault(); // Prevent default behavior like form submission
                                    sendLogin().then(_ => null);
                                }
                            }}
                    >
                        <InputField type="email" placeholder="Email" className="form-control" id="email"
                                    onChange={(e) => updateForm(e)}
                        />
                        <CustomPasswordField
                            placeholder="Heslo"
                            maskCharacters={["ᛆ", "ᛒ", "ᛍ", "ᛋ", "ᛏ", "ᛁ", "ᚴ", "ᛚ", "ᛘ", "ᚾ", "ᚦ", "ᛓ", "ᛂ", "ᚠ", "ᚢ"]}
                            onPasswordChange={(value: string) =>
                                updateForm({
                                    target: {
                                        id: "password",
                                        value
                                    }
                                } as unknown as ChangeEvent<HTMLInputElement>)}
                        />

                    </form>}
                    footer={<div className="column">
                        <div>{showError(error)}</div>
                        <div className="buttons">
                            <button type="button" className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}>Zrušiť
                            </button>
                            <button type="submit"
                                    disabled={Boolean(error?.length)}
                                    onClick={() => sendLogin()}
                                    className="btn btn-success">Prihlásiť
                            </button>
                        </div>
                    </div>}
                    overrideStyle={{width: "30rem"}}
                />
            }
            {showModal && isUserLoggedIn() &&
                <Modal
                    customKey="logout"
                    title="Odhlásenie"
                    body={<span>Skutočne sa chceš odhlásiť?</span>}
                    footer={<form
                        className="column"
                        style={{gap: "0.5rem"}}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault(); // Prevent default behavior like form submission
                                sendLogin().then(_ => null);
                            }
                        }}
                    >
                        <div className="buttons">
                            <button type="button" className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}>Zrušiť
                            </button>
                            <button type="submit"
                                    onClick={() => sendLogout()}
                                    className="btn btn-success">Odhlásiť
                            </button>
                        </div>
                    </form>}
                    overrideStyle={{width: "25rem"}}
                />
            }
        </>
    )
}

export default LoginModal;