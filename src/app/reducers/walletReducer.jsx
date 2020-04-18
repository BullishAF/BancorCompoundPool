
import { WALLET_INSTALL, WALLET_CONNECT, WALLET_CONNECTED, WALLET_DENIED} from "../actions/action-types.jsx";

const initialState = {
	installWallet: false,
	isConnected: false,
	isConnecting: false,
	isDenied: false,
	isNetworkIncorrect: false,
	networkVersion: NaN,
	userAddress: "",
};

function walletReducer(state = initialState, action) {

	switch(action.type) {
		case WALLET_INSTALL:{
			return Object.assign({}, state, {
				installWallet: true,
				isConnected: false,
				isConnecting: false,
				isNetworkIncorrect: false,
				networkVersion: NaN,
				userAddress: "",
	      	})
			
		}
    	case WALLET_CONNECT: {
	      	return Object.assign({}, state, {
				installWallet: false,
				isConnected: false,
				isConnecting: true,
				isNetworkIncorrect: false,
				isDenied: false,
				networkVersion: NaN,
				userAddress: "",
	      	})
    	}
    	case WALLET_CONNECTED: {
    		let networkIncorrect = true;
    		if(window.web3.currentProvider.networkVersion == 3) networkIncorrect= false;
    		return Object.assign({}, state, {
				installWallet: false,
				isConnected: true,
				isConnecting: false,
				isNetworkIncorrect: networkIncorrect,
				isDenied: false,
				networkVersion: window.web3.currentProvider.networkVersion,
				userAddress: window.web3.currentProvider.selectedAddress,
	      	})

	    }
	    case WALLET_DENIED: {
	    	return Object.assign({}, state, {
				installWallet: false,
				isConnected: false,
				isConnecting: false,
				isNetworkIncorrect: false,
				isDenied: true,
				networkVersion: NaN,
				userAddress: "",
	      	})
	    }   
	  	default:
	      return state;
  }
}

export default walletReducer;
