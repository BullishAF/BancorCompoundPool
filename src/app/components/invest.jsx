
import React from "react";
import { render } from "react-dom";
import { connect } from "react-redux";
import Alert from "./alert.jsx";

import { 
  investUpdatePool, 
  investUpdateInput,
  investUpdateOutputs,
  investEnable,
  investDisable,
  investApproveOrReject,
} from "../actions/investActions.jsx";

import { 
  INVEST_UPDATE_POOL,
  INVEST_UPDATE_INPUT
} from "../actions/action-types.jsx";
import {
  invest,
  isBalanceEnough,
  getInvestOutputs,
  isEmpty,
} from "../utils/butils.jsx"

var requestCounter = 0;

class MInvest extends React.Component {

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.setOutputValue = this.setOutputValue.bind(this);

    this.eventToAction = {
      INVEST_UPDATE_POOL:(value) => {
        this.props.investUpdatePool(value);
      },
      INVEST_UPDATE_INPUT:(value) => {
        if(isNaN(value)) return;
        this.props.investUpdateInput(value)
        if(isEmpty(value)) return;
        this.setOutputValue(value)
      },
    }
  }
  
  handleChange(event) {
    if(this.eventToAction[event.target.name])
      this.eventToAction[event.target.name](event.target.value)
  }

  setOutputValue(value) {
    var _requestCounter = ++requestCounter
    getInvestOutputs(
      this.props.investReducer.poolAddress,
      value,
      this.props.investReducer.token1Address,
      this.props.investReducer.token2Address,
    ).then(results =>{
      results.push(_requestCounter)
      this.props.investUpdateOutputs(results);
    })
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.investDisable();
    this.eventTarget = event.target;
    if(!(
      this.props.walletReducer.isConnected &&
      !this.props.walletReducer.isDenied &&
      !this.props.walletReducer.installWallet &&
      !this.props.walletReducer.isNetworkIncorrect
    )) {
      this.props.investEnable();
      return;
    }

    isBalanceEnough(this.props.investReducer.token1Address,this.props.investReducer.token1Output).then( result1 => {
      if(!result1) this.eventTarget.elements["expectedVal1"].setCustomValidity("Not enough Balance")
      isBalanceEnough(this.props.investReducer.token2Address,this.props.investReducer.token2Output).then( result2 => {
        if(!result2) this.eventTarget.elements["expectedVal2"].setCustomValidity("Not enough Balance")
        if(!result1 || !result2) {
          this.eventTarget.reportValidity();
          this.props.investEnable();
          this.eventTarget.elements["expectedVal1"].setCustomValidity("")
          this.eventTarget.elements["expectedVal2"].setCustomValidity("")
        }
        else {
          let tx = invest(this.props.investReducer.poolAddress,
                          this.props.investReducer.inputVal,
                          this.props.investReducer.token1Address,
                          this.props.investReducer.token2Address)
          this.props.investApproveOrReject(true)
          tx.then(
            () => {
              this.props.investEnable();
              this.props.investApproveOrReject(false);
              this.setOutputValue(this.props.investReducer.inputVal);
            }
            ,
            error => {
              this.props.investApproveOrReject(false);
              this.props.investEnable();
            }
          )
        }
      })
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
                    name={INVEST_UPDATE_POOL} id="inputGroupSelect01" 
                    onChange={this.handleChange} 
                    value={this.props.investReducer.pool}>
                      <option value="1">DAI-BNT</option>
                      <option value="2">CDAI-BNT</option>
                    </select>
                  </div>
                </div>
                <div className="form-label-group">
                  <input type="number" step="any" min="0" id="inputValue" 
                  name ={INVEST_UPDATE_INPUT} 
                  onChange={this.handleChange} 
                  value={this.props.investReducer.inputVal} className="form-control" placeholder="SmartToken amount to be minted" required autoFocus/>
                  <label htmlFor="inputValue" className="text-secondary">SmartToken amount to be minted</label>
                </div>
                <div className="form-group">
                  <div className="input-group">
                    <div className="input-group-prepend" >
                      <label className="input-group-text bg-light" style={{width: 60 + 'px'}} htmlFor="expectedInputSelect01">{this.props.investReducer.token1}</label>
                    </div>
                    <input type="number" step="any" min="0" id="expectedInputSelect01" name ="expectedVal1" 
                    onChange={this.handleChange}
                    value={this.props.investReducer.token1Output} 
                    className="form-control" placeholder="" />
                  </div>
                </div>
                <div className="form-group">
                  <div className="input-group">
                    <div className="input-group-prepend ">
                      <label className="input-group-text bg-light" style={{width: 60 + 'px'}} htmlFor="expectedInputSelect02">{this.props.investReducer.token2}</label>
                    </div>
                    <input type="number" min="0" step="any" id="expectedInputSelect02" name ="expectedVal2"
                    onChange={this.handleChange}
                    value={this.props.investReducer.token2Output} 
                    className="form-control" placeholder="" />
                  </div>
                </div>
                <button className="btn btn-lg btn-secondary btn-block text-uppercase" disabled={this.props.investReducer.isDisabled} type="submit"  >INVEST</button>
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
    investReducer: state.investReducer ,
    walletReducer: state.walletReducer,
  };
};

const mapDispatchToProps = (dispatch) => {
  return { 
    investUpdatePool: (payload) => {dispatch(investUpdatePool(payload))},
    investUpdateInput: (payload) => {dispatch(investUpdateInput(payload))},
    investUpdateOutputs: (payload) => {dispatch(investUpdateOutputs(payload))},
    investDisable: () => {dispatch(investDisable())},
    investEnable: () => {dispatch(investEnable())},
    investApproveOrReject: (payload)=> {dispatch(investApproveOrReject(payload))},
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(MInvest);