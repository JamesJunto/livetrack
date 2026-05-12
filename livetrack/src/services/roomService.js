import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const createRoom = async (location) => {
    const roomid = crypto.randomUUID();

    if (!location) {
        console.log("No location yet");
        return null;
    }

    await setDoc(
        doc(db, "rooms", roomid, "users", "user1"),
        {
            name: "Example",
            createdAt: Date.now(),
            location: location
        }
    );

    return roomid;
};