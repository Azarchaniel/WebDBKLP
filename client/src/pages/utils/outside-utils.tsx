import React from "react";
import { Link } from "react-router";
import { FixLanguage } from "./FixLanguage";

// This pages doesn't belong to any specific category, it contains various utility functions and tools.
// It is not supposed to fit the rest of the WebDBKLP structure.
export default function UtilPage() {
    return (
        <div style={{ padding: '20px', color: "black" }}>
            <Link to='/' style={{ textDecoration: 'none', color: 'black', marginBottom: '25px' }}>{"< WebDBKLP"}</Link>
            <h1>Utilities Page</h1>

            <p>This page contains various utility functions and tools that do not fit into the main categories of WebDBKLP.</p>

            <h3>Counter for <b>Kámen, zbraně, papír</b></h3>
            Click to redirect to <Link to='/kzp' style={{ textDecoration: 'none', color: 'blue' }}>Kámen, zbraně, papír counter</Link> - a simple tool to keep track of resources.

            <div style={{ height: "50px" }} />
            <FixLanguage />
        </div>
    )
}
