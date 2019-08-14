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
import { StyleSheet, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { Redirect, StaticContext } from 'react-router';
import { loadPageNote } from '../../redux/action';
import State from '../../redux/state';
import Composer from '../composer';
import Main from '../note';
import typography from '../typography';
import NotFound from './not_found';

const styles = StyleSheet.create({
  header: { backgroundColor: '#eee', paddingLeft: 12, paddingVertical: 8 }
});

class Note extends React.PureComponent<{
  acct: string;
  id: string;
  initialized: boolean;
  loadPageNote(acct: string, id: string): void;
  notFound: boolean;
  published: Date | null;
  redirectTo: null | string;
  signedIn: boolean;
  staticContext: StaticContext | undefined;
  uri: null | string;
}, { mounted: boolean }> {
  constructor(props: Note['props']) {
    super(props);
    this.state = { mounted: false };
  }

  componentDidMount() {
    if (!this.props.initialized) {
      this.props.loadPageNote(this.props.acct, this.props.id);
    }

    this.setState({ mounted: true });
  }

  componentDidUpdate() {
    if (!this.props.initialized) {
      this.props.loadPageNote(this.props.acct, this.props.id);
    }
  }

  render() {
    if (this.props.notFound) {
      return <NotFound />;
    }

    if (this.props.redirectTo) {
      return <Redirect to={`/@${encodeURI(this.props.redirectTo)}/${encodeURI(this.props.id)}`} />;
    }

    return (
      <View>
        {this.props.uri && (
          <Main announce={false} id={this.props.uri} repliable={false} />
        )}
        <Text style={[styles.header, typography.caption]}>
          {
            this.state.mounted && this.props.published ?
              this.props.published.toLocaleDateString() : ''
          }
        </Text>
        {this.props.signedIn && <Composer />}
      </View>
    );
  }
}

function mapStateToProps(
  { notes, page, session }: State,
  { acct, id }: { readonly acct: string; readonly id: string }
) {
  const [redirectTo, host] = acct.split('@', 2);
  const signedIn = session.user != null;

  if (host == session.fingerHost) {
    return {
      initialized: true,
      notFound: false,
      published: null,
      redirectTo,
      signedIn,
      uri: null
    };
  }

  if (!page.note ||
    page.note.params.acct != acct ||
    page.note.params.id != id
  ) {
    return {
      initialized: false,
      notFound: false,
      published: null,
      redirectTo: null,
      signedIn,
      uri: null
    };
  }

  const note = notes.get(page.note.id);

  return {
    initialized: true,
    notFound: page.note.notFound,
    published: note ? note.published : null,
    redirectTo: null,
    signedIn,
    uri: page.note.id
  };
}

export default connect(mapStateToProps, { loadPageNote })(Note);
