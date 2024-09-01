import React, {useEffect, useState} from "react";
import {getUsers} from "../API";
import {IUser} from "../type";
import {Link} from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";

const Header: React.FC = () => {
    //TODO: redux
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
        <div className="header" style={{userSelect: "none", msUserSelect: "none"}}>
            <h1><Link className='customLink appHeader' to='/'>WebDBKLP</Link></h1>
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
    );
}

export default Header;