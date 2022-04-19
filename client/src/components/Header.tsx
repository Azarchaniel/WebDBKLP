import React, {useEffect, useState} from "react";
import {getUsers} from "../API";
import {IUser} from "../type";
import {Link} from "react-router-dom";

const Header: React.FC = () => {
    //TODO: redux
    const [owners, setOwners] = useState<IUser[]>();
    const [activeOwners, setActiveOwners] = useState<string[]>([]);

    useEffect(() => {
        getUsers()
            .then(({data: {users}}: any) => {
                setOwners(users)
            })
            .catch((err: Error) => console.trace(err))
    }, []);

    const activateUsers = (id: string) => {
        if (activeOwners.includes(id)) {
            setActiveOwners(activeOwners.filter(u => u !== id));
        } else {
            setActiveOwners(Array.from(new Set([...activeOwners, id])));
        }
    }

    return (
        <div className="header" style={{userSelect: "none", msUserSelect: "none"}}>
            <h1><Link className='customLink appHeader' to='/'>WebDBKLP</Link></h1>
            {owners?.map((owner: IUser) =>
                <span
                    className={activeOwners.includes(owner._id) ? "activeUser" : ""}
                    onClick={() => activateUsers(owner._id)}
                    key={owner._id}
                >
                    {owner.firstName}
                </span>
            )}
        </div>
    );
}

export default Header;