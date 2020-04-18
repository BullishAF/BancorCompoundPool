
import React from "react";
import { render } from "react-dom";


export default class DappSelect extends React.Component {

	render() {
		return (
			<section className="after-loop">
				<div className="container">
					<div className="card-deck">
						<a href="/convert" className="after-loop-item card border-0 card-staker ">
							<div className="card-body d-flex align-items-end flex-column text-right">
								<h4>Convert</h4>
								<p className="w-75">Bancor Network conversion fast & secure</p>
								<i className="fas fa-sync-alt"></i>
							</div>
						</a>
						<a href="/invest" className="after-loop-item card border-0 card-auditor">
							<div className="card-body d-flex align-items-end flex-column text-right">
								<h4>Invest</h4>
								<p className="w-75">Earn Bancor returns & Compound interest</p>
								<i className="fas fa-coins"></i>
							</div>
						</a>
						<a href="/liquidate" className="after-loop-item card border-0 card-manager">
							<div className="card-body d-flex align-items-end flex-column text-right">
								<h4>Liquidate</h4>
								<p className="w-75">Burn your Smart Tokens to retrieve your funds</p>
								<i className="fas fa-sign-out-alt"></i>
							</div>
						</a>
					</div>
				</div>
			</section>
		)
	}
};