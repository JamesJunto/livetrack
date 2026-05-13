import { useState, useEffect } from "react";

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

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
  }, []);

  return { location, error };
};