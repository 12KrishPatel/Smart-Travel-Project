import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import {useState} from "react";
import { point } from "leaflet";

const MapPage = () => {
    const [position, setPosition] = useState([43.0731, -89.4012]) //Default for Madison, WI for now

    return (
        <div style = {{ height: "100vh", width: "100%" }}>
            <MapContainer center = {position} zoom = {12} style = {{height:"100%", width: "100%"}}>
                <TileLayer
                url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'>
                </TileLayer>
                <Marker position = {position}>
                    <Popup> You are here</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapPage;
