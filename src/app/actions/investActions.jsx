import { 
  INVEST_UPDATE_POOL, 
  INVEST_UPDATE_INPUT,
  INVEST_UPDATE_OUTPUTS,
  INVEST_DISABLE,
  INVEST_ENABLE,
  INVEST_APPROVE_OR_REJECT,
  INVEST_UPDATE_ALERT_MESSAGE,
  INVEST_MAX_VALUES} from "./action-types.jsx";

function investUpdatePool(payload = 0) {
  return {
    type: INVEST_UPDATE_POOL,
    payload: payload
  }
}

function investUpdateInput(payload = 0) {
  return {
    type: INVEST_UPDATE_INPUT,
    payload: payload
  }
}

function investUpdateOutputs(payload = 0) {
  return {
    type: INVEST_UPDATE_OUTPUTS,
    payload: payload
  }
}

function investEnable(payload = 0) {
  return {
    type: INVEST_ENABLE,
    payload: payload
  }
}

function investDisable(payload = 0) {
  return {
    type: INVEST_DISABLE,
    payload: payload
  }
}

function investApproveOrReject(payload = 0){
  return { 
    type: INVEST_APPROVE_OR_REJECT,
    payload: payload
  } 
}

function investUpdateAlertMessage(payload = 0){
  return { 
    type: INVEST_UPDATE_ALERT_MESSAGE,
    payload: payload
  } 
}

function investMaxValues(payload = 0){
  return { 
    type: INVEST_MAX_VALUES,
    payload: payload
  } 
}



export {
  investApproveOrReject,
  investUpdateOutputs,
  investUpdatePool,
  investUpdateInput,
  investEnable,
  investDisable,
  investUpdateAlertMessage,
  investMaxValues,
}