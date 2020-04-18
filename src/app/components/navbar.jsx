
import React from "react";
import { render } from "react-dom";
import { connect } from "react-redux";
import { walletInstall, walletConnect, walletDenied, walletConnected } from "../actions/walletActions.jsx";
import ConnectWeb3 from "./connectweb3.jsx"


class MNavBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {userAddres:"",network:"",enabled:"false"};
    }

	render() {
		return (
			<nav className="navbar shadow sticky-top navbar-light bg-light navbar-expand-sm ml-3 mr-3 mt-3 rounded" >    
                <a className="navbar-brand" href="/home">
                    <img src="/app/images/navbrand.png" height="36" alt=""/>
                </a>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarColapse" aria-controls="navbarColapse" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarColapse">
                    <ul className="navbar-nav mr-auto ">
                        <li className="nav-item ">
                            <a className="nav-link " href="/home" >HOME</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link " href="/convert" >CONVERT</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link " href="/invest" >INVEST</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link " href="/liquidate" >LIQUIDATE</a>
                        </li>
                    </ul>
                    <ul className="nav navbar-nav navbar-right">
                        <li>
                            <div>
                                {!this.props.walletReducer.isConnected &&(
                                    <ConnectWeb3/>
                                )}
                            </div>
                            <div>
                                {this.props.walletReducer.isConnected &&( 
                                    <a className="nav-link" href="#"> {this.props.walletReducer.userAddress} </a>
                                )}
                            </div>
                        </li>
                    </ul>
                </div>
            </nav>
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
  }
}

const NavBar = connect(mapStateToProps,mapDispatchToProps)(MNavBar);
export default NavBar;
