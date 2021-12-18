import {IBook} from "../../type";
import React from "react";

type Props = {
    data: Partial<IBook>
}

const BookDetail: React.FC<Props> = ({data}) => {
    return (<>
        <div className="row BookDetail">
            <div className="col">
                {data.picture ? <img src={data.picture} alt='titulka'/> :
                    <img src="img/no_thumbnail.svg" alt="no_thumbnail"/>}
            </div>
            <div className="col">
                <pre>{JSON.stringify(data, undefined, 3)}</pre>
            </div>
            <div className="col"></div>
        </div>
    </>)
}

export default BookDetail;