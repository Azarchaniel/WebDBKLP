import { addAutor } from "../API";
import { toast } from "react-toastify";

//cannot be in types.d.ts
export enum AutorRole {
    AUTOR = "autor",
    EDITOR = "editor",
    ILUSTRATOR = "ilustrator",
    TRANSLATOR = "translator",
    MUSICIAN = "musician",
    BOARDGAME_AUTOR = "boardGameAutor",
}

export const createNewAutor = (
    name: string,
    role?: string,
    setFormData?: (callback: (prevData: any) => any) => void,
    formDataParamName?: string,
) => {
    let firstName, lastName;

    if (name.includes(",")) {
        const names = name.split(",");
        firstName = names[1].trim();
        lastName = names[0].trim();
    } else if (name.includes(" ")) {
        const names = name.split(" ");
        firstName = names[0].trim();
        lastName = names[1].trim();
    } else {
        // assume it's only one name
        firstName = undefined;
        lastName = name.trim();
    }

    addAutor({ firstName, lastName, role: [{ value: role }] })
        .then((res) => {
            if (res.status === 201 && res.data?.autor?._id) {
                toast.success("Autor úspešne vytvorený");

                if (setFormData) {
                    setFormData((prevData: any) => {
                        let currentRole;
                        if (formDataParamName) {
                            currentRole = formDataParamName;
                        } else {
                            currentRole = role || "autor";
                        }

                        const currentRoleData = prevData[currentRole];

                        // Check if currentRole exists in prevData
                        if (!prevData.hasOwnProperty(currentRole)) {
                            return {
                                ...prevData,
                                [currentRole]: [res.data?.autor],
                            };
                        }

                        return {
                            ...prevData,
                            [currentRole]: [...(currentRoleData ?? []), res.data?.autor],
                        };
                    });
                }
            } else {
                throw Error();
            }
        })
        .catch((err) => {
            toast.error("Autora sa nepodarilo vytvoriť!");
            console.error(err);
        });
};
