import React from "react";
import { render } from "react-dom";
import { Provider , connect} from "react-redux";
import { BrowserRouter as Router , Route , Redirect,Switch} from "react-router-dom";

import store from "./store.jsx";
import NavBar from "./components/navbar.jsx";
import Particles from "./components/particles.jsx";

import Invest from "./components/invest.jsx";
import Convert from "./components/convert.jsx";
import Liquidate from "./components/liquidate.jsx";
import DappSelect from "./components/dappselect.jsx";

class MApp extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Router >
        <Particles/>
        <div className="d-flex flex-column" id="page-wrapper">
		      <NavBar/>
          <Switch>
            <Route path={"/home"}>
              <div className="d-flex wrapper justify-content-center mt-2">
                <DappSelect/>
              </div>
            </Route>
            <Route path={"/convert"}>
              <div className="d-flex wrapper justify-content-center mt-2">
                <Convert/>
              </div>
            </Route>
            <Route path={"/invest"}>
              <div className="d-flex wrapper justify-content-center mt-2">
                <Invest/>
              </div>
            </Route>
            <Route path={"/liquidate"}>
              <div className="d-flex wrapper justify-content-center mt-2">
                <Liquidate/>
              </div>
            </Route>
            <Redirect to='/home' />
          </Switch>
		    </div>
      </Router>	
    )
  }
};

const mapStateToProps = (state) => {
  return { };
};

const mapDispatchToProps = (dispatch) => {
  return { 
  }
}

const App = connect(mapStateToProps,mapDispatchToProps)(MApp);

render(<Provider store={store}><App/></Provider>,document.getElementById("app"));