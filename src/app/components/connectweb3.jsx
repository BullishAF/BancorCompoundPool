

import React from "react";
import { render } from "react-dom";
import { connect } from "react-redux";
import { walletInstall, walletConnect, walletDenied, walletConnected } from "../actions/walletActions.jsx";
import Web3 from "web3";

class MConnectWeb3 extends React.Component {

	constructor(props) {
	    super(props);
    	this.loadWeb3 = this.loadWeb3.bind(this);
    }

    componentDidMount() {
        if(!this.props.walletReducer.isConnecting && !this.props.walletReducer.isDenied) this.loadWeb3()
    }


    loadWeb3() {
        self = this;
        this.props.walletConnect();
        if (window.ethereum) {
            window.ethereum.autoRefreshOnNetworkChange = false;
            window.web3 = new Web3(window.ethereum);
            window.ethereum.enable().then(
                ()=>{ self.props.walletConnected() },
                ()=>{ self.props.walletDenied() }
            )
            window.ethereum.on('accountsChanged', function (accounts)  {
                if(!self.props.walletReducer.isConnecting) self.loadWeb3();
            })

            window.ethereum.on('networkChanged', function(accounts) {
                 if(!self.props.walletReducer.isConnecting) self.loadWeb3();
            })
        }
        else if (window.web3) {
            try{
                window.web3 = new Web3(window.web3.currentProvider);
               this.props.walletConnected()
            } 
            catch(error) {
                this.props.walletDenied()
            }
        }
        else {
            this.props.walletInstall()
        }
    }
	render() {
		return (
			<div>
				<a className="nav-link" href="#" role="button" aria-haspopup="true" onClick={this.loadWeb3} aria-expanded="false">CONNECT</a>
			</div>
		)
	}
};


const mapStateToProps = (state) => {
  return { 
    walletReducer: state.walletReducer,
  };
};


const mapDispatchToProps = (dispatch) => {
  return { 
    walletConnect: () => { dispatch(walletConnect()) },
    walletConnected: () => { dispatch(walletConnected()) },
    walletDenied: () => { dispatch(walletDenied()) },
    walletInstall: () => { dispatch(walletInstall()) },
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(MConnectWeb3);