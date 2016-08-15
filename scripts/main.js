var React = require('react');
var ReactDOM = require('react-dom');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Navigation = ReactRouter.Navigation; //mixin
var createBrowserHistory = require('history/lib/createBrowserHistory');
var History = ReactRouter.History;

var halp = require('./helpers.js')

// FireBase info
var Rebase = require('re-base');
var base = Rebase.createClass('https://catch-of-the-day-77da3.firebaseio.com/');

// React Catalyst
var Catalyst = require('react-catalyst');


/* app */
var App = React.createClass({
  mixins : [Catalyst.LinkedStateMixin],
  getInitialState : function(){
    return {
      fishes : {},
      order : {}
    }
  },
  componentDidMount : function(){
    base.syncState(this.props.params.storeId + '/fishes', {
      context: this,
      state : 'fishes'
    });
    var localStorageRef = localStorage.getItem('order-' + this.props.params.storeId);
    if(localStorageRef){
      this.setState({
        order : JSON.parse(localStorageRef)
      });
    }
  },
  componentWillUpdate : function(nextProps, nextState){
    localStorage.setItem('order-' + this.props.params.storeId, JSON.stringify(nextState.order));
  },
  addToOrder : function(key) {
    this.state.order[key] = this.state.order[key] + 1 || 1;
    this.setState({ order : this.state.order });
  },
  addFish : function(fish){
    var timeStamp = (new Date()).getTime();
    // update state object
    this.state.fishes['fish-'+ timeStamp] = fish;
    //set the state
    this.setState({ fishes : this.state.fishes });
  },
  loadSamples : function(){
    this.setState({
      fishes : require('./sample-fishes.js')
    });
  },
  renderFish : function(key){
    return <Fish key={key} index={key} details={this.state.fishes[key]} addToOrder={this.addToOrder}/>
  },
  render :function() {
    return(
      <div className="catch-of-the-day">
        <div className="menu">
          <Header tagline="Fresh Seafood Market"/>
          <ul className="list-of-fishes">
            {Object.keys(this.state.fishes).map(this.renderFish)}
          </ul>
        </div>
        <Order fishes={this.state.fishes} order={this.state.order}/>
        <Inventory addFish={this.addFish} loadSamples={this.loadSamples} fishes={this.state.fishes} linkState={this.linkState}/>
      </div>
    )
  }
});

/* Fish */
var Fish = React.createClass({
  onButtonClick :function(){
    console.log("going to add the fish: ", this.props.index);
    var key = this.props.index;
    this.props.addToOrder(key);
  },
  render : function(){
    var details = this.props.details;
    var isAvailable = (details.status === 'available' ? true : false);
    var buttonText = (isAvailable ? 'Add to Order' : "Sold Out");
    return (
      <li className="menu-fish">
        <img src={details.image} alt={details.name} />
        <h3 className="fish-name">
          {details.name}
          <span className="price">{halp.formatPrice(details.price)}</span>
        </h3>
        <p>{details.desc}</p>
        <button disabled={!isAvailable} onClick={this.onButtonClick}>{buttonText}</button>
      </li>
    )
  }
});

/* add fish form */
var AddFishForm = React.createClass({
  createFish : function(event){
    event.preventDefault();
    var fish = {
      name : this.refs.name.value,
      price : this.refs.price.value,
      status : this.refs.status.value,
      desc : this.refs.desc.value,
      image : this.refs.image.value
    }
    console.log(fish);
    // 3. Add the fish to the App State
    this.props.addFish(fish);
    this.refs.fishForm.reset();
  },
  render : function(){
    return (
      <form className="fish-edit" ref="fishForm" onSubmit={this.createFish}>
        <input type="text" ref="name" placeholder="Fish Name"/>
        <input type="text" ref="price" placeholder="Fish Price"/>
        <select ref="status">
          <option value="available">Fresh!</option>
          <option value="unavailable">Sold Out!</option>
        </select>
        <textarea type="text" ref="desc" placeholder="Desc"></textarea>
        <input type="text" ref="image" placeholder="URL to Image"/>
        <button type="submit">+ Add Item</button>
      </form>
    )
  }
});

/* Header */
var Header = React.createClass({
  render : function() {
    return(
      <header className="top">
        <h1>Catch
        <span className="ofThe">
          <span className="of">of</span>
          <span className="the">the</span>
        </span>
        Day</h1>
        <h3 className="tagline"><span>{this.props.tagline}</span></h3>
      </header>
    )
  }
});

/* Order */
var Order = React.createClass({
  renderOrder : function(key){
    var fish = this.props.fishes[key];
    var count = this.props.order[key];

    if(!fish){
      return <li key={key}>Sorry, fish no longer available!</li>
    }

    return (
      <li key={key}>
        <span>{count}lbs</span>
        {fish.name}
        <span className="price">{halp.formatPrice(count * fish.price)}</span>
      </li>
    )
  },
  render : function() {
    var orderIds = Object.keys(this.props.order);
    var total = orderIds.reduce((prevTotal, key)=> {
      var fish = this.props.fishes[key];
      var count = this.props.order[key];
      var isAvailable = fish && fish.status === 'available';

      if(fish && isAvailable){
        return prevTotal + (count * parseInt(fish.price) || 0);
      }
      return prevTotal;
    }, 0);

    return(
      <div className="order-wrap">
        <h2 className="order-title">Your Order</h2>
        <ul className="order">
          {orderIds.map(this.renderOrder)}
          <li className="total">
            <strong>Total:</strong>
            {halp.formatPrice(total)}
          </li>
        </ul>
      </div>
    )
  }
});

/* Inventory */
var Inventory = React.createClass({
  renderInventory : function(key){
    var linkState = this.props.linkState;
    return (
      <div className="fish-edit" key={key}>
        <input type="text" valueLink={linkState('fishes.'+key+'.name')} />
        <input type="text" valueLink={linkState('fishes.'+key+'.price')} />
        <select valueLink={linkState('fishes.'+key+'.status')}>
          <option value="available">Fresh!</option>
          <option value="unavailable">Sold Out!</option>
        </select>
        <textarea valueLink={linkState('fishes.'+key+'.desc')} ></textarea>
        <input type="text" valueLink={linkState('fishes.'+key+'.image')} />
      </div>
    )
  },
  render : function() {
    return(
      <div>
        <h2>Inventory</h2>
        {Object.keys(this.props.fishes).map(this.renderInventory)}
        <AddFishForm {...this.props}/>
        <button onClick={this.props.loadSamples}>Load Sample Fishes</button>
      </div>
    )
  }
});

/* store picker */
var StorePicker = React.createClass({
  mixins : [History],
  goToStore : function(event){
    event.preventDefault();
    var storeId = this.refs.storeId.value;
    this.history.pushState(null, '/store/' + storeId);
  },
  render : function() {
    return (
      <form className="store-selector" onSubmit={this.goToStore}>
        {/*comment*/}
        <h2>Please enter a store</h2>
        <input type="text" ref="storeId" defaultValue={halp.getFunName()} />
        <input type="Submit" value="Submit"/>
      </form>
    )
  }
});

/* not found */
var NotFound = React.createClass({
  render : function(){
    return <h1>Not Found!!</h1>
  }
});

/* routes */
var routes = (
  <Router history={createBrowserHistory()}>
    <Route path="/" component={StorePicker} />
    <Route path="/store/:storeId" component={App} />
    <Route path="*" component={NotFound} />
  </Router>
);

ReactDOM.render(routes, document.querySelector('#main'));
