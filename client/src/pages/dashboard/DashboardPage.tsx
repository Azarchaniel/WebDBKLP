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
    const [usersCounts, setUsersCounts] = useState<IUserStats[] | any[]>();

    useEffect(() => {
        countBooks()
            .then((result: any) => setCountAllBooks(result.data.count))
            .catch((err: any) => console.error("error counting books FE", err));

        let allusersStats: IUserStats[] = [];

        getUsers()
            .then((result: AxiosResponse<ApiUserDataType>) => {
                const { data } = result;
                data.users.forEach((user: IUser) => {
                    countBooks(user._id)
                        .then((result: AxiosResponse<{message: string, count: number}>) => { 
                            allusersStats.push({ name: user.firstName ?? "", count: result.data.count }) 
                        })
                        .catch((err: any) => console.error("error counting books FE", err));
                });
                setUsersCounts(allusersStats)
                console.log(usersCounts);
            })
            .catch((err: any) => console.error("error fetching users FE", err));
    }, [])

    return (
        <>
            <p style={{ color: "black", marginLeft: "1rem" }}>Počet kníh celkovo: {countAllBooks}</p>
            {usersCounts?.forEach((userStat: IUserStats) => {
                console.log("element",userStat);
            return <p style={{ color: "black", marginLeft: "1rem" }}>{userStat.name}: {userStat.count}</p>
        })}
        </>
    );
}