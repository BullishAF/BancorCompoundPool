import { createStore , combineReducers, applyMiddleware } from "redux";

import liquidateReducer from "./reducers/liquidateReducer.jsx";
import convertReducer from "./reducers/convertReducer.jsx";
import investReducer from "./reducers/investReducer.jsx";
import walletReducer from "./reducers/walletReducer.jsx";

import logger from "redux-logger";

const store = createStore (
	combineReducers(
		{
			liquidateReducer,
			convertReducer,
			investReducer,
			walletReducer,
		}
	),
	{},
	applyMiddleware(logger)	
	);

window.store = store;
export default store;