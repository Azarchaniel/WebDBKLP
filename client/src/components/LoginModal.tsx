import React, {ChangeEvent, useState} from "react";
import {Modal, showError} from "./Modal";

const LoginModal: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        username: "",
        password: ""
    });
    const [error, setError] = useState("Zadaj užívateľské meno!");

    const getErrMsg = (form: any) => {
        const {username, password} = form;

        const getErrorMessage = (fieldId: string) => {
            return fieldId === "username" ? "Zadaj užívateľské meno!" : "Zadaj heslo!";
        };

        if (!username) {
            setError(getErrorMessage("username"));
        } else if (!password) {
            setError(getErrorMessage("password"));
        } else {
            setError("");
        }
    }

    const updateForm = (event: ChangeEvent<HTMLInputElement>) => {
        const {id, value} = event.target;
        setForm((prevData) => {
            const updatedForm = { ...prevData, [id]: value }; // Compute updated form state
            getErrMsg(updatedForm);
            return updatedForm;
        });

    };


    return (
        <>
            <button className="fa fa-user-circle" onClick={() => setShowModal(true)}/>
            {showModal &&
                <Modal
                    customKey={"login"}
                    title="Prihlásenie"
                    onClose={() => setShowModal(false)}
                    body={<div className="column" style={{gap: "0.5rem"}}>
                        <input type="text" placeholder="Meno" className="form-control" id="username"
                               onChange={(e) => updateForm(e)}
                        />
                        <input type="password" placeholder="Heslo" className="form-control" id="password"
                               onChange={(e) => updateForm(e)}
                        />
                    </div>}
                    footer={<div className="column">
                        <div>{showError(error)}</div>
                        <div className="buttons">
                            <button type="button" className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}>Zrušiť
                            </button>
                            <button type="submit"
                                    disabled={Boolean(error?.length)}
                                    onClick={() => console.log("login", form)}
                                    className="btn btn-success">Prihlásiť
                            </button>
                        </div>
                    </div>}
                    overrideStyle={{width: "30rem"}}
                />
            }
        </>
    )
}

export default LoginModal;