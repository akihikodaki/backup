/*
  Copyright (C) 2018  Akihiko Odaki <nekomanma@pixiv.co.jp>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import { signin } from './actions/session';
import reducers from './reducers';

const store = createStore(reducers, applyMiddleware(thunk));

const Home = connect()(class extends React.PureComponent {
  componentWillMount() {
    this.handleSubmit = event => {
      event.preventDefault();
      this.props.dispatch(signin(
        event.target.elements.username.value,
        event.target.elements.password.value
      ));
    };
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input name='username' placeholder='Username' type='text'></input>
        <input name='password' placeholder='Password' type='password'></input>
        <button>Sign in</button>
      </form>
    );
  }
});

class Root extends React.PureComponent {
  render() {
    return (
      <Provider store={store}><Home /></Provider>
    );
  }
}

render(<Root />, document.getElementById('root'));
