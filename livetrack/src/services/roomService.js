import {doc,setDoc} from "firebase/firestore"
import { db } from "../firebaseConfig"
import { useLocation } from "../hooks/useLocation";

export const createRoom = async (location) => {

  await setDoc(doc(db, "rooms", "room123", "users", "user1"), {
    name: "Example",
    createdAt: Date.now(),
    location: location
  });

  console.log("Saved!");    
};  


