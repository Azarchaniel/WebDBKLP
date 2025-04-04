import React, {useEffect, useState} from "react";
import {IUser} from "../type";
import {useLocalStorage} from "usehooks-ts";
import {getUsers} from "../API";

export const ActivateUserList: React.FC = () => {
    const [owners, setOwners] = useState<IUser[]>();
    const [activeOwners, setActiveOwners] = useLocalStorage("activeUsers", [] as string[]);

    useEffect(() => {
        getUsers()
            .then(({data: {users}}: any) => {
                setOwners(users)
            })
            .catch((err: Error) => console.trace(err))
    }, []);

    const activateUsers = (id: string) => {
        if (activeOwners.includes(id)) {
            setActiveOwners((prevValue: string[]) => prevValue.filter((aoId: string) => aoId !== id));
        } else {
            setActiveOwners((prevValue: string[]) => [...prevValue, id]);
        }
    }

    return (
        <div className="activateUsers">
            {owners?.map((owner: IUser) =>
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