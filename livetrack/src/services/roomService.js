import {  setDoc ,runTransaction, doc, collection} from "firebase/firestore";
import { db } from "../firebaseConfig";

export const createRoom = async (location) => {
    const roomid = crypto.randomUUID();
    const userid = crypto.randomUUID();

    if (!location) {
        console.log("No location yet");
        return null;
    }

    await setDoc(
        doc(db, "rooms", roomid, "users", userid),
        {
            createdAt: Date.now(),
            location: location
        }
    );

    return roomid;
};


export const joinRoom = async (roomid, location) => {
  const userId = crypto.randomUUID();
  const roomsRef = doc(db, "rooms", roomid);
  const usersRef = collection(db, "rooms", roomid, "users")

  await runTransaction(db, async (transaction) => {

    const roomSnap = await transaction.get(roomsRef);

    if (roomSnap.size >= 2) {
      throw new Error("Room is full");
    }

    const userRef = doc(usersRef, userId);

    transaction.set(userRef, {
      joinedAt: Date.now(),
      location: location,
    });
  });

  return userId;
};