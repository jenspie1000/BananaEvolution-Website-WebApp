import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // your global styles (site can import theirs too)
import Shell from "./Shell";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Shell />
    </React.StrictMode>
);
