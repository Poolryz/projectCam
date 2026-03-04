import { create } from "zustand";
const useStore = create((set) => ({
  statusBackend: false,
  videoUrl: '',
  statusLamp: false,
  statusWebSocket: false,
  setStatusBackend: (param) => set({
    statusBackend: Boolean(param)
  })
}))
export { useStore }
