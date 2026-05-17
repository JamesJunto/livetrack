import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useLocation } from '../hooks/useLocation';
import { createRoom, joinRoom } from '../services/roomService';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from "firebase/firestore"
import { db } from '../firebaseConfig';
import { Icon } from 'leaflet';
import locationPing from "../img/location-pin.png";
import locationPinOther from "../img/location-pin-other.png";

const MainContainer = () => {
  const { location, error } = useLocation();
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null)
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  let isMe = false
  useEffect(() => {
    if (!joinRoomId && !roomId) return;
    const activeRoom = joinRoomId || roomId;

    const unsub = onSnapshot(
      collection(db, "rooms", activeRoom, "users"),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(data);
      }
    );

    return () => unsub();
  }, [roomId, joinRoomId]);

  useEffect(() => {
    let id = localStorage.getItem("userId")

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("userId", id);
    }

    setUserId(id);
  }, [])


  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const id = await createRoom(location, userId);
      setRoomId(id);
      setActiveTab('create');
    } catch (err) {
      alert("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (id) => {
    if (!id.trim()) {
      alert("Please enter a room ID");
      return;
    }

    if (users.length >= 2) {
      alert("Max user")
      return
    }

    setIsJoining(true);

    try {
      await joinRoom(id, location,userId);
      setJoinRoomId(id);
    } catch (err) {
      console.log(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const myIcon = new Icon({
    iconUrl: locationPing,
    iconSize: [24, 24]
  });

  const otherIcon = new Icon({
    iconUrl: locationPinOther,
    iconSize: [24, 24]
  })

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Location Error</h2>
          <p className="text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping"></div>
            <div className="relative w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acquiring Location...</h2>
          <p className="text-slate-400">Please allow location access to continue</p>
        </div>
      </div>
    );
  }

  const isInRoom = roomId || joinRoomId;
  const activeRoomId = roomId || joinRoomId;

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 overflow-hidden">

      {/* GLASSMORPHISM HEADER */}
      <header className="relative z-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-4">

            {/* BRANDING */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Live Tracking
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Real-time location sharing
                </p>
              </div>
            </div>

            {/* ROOM CONTROLS */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

              {/* TAB SWITCHER */}
              <div className="flex p-1 bg-slate-800/80 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'create'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  Create Room
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'join'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  Join Room
                </button>
              </div>

              {/* ACTION AREA */}
              <div className="flex gap-2">
                {activeTab === 'create' ? (
                  <>
                    <button
                      onClick={handleCreateRoom}
                      disabled={isCreating || roomId}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {isCreating ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      {roomId ? 'Created' : 'Create Link'}
                    </button>

                    <div className="relative group">
                      <input
                        type="text"
                        value={roomId}
                        readOnly
                        placeholder="Room ID appears here"
                        className="bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 px-4 py-2.5 rounded-xl w-48 sm:w-56 text-sm font-mono focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                      {roomId && (
                        <button
                          onClick={copyToClipboard}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-700/80 hover:bg-blue-600 text-slate-400 hover:text-white transition-all duration-200"
                          title="Copy to clipboard"
                        >
                          {copied ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative flex-1 sm:flex-none">
                      <input
                        type="text"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                        placeholder="Enter room ID..."
                        className="bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 px-4 py-2.5 rounded-xl w-full sm:w-56 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => handleJoinRoom(joinRoomId)}
                      disabled={isJoining || !joinRoomId.trim()}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {isJoining ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                      Join
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ROOM STATUS BAR */}
          {isInRoom && (
            <div className="flex items-center gap-4 pb-3 border-t border-white/5 pt-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Live</span>
              </div>
              <div className="h-4 w-px bg-white/10"></div>
              <span className="text-xs text-slate-400 font-mono">
                Room: <span className="text-slate-200">{activeRoomId}</span>
              </span>
              <div className="h-4 w-px bg-white/10"></div>
              <span className="text-xs text-slate-400">
                <span className="text-white font-semibold">{users.length}</span> active user{users.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* MAP CONTAINER */}
      <main className="flex-1 relative">
        <MapContainer
          center={location}
          zoom={15}
          className="h-full w-full z-10"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* CUSTOM USER MARKERS */}
          {users.map((user) => {
            const isMe = user.id === userId;

            return (
              <Marker
                key={user.id}
                position={user.location}
                icon={isMe ? myIcon : otherIcon}
              />
            );
          })}
        </MapContainer>

        <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-mono text-slate-300">
            {location[0].toFixed(4)}, {location[1].toFixed(4)}
          </span>
        </div>
      </main>
    </div>
  );
};

export default MainContainer;