import { useEffect, useState } from "react";
import { countBooks } from "../../API";
import 'chart.js/auto'; //for react-chart
import { Pie } from 'react-chartjs-2';

export default function DashboardPage() {
    const [countAllBooks, setCountAllBooks] = useState<{owner: {id: string, firstName: string, lastName: string} | null, count: number}[]>([]);
    
    useEffect(() => {
        countBooks()
            .then((result: any) => setCountAllBooks(result.data))
            .catch((err: any) => console.error("error counting books FE", err));
    }, [])

    const renderUserCount = () => {
        if (!countAllBooks) return <p>Loading...</p>
        
        // Check if countAllBooks is an object
        if (typeof countAllBooks === 'object' && !Array.isArray(countAllBooks)) {
            // If it's an object, convert it to an array of entries
            return Object.entries(countAllBooks).map(([ownerId, bookCount]) => (
                <p key={ownerId}>{`${ownerId}: ${bookCount}`}</p>
            ))
        }
        
        // If it's already an array, use the previous logic
        return countAllBooks.map(c => {
            if (c.owner && !c.owner?.lastName) {
                return <p key={Math.random()}>{`Bez majiteľa: ${c.count}`}</p>
            } else if (c.owner) {
                return <p key={c.owner?.id}>{`${c.owner?.firstName}: ${c.count}`}</p> 
            } //if it doesnt have owner, it is catch by find in HTML below
            return null;
        })
    }

    const data = {
        labels: countAllBooks.length ? countAllBooks.filter(c => c.owner).map(c => c.owner?.firstName || "Bez majiteľa") : [],
        datasets: [{
          label: 'Počet kníh',
          data: countAllBooks.filter(c => c.owner).map(c => c.count),
          backgroundColor: [
             'white', 'lightpurple', 'black', 'gray', 'red', 'pink'
          ],
          hoverOffset: 4
        }]
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'left' as const
            }
        }
    }

    return (
        <div style={{ color: "black", marginLeft: "1rem", display: "flex", flexDirection: "row" }}>
            <div style={{display: "flex", flexDirection: "column", width: "35%"}}>
                <p>Počet kníh celkovo: {countAllBooks.find(bc => !bc.owner)?.count}</p>
                {renderUserCount()}
            </div>
            
            <div style={{width: "30rem", height: "30rem"}}>
                <Pie data={data} options={chartOptions}/>
            </div>
        </div>
    );
}