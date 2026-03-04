import './App.css'
import { useStore } from './store/Zustand.jsx'

function App() {
  const { statusBackend, setStatusBackend } = useStore()
  return (
    <>
      <h1> {!statusBackend ? 'false' : 'true'}</h1>
      <button type="button" onClick={() => { setStatusBackend(true) }}>true</button>
      <button type="button" onClick={() => { setStatusBackend(false) }}>false</button>
    </>
  )
}

export default App
