import type { MDBridge } from './MDBridge'

declare global {
  interface Window {
    MDBridge: MDBridge
  }
}

export {}
