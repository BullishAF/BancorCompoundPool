
import React from "react";
import { render } from "react-dom";
import { connect } from "react-redux";
import Alert from "./alert.jsx";

import { 
  liquidateUpdatePool, 
  liquidateUpdateInput,
  liquidateUpdateOutputs,
  liquidateEnable,
  liquidateDisable,
  liquidateApproveOrReject,
  liquidateMaxValue,
} from "../actions/liquidateActions.jsx";

import { 
  LIQUIDATE_UPDATE_POOL,
  LIQUIDATE_UPDATE_INPUT
} from "../actions/action-types.jsx";

import {
  liquidate,
  isBalanceEnough,
  getLiquidateOutputs,
  isEmpty,
  getBalanceOf
} from "../utils/butils.jsx"

var requestCounter = 0;
var requestCounterMAx = 0;

class MLiquidate extends React.Component {

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.setOutputValue = this.setOutputValue.bind(this);
    this.getMaxValue = this.getMaxValue.bind(this);

    this.eventToAction = {
      LIQUIDATE_UPDATE_POOL:(value) => {
        this.props.liquidateUpdatePool(value);
      },
      LIQUIDATE_UPDATE_INPUT:(value) => {
        if(isNaN(value)) return;
        this.props.liquidateUpdateInput(value)
        if(isEmpty(value)) return;
        this.setOutputValue(value)
      },
    }
  }

  componentDidUpdate(prevProps) {
    if(!(this.props.liquidateReducer.pool == prevProps.liquidateReducer.pool)) {
      this.setOutputValue(this.props.liquidateReducer.inputVal);
    }
    this.getMaxValue();
  }

  getMaxValue() {
    var _requestCounter = ++requestCounterMAx
    getBalanceOf(this.props.liquidateReducer.poolAddress)
    .then(
      output => {
          if(!(this.props.liquidateReducer.maxValue == output)) this.props.liquidateMaxValue([output,_requestCounter])
      }
    ,
      () => {}
    )
  }

  handleChange(event) {
    if(this.eventToAction[event.target.name])
      this.eventToAction[event.target.name](event.target.value)
  }

  setOutputValue(value) {
    var _requestCounter = ++requestCounter
    console.log("test")
    getLiquidateOutputs(
      this.props.liquidateReducer.poolAddress,
      value,
      this.props.liquidateReducer.token1Address,
      this.props.liquidateReducer.token2Address,
    ).then(results =>{
      results.push(_requestCounter)
      this.props.liquidateUpdateOutputs(results);
    })
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.liquidateDisable();
    this.eventTarget = event.target;

    if(!(
      this.props.walletReducer.isConnected &&
      !this.props.walletReducer.isDenied &&
      !this.props.walletReducer.installWallet &&
      !this.props.walletReducer.isNetworkIncorrect
    )) {
      this.props.liquidateEnable();
      return;
    }

    if(Number(this.props.liquidateReducer.inputVal) == 0) {
      this.props.liquidateEnable();
      event.target.elements["LIQUIDATE_UPDATE_INPUT"].setCustomValidity("The amount cannot be zero");
      event.target.reportValidity();
      event.target.elements["LIQUIDATE_UPDATE_INPUT"].setCustomValidity("");
      return;
    }

    isBalanceEnough(this.props.liquidateReducer.poolAddress, this.props.liquidateReducer.inputVal).then( result => {
      if(!result) 
      {
        this.eventTarget.elements[LIQUIDATE_UPDATE_INPUT].setCustomValidity("Not enough Balance")
        this.eventTarget.reportValidity();
        this.props.liquidateEnable();
        this.eventTarget.elements[LIQUIDATE_UPDATE_INPUT].setCustomValidity("")
      }
      else {
        let tx = liquidate(this.props.liquidateReducer.poolAddress,
                          this.props.liquidateReducer.inputVal)
        this.props.liquidateApproveOrReject(true)
        tx.then(
          () => {
            this.props.liquidateEnable();
            this.props.liquidateApproveOrReject(false);
            this.setOutputValue(this.props.liquidateReducer.inputVal);
          }
          ,
          error => {
            this.props.liquidateApproveOrReject(false);
            this.props.liquidateEnable();
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
                      <label className="input-group-text bg-light" style={{width: 60 + 'px'}} htmlFor="inputGroupSelect01">Pool</label>
                    </div>
                    <select className="custom-select" 
                    name={LIQUIDATE_UPDATE_POOL} id="inputGroupSelect01" 
                    onChange={this.handleChange} 
                    value={this.props.liquidateReducer.pool}>
                      <option value="1">DAI-BNT</option>
                      <option value="2">CDAI-BNT</option>
                    </select>
                  </div>
                </div>
                <div className="form-label-group">
                  <input type="number" min="0" step="any" id="inputValue" 
                  name ={LIQUIDATE_UPDATE_INPUT} 
                  onChange={this.handleChange} 
                  value={this.props.liquidateReducer.inputVal} className="form-control" placeholder={"Amount to be burned. The maximum is: " + this.props.liquidateReducer.maxValue } required autoFocus/>
                  <label htmlFor="inputValue" className="text-secondary">{"Amount to be burned. The maximum is: " + this.props.liquidateReducer.maxValue }</label>
                </div>
                <div className="form-group">
                  <div className="input-group">
                    <div className="input-group-prepend" >
                      <label className="input-group-text bg-light" style={{width: 60 + 'px'}} htmlFor="expectedInputSelect01">{this.props.liquidateReducer.token1}</label>
                    </div>
                    <input type="number" step="any" min="0" id="expectedInputSelect01" name ="expectedVal1" 
                    onChange={this.handleChange}
                    value={this.props.liquidateReducer.token1Output} 
                    className="form-control" placeholder=""  />
                  </div>
                </div>
                <div className="form-group">
                  <div className="input-group">
                    <div className="input-group-prepend ">
                      <label className="input-group-text bg-light" style={{width: 60 + 'px'}} htmlFor="expectedInputSelect02">{this.props.liquidateReducer.token2}</label>
                    </div>
                    <input type="number" step="any" min="0" id="expectedInputSelect02" name ="expectedVal2"
                    onChange={this.handleChange}
                    value={this.props.liquidateReducer.token2Output} 
                    className="form-control" placeholder=""  />
                  </div>
                </div>
                <button className="btn btn-lg btn-secondary btn-block text-uppercase" disabled={this.props.liquidateReducer.isDisabled} type="submit"  ><i className="fas fa-fire-alt"></i> LIQUIDATE</button>
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
    liquidateReducer: state.liquidateReducer,
    walletReducer: state.walletReducer,
  };
};

const mapDispatchToProps = (dispatch) => {
  return { 
    liquidateUpdatePool: (payload) => {dispatch(liquidateUpdatePool(payload))},
    liquidateUpdateInput: (payload) => {dispatch(liquidateUpdateInput(payload))},
    liquidateUpdateOutputs: (payload) => {dispatch(liquidateUpdateOutputs(payload))},
    liquidateDisable: () => {dispatch(liquidateDisable())},
    liquidateEnable: () => {dispatch(liquidateEnable())},
    liquidateApproveOrReject: (payload)=> {dispatch(liquidateApproveOrReject(payload))},
    liquidateMaxValue: (payload)=> {dispatch(liquidateMaxValue(payload))}
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(MLiquidate);