import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
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
  const [userId, setUserId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tileUrl, setTileUrl] = useState(
    "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
  );

  useEffect(() => {
    if (!joinRoomId && !roomId) return;
    const activeRoom = joinRoomId || roomId;

    const unsub = onSnapshot(collection(db, "rooms", activeRoom, "users"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(data);
    });

    return () => unsub();
  }, [roomId, joinRoomId]);

  useEffect(() => {
    let id = localStorage.getItem("userId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("userId", id);
    }
    setUserId(id);
  }, []);

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
      alert("Max user");
      return;
    }
    setIsJoining(true);
    try {
      await joinRoom(id, location, userId);
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

  const myIcon = new Icon({ iconUrl: locationPing, iconSize: [34, 34] });
  const otherIcon = new Icon({ iconUrl: locationPinOther, iconSize: [34, 34] });
  const pointList = users.map(user => user.location);

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
    <div className="h-screen w-full relative overflow-hidden bg-gray-100">

      {/* ─── MAP (full bleed background) ─── */}
      <main className="absolute inset-0 z-0">
        <MapContainer
          center={[12.8797, 121.7740]}
          zoom={6}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url={tileUrl}
            eventHandlers={{
              tileerror: () => {
                setTileUrl("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
              },
            }}
          />
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
          <Polyline positions={pointList} pathOptions={{ color: "red", weight: 4, opacity: 0.5 }} />
        </MapContainer>
      </main>

      {/* ─── COORDINATES PILL (bottom-left on desktop, bottom-center on mobile) ─── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:left-6 lg:translate-x-0 z-[1000] bg-white/90 backdrop-blur-md border border-gray-200 rounded-full px-4 py-2 shadow-lg flex items-center gap-2 pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        <span className="text-xs font-mono text-gray-600">
          {location[0].toFixed(4)}, {location[1].toFixed(4)}
        </span>
      </div>

      {/* ─── MOBILE TOGGLE (top-right) ─── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 right-4 z-[60] lg:hidden w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* ─── MOBILE OVERLAY ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── FLOATING SIDEBAR (right side) ─── */}
      <aside className={`
        fixed top-2 bottom-2 right-2 z-50 w-72
        bg-white/95 backdrop-blur-xl
        rounded-2xl shadow-2xl shadow-black/15
        border border-white/80
        flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'}
        lg:translate-x-0
      `}>

        {/* ─── HEADER ─── */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100/80">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 leading-tight truncate">Live Tracking</h1>
              <p className="text-xs text-gray-400 font-medium truncate">Real-time location sharing</p>
            </div>
            {/* Close button — mobile only */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ─── SCROLLABLE CONTENT ─── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">

          {/* TAB SWITCHER */}
          <div className="flex p-1 bg-gray-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === 'join'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Join Room
            </button>
          </div>

          {/* ACTION AREA */}
          <div className="space-y-2.5">
            {activeTab === 'create' ? (
              <>
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating || !!roomId}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
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
                  {roomId ? 'Room Created' : isCreating ? 'Creating…' : 'Create Room'}
                </button>

                {roomId && (
                  <div className="relative">
                    <input
                      type="text"
                      value={roomId}
                      readOnly
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-2.5 pr-10 rounded-2xl text-xs font-mono focus:outline-none focus:border-blue-400 transition-colors"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-white border border-gray-200 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all duration-200 shadow-sm"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Enter room ID..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 px-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
                <button
                  onClick={() => handleJoinRoom(joinRoomId)}
                  disabled={isJoining || !joinRoomId.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
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
                  {isJoining ? 'Joining…' : 'Join Room'}
                </button>
              </>
            )}
          </div>

          {/* ROOM STATUS */}
          {isInRoom && (
            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 space-y-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Live</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                  <span className="font-medium">Room:</span>
                  <span className="font-mono text-gray-800 bg-white px-2 py-0.5 rounded-lg border border-gray-200 truncate max-w-[140px]">{activeRoomId}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium">Users:</span>
                  <span className="text-gray-800 font-semibold">{users.length}</span>
                  <span className="text-gray-400">active</span>
                </div>
              </div>
            </div>
          )}

          {/* USERS LIST */}
          {users.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-0.5">Active Users</h3>
              <div className="space-y-1.5">
                {users.map((user) => {
                  const isCurrentUser = user.id === userId;
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all ${isCurrentUser
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCurrentUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isCurrentUser ? 'ME' : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {isCurrentUser ? 'You' : 'User'}
                        </p>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {user.location[0].toFixed(4)}, {user.location[1].toFixed(4)}
                        </p>
                      </div>
                      {isCurrentUser && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          You
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-3.5 border border-blue-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Your Location</span>
            </div>
            <p className="text-xs font-mono text-gray-700 break-all">
              {location[0].toFixed(6)}, {location[1].toFixed(6)}
            </p>
          </div>

        </div>

        {/* ─── FOOTER ─── */}
        <div className="px-5 py-3 border-t border-gray-100/80">
          <p className="text-xs text-gray-400 text-center">Live Tracking v1.0</p>
        </div>
      </aside>

    </div>
  );
};

export default MainContainer;