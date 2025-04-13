import React from "react";
import { IUser } from "../type";
import { useLocalStorage } from "usehooks-ts";

export const ActivateUserList: React.FC = () => {
    const [owners] = useLocalStorage<IUser[]>("cachedUsers", []);
    const [activeOwners, setActiveOwners] = useLocalStorage<string[]>("activeUsers", []);

    const activateUsers = (id: string) => {
        if (activeOwners.includes(id)) {
            setActiveOwners((prevValue) => prevValue.filter((aoId) => aoId !== id));
        } else {
            setActiveOwners((prevValue) => [...prevValue, id]);
        }
    };

    if (!Array.isArray(owners)) {
        console.error('"cachedUsers" from localStorage was not parsed as an array. Value received:', owners);
        return <div className="activateUsers error">Error loading user list.</div>;
    }

    return (
        <div className="activateUsers">
            {owners.map((owner: IUser) => (
                owner?._id ? (
                    <span
                        className={activeOwners.includes(owner._id) ? "activeUser customLink" : "customLink"}
                        onClick={() => activateUsers(owner._id)}
                        key={owner._id}
                    >
                        {owner.firstName}
                    </span>
                ) : null
            ))}
            {owners.length === 0 && <span style={{ color: "lightgrey", fontStyle: "italic" }}>Žiadny užívatelia nenájdení.</span>}
        </div>
    );
};