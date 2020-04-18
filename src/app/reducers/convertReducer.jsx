
import {  
  CONVERT_UPDATE_OUTPUT,
  CONVERT_UPDATE_INPUT,
  CONVERT_UPDATE_FROM_TOKEN,
  CONVERT_UPDATE_TO_TOKEN,
  CONVERT_DISABLE,
  CONVERT_ENABLE,
  CONVERT_APPROVE_OR_REJECT} from "../actions/action-types.jsx";

const initialState = {
  fromToken: "BNT",
  toToken: "DAI",
  inputVal: "",
  outputVal: "0.0",
  approveOrReject: false,
  isDisabled: false,
  requestCounter:-1,
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
      return Object.assign({}, state, {
          fromToken: state.toToken == action.payload ? state.toToken : action.payload,
          toToken: state.toToken == action.payload ? state.fromToken : state.toToken,
      })
    }
    case CONVERT_UPDATE_TO_TOKEN: {
      return Object.assign({}, state, {
          toToken: state.fromToken == action.payload ? state.fromToken : action.payload,
          fromToken: state.fromToken == action.payload ? state.toToken : state.fromToken,
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
    default:
        return state;
  }
}

export default convertReducer;
