import { 
  LIQUIDATE_UPDATE_POOL, 
  LIQUIDATE_UPDATE_INPUT,
  LIQUIDATE_UPDATE_OUTPUTS,
  LIQUIDATE_DISABLE,
  LIQUIDATE_ENABLE,
  LIQUIDATE_APPROVE_OR_REJECT,
  LIQUIDATE_MAX_VALUE,} from "./action-types.jsx";

function liquidateUpdatePool(payload = 0) {
  return {
    type: LIQUIDATE_UPDATE_POOL,
    payload: payload
  }
}

function liquidateUpdateInput(payload = 0) {
  return {
    type: LIQUIDATE_UPDATE_INPUT,
    payload: payload
  }
}

function liquidateUpdateOutputs(payload = 0) {
  return {
    type: LIQUIDATE_UPDATE_OUTPUTS,
    payload: payload
  }
}

function liquidateEnable(payload = 0) {
  return {
    type: LIQUIDATE_ENABLE,
    payload: payload
  }
}

function liquidateDisable(payload = 0) {
  return {
    type: LIQUIDATE_DISABLE,
    payload: payload
  }
}

function liquidateApproveOrReject(payload = 0){
  return { 
    type: LIQUIDATE_APPROVE_OR_REJECT,
    payload: payload
  } 
}

function liquidateMaxValue(payload = 0){
  return { 
    type: LIQUIDATE_MAX_VALUE,
    payload: payload
  } 
}



export {
  liquidateApproveOrReject,
  liquidateUpdateOutputs,
  liquidateUpdatePool,
  liquidateUpdateInput,
  liquidateEnable,
  liquidateDisable,
  liquidateMaxValue
}