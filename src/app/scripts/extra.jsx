
import Web3 from "web3";

import {
	walletInstall,
	walletDenied,
	walletConnect,
	walletConnected,
} from "../actions/walletActions.jsx"

const loadWeb3 = function() {
	if (window.ethereum) {
		window.web3 = new Web3(window.ethereum);
	    window.ethereum.enable().then(
	    	()=>{ window.store.dispatch(walletConnected()) },
	    	()=>{ window.store.dispatch(walletDenied()) }
	   	)
	    window.ethereum.on('accountsChanged', function (accounts)  {
	    	window.store.dispatch(walletConnect())
	   	})

	    window.ethereum.on('networkChanged', function(accounts) {
	    	window.store.dispatch(walletConnect())
	    })
	}
	else if (window.web3) {
		try{
			window.web3 = new Web3(window.web3.currentProvider);
			window.store.dispatch(walletConnected())
		} 
		catch(error) {
			store.dispatch(walletDenied())
		}
	}
	else {
		window.store.dispatch(walletDenied())
	}
}

export {
	loadWeb3,
}