
import React from "react";
import { render } from "react-dom";
import { connect } from "react-redux";
import Alert from "./alert.jsx";


import {
  fromDecimals,
  toDecimals,
} from "../utils/eth.jsx";

import {
  convertUpdateOutput,
  convertUpdateInput,
  convertUpdateFromToken,
  convertUpdateToToken,  
  convertEnable,
  convertDisable,
  convertApproveOrReject,
  convertUpdateAlertMessage
} from "../actions/convertActions.jsx";

import {  
  CONVERT_UPDATE_OUTPUT,
  CONVERT_UPDATE_INPUT,
  CONVERT_UPDATE_FROM_TOKEN,
  CONVERT_UPDATE_TO_TOKEN } from "../actions/action-types.jsx";

import {
  convert,
  isBalanceEnough,
  getReturn,
  isEmpty,
} from "../utils/butils.jsx";

const tokens = {
  CDAIBNT: "0x65220818111aA20fA2b4B57713dbB549177D2202",
  CDAI: "0x6CE27497A64fFFb5517AA4aeE908b1E7EB63B9fF",
  DAI: "0xB5E5D0F8C0cbA267CD3D7035d6AdC8eBA7Df7Cdd",
  BNT: "0x62bd9D98d4E188e281D7B78e29334969bbE1053c",
}

var requestCounter = 0;

class MConvert extends React.Component {

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.setOutputValue = this.setOutputValue.bind(this);
    this.getPath = this.getPath.bind(this);

