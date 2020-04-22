
import {  
  CONVERT_UPDATE_OUTPUT,
  CONVERT_UPDATE_INPUT,
  CONVERT_UPDATE_FROM_TOKEN,
  CONVERT_UPDATE_TO_TOKEN,
  CONVERT_DISABLE,
  CONVERT_ENABLE,
  CONVERT_APPROVE_OR_REJECT,
  CONVERT_UPDATE_ALERT_MESSAGE} from "../actions/action-types.jsx";


const tokens = {
  CDAIBNT: "0x65220818111aA20fA2b4B57713dbB549177D2202",
  CDAI: "0x6CE27497A64fFFb5517AA4aeE908b1E7EB63B9fF",
  DAI: "0xB5E5D0F8C0cbA267CD3D7035d6AdC8eBA7Df7Cdd",
  BNT: "0x62bd9D98d4E188e281D7B78e29334969bbE1053c",
}

const initialState = {
  fromToken: "BNT",
  toToken: "DAI",
  fromTokenAddress: tokens["BNT"],
  toTokenAddress: tokens["DAI"],
  inputVal: "",
  outputVal: "0.0",
  approveOrReject: false,
  isDisabled: false,
  requestCounter:-1,
  alertMessage:"",
};

function convertReducer(state = initialState, action) {
  switch(action.type) {
    case CONVERT_UPDATE_OUTPUT: {
      return Object.assign({}, state, {
        outputVal: action.payload[1] > state.requestCounter ? action.payload[0] : state.outputVal,
        requestCounter: action.payload[1] > state.requestCounter ? action.payload[1] : state.requestCounter,
      })
    }
    case CONVERT_UPDATE_INPUT: {
      return Object.assign({}, state, {
        inputVal: action.payload

      })
    }
    case CONVERT_UPDATE_FROM_TOKEN: {
      var _fromToken = state.toToken == action.payload ? state.toToken : action.payload;
      var _toToken = state.toToken == action.payload ? state.fromToken : state.toToken;
      return Object.assign({}, state, {
          fromToken: _fromToken,
          toToken: _toToken,
          fromTokenAddress: tokens[_fromToken],
          toTokenAddress: tokens[_toToken],
      })
    }
    case CONVERT_UPDATE_TO_TOKEN: {
      var _fromToken = state.fromToken == action.payload ? state.toToken : state.fromToken;
      var _toToken = state.fromToken == action.payload ? state.fromToken : action.payload;
      return Object.assign({}, state, {
          fromToken: _fromToken,
          toToken: _toToken,
          fromTokenAddress: tokens[_fromToken],
          toTokenAddress: tokens[_toToken],
      })
    }

    case CONVERT_APPROVE_OR_REJECT: {
      return Object.assign({}, state, {
          approveOrReject: action.payload,
      })
    }

    case CONVERT_DISABLE: {
      return Object.assign({}, state, {
          isDisabled: true,
      })
    }
    case CONVERT_ENABLE: {
      return Object.assign({}, state, {
          isDisabled: false,
      })
    }

    case CONVERT_UPDATE_ALERT_MESSAGE: {
      return Object.assign({}, state, {
          alertMessage: action.payload,
      })
    }
    default:
        return state;
  }
}

export default convertReducer;
