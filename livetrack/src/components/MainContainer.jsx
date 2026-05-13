import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useLocation } from '../hooks/useLocation';
import { createRoom, joinRoom } from '../services/roomService';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from "firebase/firestore"
import { db } from '../firebaseConfig';

const MainContainer = () => {
  const { location, error } = useLocation();
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [users, setUsers] = useState([])

  useEffect(() => {

    if (!joinRoomId && !roomId) return

    const activeRoom = joinRoomId || roomId

    const unsub = onSnapshot(
      collection(db, "rooms", activeRoom, "users"),
      (snapshot) => {

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setUsers(data)
      }
    )

    return () => unsub()

  }, [roomId, joinRoomId])

  if (error) {
    return <p>{error}</p>;
  }

  if (!location) {
    return <p>Loading...</p>;
  }

  const handleCreateRoom = async () => {
    const id = await createRoom(location);

    setRoomId(id);
  };

  const handleJoinRoom = async (joinRoomId) => {
    if (!joinRoomId) {
      alert("no room id")
      return;
    }

    await joinRoom(joinRoomId, location)
  };

  return (
    <div className="h-screen w-full flex flex-col">

      {/* TOP BAR */}
      <div className="w-full p-4 bg-white shadow flex items-center justify-between">

        <div>
          <h1 className="text-xl font-bold">
            Live Tracking
          </h1>

          <p className="text-sm text-gray-500">
            Share your live location instantly
          </p>
        </div>

        <div className="flex flex-col gap-3">

          {/* CREATE ROOM */}
          <div className="flex gap-2">

            <button
              onClick={handleCreateRoom}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Create Link
            </button>

            <input
              type="text"
              value={roomId}
              readOnly
              placeholder="Room link/id"
              className="border px-3 py-2 rounded w-64"
            />

          </div>

          {/* JOIN ROOM */}
          <div className="flex gap-2">

            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Enter room link/id"
              className="border px-3 py-2 rounded w-64"
            />

            <button
              onClick={() => handleJoinRoom(joinRoomId)}
              className="bg-gray-800 text-white px-4 py-2 rounded"
            >
              Join Link
            </button>

          </div>

        </div>
      </div>

      {/* MAP */}
      <div className="flex-1">

        <MapContainer
          center={location}
          zoom={13}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {users.map(user => (
            <Marker
              key={user.id}
              position={user.location}
            />
          ))}

        </MapContainer>

      </div>

    </div>
  );
};

export default MainContainer;