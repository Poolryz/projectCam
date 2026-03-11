import { useEffect, useState } from 'react'
import './App.css'
import { useStore } from './store/Zustand.jsx'
import axios from 'axios'
import VideoStream from './components/VideoStream/VideoStream.jsx'

function App() {
  const { statusBackend, setStatusBackend } = useStore()
  const [appState, setAppState] = useState()
  useEffect(
    () => {
      const apiUrl = "http://localhost:8000/status"
      axios.get(apiUrl).then((resp) => {
        const allData = resp.data
        setAppState(allData)
      })
    }, [setAppState]
  )
  console.log(appState)
  return (
    <>
      <VideoStream />
      <h1> {!statusBackend ? 'false' : 'true'}</h1>
      <button type="button" onClick={() => { setStatusBackend(true) }}>true</button>
      <button type="button" onClick={() => { setStatusBackend(false) }}>false</button>
    </>
  )
}

export default App
