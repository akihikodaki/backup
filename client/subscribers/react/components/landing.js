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
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import React from 'react';
import { connect } from 'react-redux';
import { signin, signup } from '../../../actions/session';

export default connect()(class extends React.PureComponent {
  componentWillMount() {
    this.singin = event => {
      event.preventDefault();

      this.props.dispatch(signin(
        event.target.elements.username.value,
        event.target.elements.password.value
      ));
    };

    this.signup = event => {
      event.preventDefault();

      this.props.dispatch(signup(
        event.target.elements.username.value,
        event.target.elements.password.value
      ));
    };
  }

  render() {
    return (
      <div>
        <form onSubmit={this.singin}>
          <input name='username' placeholder='Username' type='text'></input>
          <input name='password' placeholder='Password' type='password'></input>
          <button>Sign in</button>
        </form>
        <form onSubmit={this.signup}>
          <input name='username' placeholder='Username' type='text'></input>
          <input name='password' placeholder='Password' type='password'></input>
          <button>Sign up</button>
        </form>
      </div>
    );
  }
});