    this.eventToAction = {
      CONVERT_UPDATE_OUTPUT: (value) => {
        // this.props.convertUpdateOutput(value) 
      },
      CONVERT_UPDATE_INPUT: (value) => {
        if(isNaN(value)) return;
        this.props.convertUpdateInput(value)
        if(isEmpty(value)) return;
        this.setOutputValue(
          this.getPath(this.props.convertReducer.fromToken,this.props.convertReducer.toToken),
          value
        )
      },
      CONVERT_UPDATE_FROM_TOKEN: (value) => {
        this.props.convertUpdateFromToken(value)
        let toToken = this.props.convertReducer.toToken;
        let fromToken = this.props.convertReducer.fromToken;
        if(toToken === value) toToken = fromToken;
        fromToken = value;
        this.setOutputValue(
          this.getPath(fromToken,toToken),
          this.props.convertReducer.inputVal
        )
      },
      CONVERT_UPDATE_TO_TOKEN: (value) => {
        this.props.convertUpdateToToken(value)
        let toToken = this.props.convertReducer.toToken;
        let fromToken = this.props.convertReducer.fromToken;
        if(fromToken === value) fromToken = toToken;
        toToken = value;
        this.setOutputValue(
          this.getPath(fromToken,toToken),
          this.props.convertReducer.inputVal
        )
      },
    }
  }

  // TODO: change it to implement multi token transactions
  getPath(fromToken,toToken) {
    return [
      tokens[fromToken],
      tokens["CDAIBNT"],
      tokens[toToken]
    ];
  }

  setOutputValue(path, value) {
    var _requestCounter = ++requestCounter
    getReturn(path,value)
    .then(output => {
          this.props.convertUpdateOutput([output,_requestCounter])
    })
  }

  handleChange(event) {
    this.eventToAction[event.target.name](event.target.value)
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.convertDisable();
    this.eventTarget = event.target;

    if(!(
      this.props.walletReducer.isConnected &&
      !this.props.walletReducer.isDenied &&
      !this.props.walletReducer.installWallet &&
      !this.props.walletReducer.isNetworkIncorrect
    )) {
      this.props.convertEnable();
      return;
    }

    let smartTokenAddr = tokens['CDAIBNT']
    let fromTokenAddr = this.props.convertReducer.fromTokenAddress;
    let toTokenAddr = this.props.convertReducer.toTokenAddress;
    let inputVal = this.props.convertReducer.inputVal;

    isBalanceEnough(fromTokenAddr,inputVal).then( result => {
      if(!result) {
        this.eventTarget.elements[CONVERT_UPDATE_INPUT].setCustomValidity("Not enough Balance")
        this.eventTarget.reportValidity();
        this.eventTarget.elements[CONVERT_UPDATE_INPUT].setCustomValidity("");
        this.props.convertEnable();
      } else {
      let tx = convert([fromTokenAddr,smartTokenAddr,toTokenAddr],inputVal,this.props)
      this.props.convertApproveOrReject(true);
      tx.then(
          () => {
            this.props.convertEnable();
            this.props.convertApproveOrReject(false);
            this.props.convertUpdateAlertMessage("");
            this.setOutputValue(
              getPath(
                this.props.convertReducer.fromToken,
                this.props.convertReducer.toToken
              ),
              this.props.convertReducer.inputVal,
            );
          },  
          error => {
            this.props.convertEnable();
            this.props.convertUpdateAlertMessage("");
            this.props.convertApproveOrReject(false);
          }
        )
      }
    })
  }

	render() {
    return (
      <div className="container">
        <div className="row">
        <div className="col-sm-9 col-md-7 col-lg-5 mx-auto">
          <div className="card card-sign my-5">
            <div className="card-body">
              <form className="form-convert" onSubmit={this.handleSubmit}>
                <div className="form-group">
                  <div className="input-group">
                    <div className="input-group-prepend ">
                      <label className="input-group-text bg-light" style={{width: 60 + 'px'}} htmlFor="inputGroupSelect01">From</label>
                    </div>
                    <select className="custom-select selectpicker" name={CONVERT_UPDATE_FROM_TOKEN} id="inputGroupSelect01" 
                    onChange={this.handleChange} 
                    value={this.props.convertReducer.fromToken}>
                      <option value="BNT">BNT</option>
                      <option value="DAI">DAI</option>
                      <option value="CDAI">CDAI</option>
                      <option value="CDAIBNT">CDAIBNT</option>
                    </select>
                  </div>
                </div>
                <div className="form-label-group">
                  <input type="number" step="any" min="0" id="inputValue" name ={CONVERT_UPDATE_INPUT} 
                  onChange={this.handleChange} 
                  value={this.props.convertReducer.inputVal} className="form-control" placeholder="Input value" required autoFocus />
                  <label htmlFor="inputValue" className="text-secondary">Input value</label>
                </div>
                <div className="form-group">
                  <div className="input-group">
                    <div className="input-group-prepend ">
                      <label className="input-group-text bg-light" style={{width: 60 + 'px'}} htmlFor="inputGroupSelect02">To</label>
                    </div>
                    <select className="custom-select" name={CONVERT_UPDATE_TO_TOKEN} id="inputGroupSelect02" 
                    onChange={this.handleChange} 
                    value={this.props.convertReducer.toToken}>
                      <option value="BNT">BNT</option>
                      <option value="DAI">DAI</option>
                      <option value="CDAI">CDAI</option>
                      <option value="CDAIBNT">CDAIBNT</option>
                    </select>
                  </div>
                </div>
                <div className="form-label-group">
                  <input type="number" min="0" step="any" id="outputValue" name ={CONVERT_UPDATE_OUTPUT} 
                    onChange={this.handleChange} 
                    value={this.props.convertReducer.outputVal} 
                    className="form-control" placeholder="Output value" required />
                  <label htmlFor="outputValue" className="text-secondary">Estimated output value</label>
                </div>
                <button className="btn btn-lg btn-secondary btn-block text-uppercase" disabled={this.props.convertReducer.isDisabled} type="submit"  >CONVERT</button>
                <hr className="my-4" />
                <Alert/>
              </form>
            </div>
          </div>
        </div>
        </div>

      </div>
		)
	}
};

const mapStateToProps = (state) => {
  return { 
    convertReducer: state.convertReducer ,
    walletReducer: state.walletReducer,
  };
};

const mapDispatchToProps = (dispatch) => {
  return { 
    convertUpdateOutput: (payload) => { dispatch(convertUpdateOutput(payload)) },
    convertUpdateInput: (payload) => { dispatch(convertUpdateInput(payload)) },
    convertUpdateFromToken: (payload) => { dispatch(convertUpdateFromToken(payload)) },
    convertUpdateToToken: (payload) => { dispatch(convertUpdateToToken(payload)) },
    convertApproveOrReject: (payload) => { dispatch(convertApproveOrReject(payload))},
    convertDisable: () => { dispatch(convertDisable())},
    convertEnable: () => { dispatch(convertEnable())},
    convertUpdateAlertMessage: (payload) => { dispatch(convertUpdateAlertMessage(payload))}
  }
}

const Convert = connect(mapStateToProps,mapDispatchToProps)(MConvert);
export default Convert;