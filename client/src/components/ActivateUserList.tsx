import React from "react";
import {IUser} from "../type";
import {useLocalStorage} from "usehooks-ts";

export const ActivateUserList: React.FC = () => {
    const [ownersString] = useLocalStorage("cachedUsers", "[]")
    const [activeOwners, setActiveOwners] = useLocalStorage("activeUsers", [] as string[]);

    const activateUsers = (id: string) => {
        if (activeOwners.includes(id)) {
            setActiveOwners((prevValue: string[]) => prevValue.filter((aoId: string) => aoId !== id));
        } else {
            setActiveOwners((prevValue: string[]) => [...prevValue, id]);
        }
    }

    let owners: IUser[] = []; // Default to an empty array
    try {
        // Attempt to parse the string from localStorage (or the default '[]')
        // If data is already Object/Array, stringify it
        const parsedData = JSON.parse(JSON.stringify(ownersString));

        if (Array.isArray(parsedData)) {
            owners = parsedData;
        } else {
            console.warn('Parsed data from "cachedUsers" is not an array:', parsedData);
        }
    } catch (error) {
        console.error('Failed to parse "cachedUsers" from localStorage:', error);
        console.error('Invalid data was:', ownersString);
    }

    return (
        <div className="activateUsers">
            {owners.map((owner: IUser) =>
                <span
                    className={activeOwners.includes(owner._id) ? "activeUser customLink" : "customLink"}
                    onClick={() => activateUsers(owner._id)}
                    key={owner._id}
                >
                    {owner.firstName}
                </span>
            )}
        </div>
    )
}