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
import {
  ListRenderItemInfo,
  SectionList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { connect } from 'react-redux';
import { Redirect, StaticContext } from 'react-router';
import { loadPageActor } from '../../../redux/action';
import State, { OutboxItem, OutboxSection } from '../../../redux/state';
import Composer from '../../composer';
import Note from '../../note';
import typography from '../../typography';
import NotFound from '../not_found';
import Header from './header';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { backgroundColor: '#eee', paddingLeft: 12, paddingVertical: 8 }
});

function extractKey(item: OutboxItem) {
  switch (item.type) {
  case 'Announce':
    return 'Announce ' + item.object;

  case 'Note':
    return 'Note ' + item.id;
  }
}

function renderItem({ item }: ListRenderItemInfo<OutboxItem>) {
  switch (item.type) {
  case 'Announce':
    return <Note announce={true} id={item.object} repliable />;

  case 'Note':
    return <Note announce={false} id={item.id} repliable />;
  }
}

function renderSectionHeader({ date }: OutboxSection, mounted: boolean) {
  return (
    <Text style={[styles.header, typography.caption]}>
      {mounted ? date.toLocaleDateString() : ''}
    </Text>
  );
}

class Actor extends React.PureComponent<{
  loadPageActor(acct: string): void;
  readonly acct: string;
  readonly initialized: boolean;
  readonly notFound: boolean;
  readonly outbox: ReadonlyArray<OutboxSection>;
  readonly redirectTo: null | string;
  readonly signedIn: boolean;
  readonly staticContext: StaticContext | undefined;
}, {
  renderSectionHeader(info: { section: OutboxSection }): React.ReactElement;
}> {
  constructor(props: Actor['props']) {
    super(props);

    this.state = {
      renderSectionHeader({ section }) {
        return renderSectionHeader(section, false);
      }
    }

    if (this.props.staticContext) {
      this.props.staticContext.statusCode = this.props.notFound ? 404 : 200;
    }
  }

  componentDidMount() {
    if (!this.props.initialized) {
      this.props.loadPageActor(this.props.acct);
    }

    this.setState({
      renderSectionHeader({ section }) {
        return renderSectionHeader(section, true);
      }
    });
  }

  componentDidUpdate() {
    if (!this.props.initialized) {
      this.props.loadPageActor(this.props.acct);
    }
  }

  render() {
    if (this.props.notFound) {
      return <NotFound />;
    }

    if (this.props.redirectTo) {
      return <Redirect to={`/@${encodeURI(this.props.redirectTo)}`} />;
    }

    return (
      <View style={styles.flex}>
        <Header />
        <SectionList
          inverted={true}
          keyExtractor={extractKey}
          renderItem={renderItem}
          renderSectionHeader={this.state.renderSectionHeader as any}
          sections={this.props.outbox}
          stickySectionHeadersEnabled={true} />
        {this.props.signedIn && <Composer />}
      </View>
    );
  }
}

function mapStateToProps(
  { session, page }: State,
  { acct }: { readonly acct: string }
) {
  const [redirectTo, host] = acct.split('@', 2);
  const signedIn = session.user != null;

  if (host == session.fingerHost) {
    return {
      initialized: true,
      notFound: false,
      outbox: [],
      redirectTo,
      signedIn
    };
  }

  const normalizedAcct = host ? acct : `${acct}@${session.fingerHost}`;

  if (!page.actor || page.actor.acct != normalizedAcct) {
    return {
      initialized: false,
      notFound: false,
      outbox: [],
      redirectTo: null,
      signedIn
    };
  }

  return {
    initialized: true,
    notFound: page.actor.notFound,
    outbox: page.actor.outbox,
    redirectTo: null,
    signedIn
  };
}

export default connect(mapStateToProps, { loadPageActor })(Actor);
