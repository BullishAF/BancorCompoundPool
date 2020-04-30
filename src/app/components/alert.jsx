
import React from "react";
import { render } from "react-dom";
import { connect } from "react-redux";
import ConnectWeb3 from "./connectweb3.jsx"

class MAlert extends React.Component {

  constructor(props) {
    super(props);
  }
  
  componentDidUpdate() {

  }

  render() {
    return (
      <div className="container">
      	<div>
		{ this.props.investReducer.alertMessage.length>0  &&(
		  <div className="alert alert-info" role="alert">
		    {this.props.investReducer.alertMessage}
		  </div>
		)}
		</div>
		<div>
		{this.props.convertReducer.alertMessage.length>0  &&(
		  <div className="alert alert-info" role="alert">
		    {this.props.convertReducer.alertMessage}
		  </div>
		)}
		</div>
        <div>
		{this.props.walletReducer.installWallet &&(
		  <div className="alert alert-warning" role="alert">
		    Please Install a web wallet to continue.
		  </div>
		)}
		</div>
		<div>
		{!this.props.walletReducer.installWallet && !this.props.walletReducer.isDenied && !this.props.walletReducer.isConnected &&(
		  <div className="alert alert-warning" role="alert">
		    Please connect to your web wallet to continue.
		    <div className="d-flex wrapper justify-content-center">
		    	<ConnectWeb3/>
		    </div>
		  </div>
		)}
		</div>
		<div>
		{this.props.walletReducer.isDenied  &&(
		  <div className="alert alert-warning" role="alert">
		    You have denied wallet access to this dapp, please connect to continue.
		    <div className="d-flex wrapper justify-content-center">
		    	<ConnectWeb3/>
		    </div>
		  </div>
		)}
		</div>
		<div>
		{this.props.walletReducer.isNetworkIncorrect && this.props.walletReducer.isConnected &&(
		  <div className="alert alert-warning" role="alert">
		    This is a beta application only available on Ropsten network, please switch network.
		  </div>
		)}
		</div>
		<div>
		{(this.props.convertReducer.approveOrReject || this.props.investReducer.approveOrReject || this.props.liquidateReducer.approveOrReject) &&(
		  <div className="alert alert-warning" role="alert">
		    Please confirm or reject the generated transactions on your web wallet. If approved wait for network confirmation.
		  </div>
		)}
		</div>
      </div>

    )
  }
};

const mapStateToProps = (state) => {
  return { 
    walletReducer: state.walletReducer,
    convertReducer: state.convertReducer,
    investReducer: state.investReducer,
    liquidateReducer: state.liquidateReducer
  };
};

const mapDispatchToProps = (dispatch) => {
  return { 
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(MAlert);