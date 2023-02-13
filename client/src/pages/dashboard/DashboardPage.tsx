import { useEffect, useState } from "react";
import { countBooks } from "../../API";

export default function DashboardPage() {
    const [countAllBooks, setCountAllBooks] = useState<number>(0);
    const [countLubosBooks, setCountLubosBooks] = useState<number>(0);

    useEffect(() => {
        console.log("dashboard effect");
        countBooks()
            .then((result: any) => setCountAllBooks(result.data.count))
            .catch((err: any) => console.error("error counting books FE",err));
            
        countBooks("619800d46aba58b905cc2455")
            .then((result: any) => setCountLubosBooks(result.data.count))
            .catch((err: any) => console.error("error counting books FE",err));
    },[])

    return (
        <>
            <p style={{color: "black", marginLeft: "1rem"}}>Počet kníh celkovo: {countAllBooks}</p>
            <p style={{color: "black", marginLeft: "1rem"}}>Lubos: {countLubosBooks}</p>
        </>
    );
}