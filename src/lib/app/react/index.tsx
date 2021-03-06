/*
  Copyright (C) 2019  Miniverse authors

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

import * as React from 'react';
import { connect } from 'react-redux';
import State from '../redux/state';
import Lobby from './lobby';
import Room from './room';

class Index extends React.PureComponent<Props> {
  render() {
    return this.props.isSignedIn ? <Room /> : <Lobby />;
  }
}

function mapStateToProps({ session }: State) {
  return { isSignedIn: session.user != null };
}

interface Props {
  readonly isSignedIn: boolean;
}

export default connect(mapStateToProps)(Index);
