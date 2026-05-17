import { doc, collection, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";


export const createRoom = async (location, userId) => {

  const roomId = crypto.randomUUID();

    if (!location) {
        console.log("No location yet");
        return null;
    }

    await setDoc(
        doc(db, "rooms", roomId, "users", userId),
        {
            createdAt: Date.now(),
            location: location
        }
    );

    return roomId;
};

export const joinRoom = async (roomid, location, userId) => {
  const usersRef = collection(db, "rooms", roomid, "users");
  const snapshot = await getDocs(usersRef);

  if (snapshot.size >= 2) {
    throw new Error("Room is full");
  }

  await setDoc(doc(usersRef, userId), {
      joinedAt: Date.now(),
      location: location,
  });

  return userId;
};