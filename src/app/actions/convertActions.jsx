
import {  
  CONVERT_UPDATE_OUTPUT,
  CONVERT_UPDATE_INPUT,
  CONVERT_UPDATE_FROM_TOKEN,
  CONVERT_UPDATE_TO_TOKEN,
  CONVERT_DISABLE,
  CONVERT_ENABLE,
  CONVERT_APPROVE_OR_REJECT} from "./action-types.jsx";


function convertUpdateOutput(payload = 0) {
  return {
    type: CONVERT_UPDATE_OUTPUT,
    payload: payload
  }
}

function convertUpdateInput(payload = 0){
  return {
    type: CONVERT_UPDATE_INPUT,
    payload: payload
  }  
}

function convertUpdateFromToken(payload = 0){
  return {
    type: CONVERT_UPDATE_FROM_TOKEN,
    payload: payload
  }  
}

function convertUpdateToToken(payload = 0){
  return { 
    type: CONVERT_UPDATE_TO_TOKEN,
    payload: payload
  } 
}

function convertDisable(payload = 0){
  return { 
    type: CONVERT_DISABLE,
    payload: payload
  } 
}

function convertEnable(payload = 0){
  return { 
    type: CONVERT_ENABLE,
    payload: payload
  } 
}

function convertApproveOrReject(payload = 0){
  return { 
    type: CONVERT_APPROVE_OR_REJECT,
    payload: payload
  } 
}

export {
  convertApproveOrReject,
  convertUpdateOutput,
  convertUpdateInput,
  convertUpdateFromToken,
  convertUpdateToToken,
  convertEnable,
  convertDisable
}