
import { WALLET_INSTALL, WALLET_CONNECT, WALLET_CONNECTED, WALLET_DENIED} from "../actions/action-types.jsx";


function walletInstall(payload = 0) {
  return {
    type: WALLET_INSTALL,
    payload: payload
  }
}

function walletConnect(payload = 0) {
  return {
    type: WALLET_CONNECT,
    payload: payload
  }
}

function walletConnected(payload = 0) {
  return {
    type: WALLET_CONNECTED,
    payload: payload
  }
}

function walletDenied(payload = 0) {
  return {
    type: WALLET_DENIED,
    payload: payload
  }
}


export {
  walletInstall,
  walletConnect,
  walletDenied,
  walletConnected
}