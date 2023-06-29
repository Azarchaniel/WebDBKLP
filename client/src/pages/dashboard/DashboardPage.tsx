import { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { countBooks, getUsers } from "../../API";
import { ApiUserDataType, IUser } from "../../type";

interface IUserStats {
    name: string,
    count: number
}

export default function DashboardPage() {
    const [countAllBooks, setCountAllBooks] = useState<number>(0);
    const [usersCounts, setUsersCounts] = useState<IUserStats[]>([]);

    useEffect(() => {
        countBooks()
            .then((result: any) => setCountAllBooks(result.data.count))
            .catch((err: any) => console.error("error counting books FE", err));

        const fetchUsers = async () => {
            return await getUsers();
        }

        fetchUsers()
            .then(response => {
                for (let user of response.data.users) {
                    countBooks(user._id)
                        .then((counted: any) => {
                            console.log(counted.data, usersCounts);
                            setUsersCounts(prevUser => {
                                return [
                                    ...prevUser,
                                    {name: counted.data.owner as string, count: counted.data.count as number}
                                ]
                            });

                        })
                        .catch(err => console.error(err))
                }
            })
            .catch(err => console.error(err));
    }, [])

    return (
        <div style={{ color: "black", marginLeft: "1rem" }}>
            <p>Počet kníh celkovo: {countAllBooks}</p>
            {usersCounts.sort((a,b) => a.name.localeCompare(b.name)).map(usrCnt => <p>{usrCnt.name}: {usrCnt.count}</p>)}
        </div>
    );
}