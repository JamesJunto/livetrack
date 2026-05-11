    import { MapContainer, TileLayer, Marker } from 'react-leaflet';
    import 'leaflet/dist/leaflet.css';
    import { useLocation } from '../hooks/useLocation';
    import { createRoom } from '../services/roomService';

    const MainContainer = () => {
    const { location, error } = useLocation();

      if (error) {
        return <p>{error}</p>;
      }

      if (!location) {
        return <p>Loading...</p>;
      }else{
        createRoom(location)
      }

      return (
        <div className="h-screen w-full">

          <MapContainer
            center={location}
            zoom={13}
            className="h-full w-full"
          >

            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

              <Marker position={location}/>

          </MapContainer>

        </div>
      );

    }

    export default MainContainer;