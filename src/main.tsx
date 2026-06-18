import ReactDOM from "react-dom/client";
import App from "./App";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./index.css";

// NOTE: intentionally not wrapped in <React.StrictMode>. StrictMode double-mounts
// in development, which conflicts with Leaflet's map initialisation.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />,
);
