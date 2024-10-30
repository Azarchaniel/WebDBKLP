import React, {useState} from "react";
import {Switch} from "@material-ui/core";

const ToggleButton: React.FC<{labelLeft: string; labelRight: string, state: () => void}> =
    ({labelLeft, labelRight, state}) => {
    const [on, setOn] = useState(false);

    return (
        <div style={{color: 'black'}}>
            <span style={on ? {} : {fontWeight: 'bold'}}>{labelLeft}</span>
                <Switch
                    checked={on}
                    onChange={() => {setOn(!on); state()}}
                />
             <span style={on ? {fontWeight: 'bold'} : {}}>{labelRight}</span>
        </div>
    );
}

export default ToggleButton;