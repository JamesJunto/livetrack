import { doc, setDoc } from "firebase/firestore";
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

export const joinRoom = async (roomid, location) =>{
     const userId = crypto.randomUUID();

     await setDoc(
        doc(db, "rooms", roomid, "users", userId),
        {
            joinedAt: Date.now(),
            location: location,
        }

    );

     alert("joining room")

     return userid

}