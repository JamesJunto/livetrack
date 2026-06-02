import { useState,useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import MainContainer from './components/MainContainer'
import {createRoom} from "./services/roomService"

function App() {

  return (
    <MainContainer/>
  )
}

export default App
