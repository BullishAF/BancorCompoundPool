
import React from "react";
import { render } from "react-dom";
import { connect } from "react-redux";
import Alert from "./alert.jsx";
import BigNumber from "bignumber.js"
import { 
  investUpdatePool, 
  investUpdateInput,
  investUpdateOutputs,
  investEnable,
  investDisable,
  investApproveOrReject,
  investUpdateAlertMessage,
  investMaxValues,
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
  getBalancesOf,
} from "../utils/butils.jsx"

var requestCounter = 0;
var requestCounterMax = 0;


class MInvest extends React.Component {

  constructor(props) {

    super(props);
    
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.setOutputValue = this.setOutputValue.bind(this);
    this.getMaxValues = this.getMaxValues.bind(this);
    this.handleModal = this.handleModal.bind(this);
    this.modalState = true;

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

  handleModal() {
    localStorage.setItem('modalState', JSON.stringify(false));
  }

  componentDidMount(){
    this.getMaxValues()
    var item = JSON.parse(localStorage.getItem('modalState'));
    if(typeof item === 'boolean')
      this.modalState = item;
    if(this.modalState) $('#modalCenter').modal('show'); 
  }

  componentDidUpdate(prevProps) {
    if(!(this.props.investReducer.pool == prevProps.investReducer.pool)) {
      this.setOutputValue(this.props.investReducer.inputVal)
      this.getMaxValues()
    } 
  }

  getMaxValues() {
    var _requestCounter = ++requestCounterMax
    getBalancesOf(this.props.investReducer.token1Address,this.props.investReducer.token2Address)
    .then(
      output => {
        output.push(_requestCounter);
        this.props.investMaxValues(output)
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
    if(!(
      this.props.walletReducer.isConnected &&
      !this.props.walletReducer.isDenied &&
      !this.props.walletReducer.installWallet &&
      !this.props.walletReducer.isNetworkIncorrect
    )) {
      this.props.investEnable();
      return;
    }

    if(Number(this.props.investReducer.inputVal) == 0) {
      this.props.investEnable();
      event.target.elements["INVEST_UPDATE_INPUT"].setCustomValidity("The amount cannot be zero");
      event.target.reportValidity();
      event.target.elements["INVEST_UPDATE_INPUT"].setCustomValidity("");
      return;
    }

    let tx = invest(this.props,event.target)
    this.props.investApproveOrReject(true)
    tx.then(
      () => {
        this.props.investEnable();
        this.props.investApproveOrReject(false);
        this.props.investUpdateAlertMessage("");
        this.setOutputValue(this.props.investReducer.inputVal);
      }
      ,
      error => {
        console.log(error)
        this.props.investApproveOrReject(false);
        this.props.investUpdateAlertMessage("");
        this.props.investEnable();
        this.setOutputValue(this.props.investReducer.inputVal);
      }
    )
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
                  value={this.props.investReducer.inputVal} className="form-control" placeholder="Smart token amount to be minted" required autoFocus/>
                  <label htmlFor="inputValue" className="text-secondary">Smart token amount to be minted</label>
                </div>
                <div className="form-group">
                  <label className="speciallabel text-secondary">{"max: " + this.props.investReducer.maxValue1}</label>
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
                  <label className="speciallabel text-secondary">{"max: " + this.props.investReducer.maxValue2}</label>
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

                <button className="btn btn-lg btn-secondary btn-block text-uppercase" type="submit" disabled={this.props.investReducer.isDisabled} > INVEST</button>
                <hr className="my-4" />
                <Alert/>
                <div className="modal fade" 
                  id="modalCenter" 
                  tabIndex="-1" 
                  role="dialog" 
                  aria-labelledby="modalCenterTitle" 
                  aria-modal="true">
                  <div className="modal-dialog modal-dialog-centered " role="document">
                    <div className="modal-content bg-light">
                      <div className="modal-header">
                        <h5 className="modal-title" id="modalLongTitle">INVEST</h5>
                        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>The invest process is devided in two main steps:</p>
                        <ul>
                          <li>First you will be prompted to approve your tokens to be spent by the smart contract, depending on the selected pool the tokens to approve can change.</li>
                          <li>Finally you will be prompted to confirm the invest transaction.</li>
                        </ul>
                        <p>Each time that a transaction is confirmed by the network you will be automatically prompted to confirm the next transaction, if the prompt does not appear please check you wallet.</p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={this.handleModal} data-dismiss="modal">Do not show again</button>
                        <button type="button" className="btn btn-secondary" data-dismiss="modal">OK</button>
                      </div>
                    </div>
                  </div>
                </div>
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
    investReducer: state.investReducer,
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
    investUpdateAlertMessage: (payload)=> {dispatch(investUpdateAlertMessage(payload))},
    investMaxValues: (payload)=> {dispatch(investMaxValues(payload))}
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(MInvest);