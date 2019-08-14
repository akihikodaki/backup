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
import State from '../../../redux/state';
import { primary as primaryColors } from '../../colors';
import { TouchableFeedback } from '../../touchable_feedback';
import typography from '../../typography';

const styles = StyleSheet.create({
  cardAuthorName: {
    marginBottom: 2,
    marginRight: 2
  },
  cardAuthorAcct: {
    alignItems: 'center',
    color: '#aaa',
    display: 'flex',
    marginBottom: 2,
    marginLeft: 2
  },
  follow: {
    alignItems: 'center',
    borderColor: primaryColors.dark,
    borderRadius: 4,
    borderWidth: 1,
    color: primaryColors.dark,
    display: 'flex',
    justifyContent: 'center',
    margin: 8,
    minWidth: 64,
    minHeight: 48,
    paddingHorizontal: 16
  },
  identifiers: { justifyContent: 'center' },
  root: {
    borderColor: '#aaa',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 12
  }
});

class Header extends React.PureComponent<{
  acct: string;
  following?: boolean | null;
  name?: null | string;
}> {
  render() {
    let follow;

    switch (this.props.following) {
      case false:
        follow = <Text style={[styles.follow, typography.subtitle2]}>Follow</Text>;
        break;

      case true:
        follow = <Text>Following</Text>;
        break;
    }

    return (
      <View style={styles.root}>
        <View style={styles.identifiers}>
          <Text style={[styles.cardAuthorName, typography.subtitle2]}>
            {this.props.name}
          </Text>
          <Text style={[styles.cardAuthorAcct, typography.caption]}>
            @{this.props.acct}
          </Text>
        </View>
        <TouchableFeedback>{follow}</TouchableFeedback>
      </View>
    );
  }
}

function mapStateToProps({ actors, page }: State) {
  if (!page.actor) {
    return { acct: '', name: null };
  }

  const actor = actors.get(page.actor.acct);

  return {
    acct: page.actor.acct,
    following: actor && actor.following,
    name: actor && (actor.name || actor.preferredUsername)
  };
}

export default connect(mapStateToProps)(Header);
