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

export const createNewAutor = async (
    name: string,
    role?: string,
    setFormData?: (callback: (prevData: any) => any) => void,
    formDataParamName?: string,
): Promise<any> => {
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

    try {
        const res = await addAutor([{ firstName, lastName, role: [{ value: role }] }]);
        if (res.status === 201 && res.data?.autor?._id) {
            toast.success("Autor úspešne vytvorený");
            if (setFormData) {
                setFormData((prevData: any) => {
                    // Check if prevData is an array (BookModal) or object (other forms)
                    if (Array.isArray(prevData)) {
                        // Handle array case (like in BookModal)
                        // For arrays, we need to update specific fields based on role
                        const updatedArray = prevData.map(item => {
                            const roleField = role || "autor";
                            const fieldToUpdate = formDataParamName || roleField;

                            // Create a new object with the updated field
                            return {
                                ...item,
                                [fieldToUpdate]: [...(item[fieldToUpdate] || []), res.data?.autor]
                            };
                        });

                        return updatedArray;
                    } else {
                        // Handle object case (original behavior)
                        let currentRole;
                        if (formDataParamName) {
                            currentRole = formDataParamName;
                        } else {
                            currentRole = role || "autor";
                        }

                        const currentRoleData = prevData?.[currentRole];

                        // Check if currentRole exists in prevData
                        if (!prevData || !prevData.hasOwnProperty(currentRole)) {
                            return {
                                ...prevData,
                                [currentRole]: [res.data?.autor],
                            };
                        }

                        return {
                            ...prevData,
                            [currentRole]: [...(currentRoleData ?? []), res.data?.autor],
                        };
                    }
                });
            }
            return res.data.autor;
        } else {
            throw new Error();
        }
    } catch (err) {
        toast.error("Autora sa nepodarilo vytvoriť!");
        console.error(err);
        return undefined;
    }
};
