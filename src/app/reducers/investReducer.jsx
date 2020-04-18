
import {
  INVEST_UPDATE_POOL,
  INVEST_UPDATE_INPUT,
  INVEST_UPDATE_OUTPUTS,
  INVEST_DISABLE,
  INVEST_ENABLE,
  INVEST_APPROVE_OR_REJECT, 
} from "../actions/action-types.jsx";

const initPoolAddress = [
  "0x65220818111aA20fA2b4B57713dbB549177D2202",
  "0x65220818111aA20fA2b4B57713dbB549177D2202"
]

const smToTokens = {1:["BNT","DAI"],2:["BNT","CDAI"]};
const tokens = {
  CDAIBNT: "0x65220818111aA20fA2b4B57713dbB549177D2202",
  CDAI: "0x6CE27497A64fFFb5517AA4aeE908b1E7EB63B9fF",
  DAI: "0xB5E5D0F8C0cbA267CD3D7035d6AdC8eBA7Df7Cdd",
  BNT: "0x62bd9D98d4E188e281D7B78e29334969bbE1053c",
}

const initPool = 2;
const initialState = {
  pool: initPool,
  poolAddress: initPoolAddress[initPool-1],
  token1: smToTokens[initPool][0],
  token2: smToTokens[initPool][1],
  token1Address: tokens[smToTokens[initPool][0]],
  token2Address: tokens[smToTokens[initPool][1]],
  token1Output: "0.0",
  token2Output: "0.0",
  inputVal: "0.0",
  approveOrReject: false,
  isDisabled: false,
  requestCounter: -1
};

function investReducer(state = initialState, action) {
  switch(action.type) {
    case INVEST_UPDATE_POOL: {
      return Object.assign({}, state, {
        pool: action.payload,
        poolAddress: initPoolAddress[action.payload-1],
        token1: smToTokens[action.payload][0],
        token2: smToTokens[action.payload][1],
        token1Address: tokens[smToTokens[action.payload][0]],
        token2Address: tokens[ smToTokens[action.payload][1]]
      })
    }
    case INVEST_UPDATE_INPUT: {
      return Object.assign({}, state, {
        inputVal: action.payload,
      })
    }
    case INVEST_UPDATE_OUTPUTS: {
      var isPassed = action.payload[2] > state.requestCounter;
      return Object.assign({}, state, {
          token1Output: isPassed ? action.payload[0]: state.token1Output,
          token2Output: isPassed ? action.payload[1]: state.token2Output,
          requestCounter: isPassed ? action.payload[2]: state.requestCounter
      })
    }
    case INVEST_DISABLE: {
      return Object.assign({}, state, {
        isDisabled: true,
      })
    }
    case INVEST_ENABLE: {
      return Object.assign({}, state, {
        isDisabled: false,
      })
    }
    case INVEST_APPROVE_OR_REJECT: {
      return Object.assign({}, state, {
          approveOrReject: action.payload,
      })
    }
    default:
      return state;
  }
}

export default investReducer;
