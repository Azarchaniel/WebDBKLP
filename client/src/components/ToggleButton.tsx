import React, {useState} from "react";
import {Grid, Switch} from "@material-ui/core";

const ToggleButton: React.FC<{labelLeft: string; labelRight: string, state: () => void}> =
    ({labelLeft, labelRight, state}) => {
    const [on, setOn] = useState(false);

    return (
        <div>
            <Grid component="label" container alignItems="center" spacing={1}>
                <Grid item style={{color: "black", fontWeight: !on ? "bold" : "normal"}}>{labelLeft}</Grid>
                <Grid item>
                    <Switch
                        checked={on}
                        onChange={() => {setOn(!on); state()}}
                    />
                </Grid>
                <Grid item style={{color: "black", fontWeight: on ? "bold" : "normal"}}>{labelRight}</Grid>
            </Grid>
        </div>
    );
}

export default ToggleButton;