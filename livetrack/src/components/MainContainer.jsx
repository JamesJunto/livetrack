import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

const MainContainer = () => {

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {

    if (navigator.geolocation) {

      navigator.geolocation.getCurrentPosition(

        (position) => {

          setLocation([
            position.coords.latitude,
            position.coords.longitude
          ]);

        },  

        (err) => {
          setError(err.message);
        },
        {
          enableHighAccuracy: true
        }

      );


    } else {

      setError("Geolocation is not supported by this browser.");

    }

  }, []);


  if (error) {
    return <p>{error}</p>;
  }

  if (!location) {
    return <p>Loading...</p>;
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