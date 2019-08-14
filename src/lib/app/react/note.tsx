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

import { toASCII } from 'punycode';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';
import State from '../redux/state';
import { primary as primaryColors } from './colors';
import {
  LinkTouchableFeedbackView,
  TouchableFeedbackView
} from './touchable_feedback';
import typography from './typography';

const styles = StyleSheet.create({
  announce: { color: primaryColors.normal, fontSize: 24 },
  authorName: {
    alignItems: 'center',
    display: 'flex',
    marginBottom: 2,
    marginRight: 2
  },
  authorAcct: {
    alignItems: 'center',
    color: '#aaa',
    display: 'flex',
    marginBottom: 2,
    marginLeft: 2
  },
  button: { margin: 4, minWidth: 48 },
  caption: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { margin: 4, paddingLeft: 12 },
  content: { marginTop: 2 },
  likeIcon: { color: '#aaa', marginRight: 4 },
  likeText: {
    color: '#aaa',
    display: 'flex',
    alignItems: 'center',
    marginLeft: 4
  },
  main: { margin: 4, minWidth: 48, minHeight: 48 },
  row: { flexDirection: 'row' },
  standaloneIcon: {
    color: '#aaa',
    display: 'flex',
    justifyContent: 'center'
  },
  time: { color: '#aaa', marginLeft: 2 }
});

class Note extends React.PureComponent<{
  readonly to: string;
  readonly announce: boolean;
  readonly attributedTo: {
    readonly acct: string;
    readonly name?: null | string;
  };
  readonly content: string;
  readonly likes: number;
  readonly published: Date;
  readonly repliable: boolean;
}, { isMounted: boolean }> {
  constructor(props: Note['props']) {
    super(props);
    this.state = { isMounted: false };
  }

  componentDidMount() {
    this.setState({ isMounted: true });
  }

  render() {
    return (
      <View style={styles.card}>
        <LinkTouchableFeedbackView to={this.props.to} view={{ style: styles.main }}>
          <View style={styles.caption}>
            <View style={styles.row}>
              {this.props.announce &&
                <Icon name='forward' style={styles.announce} />}
              <Text style={[styles.authorName, typography.subtitle2]}>
                {this.props.attributedTo.name}
              </Text>
              <Text style={[styles.authorAcct, typography.caption]}>
                @{this.props.attributedTo.acct}
              </Text>
            </View>
            <Text style={[styles.time, typography.caption]}>
              {this.state.isMounted &&
                  this.props.published.toLocaleTimeString()}
            </Text>
          </View>
          <Text style={[styles.content, typography.body1]}>
            {this.props.content}
          </Text>
        </LinkTouchableFeedbackView>
        <View style={styles.row}>
          {this.props.repliable && (
            <LinkTouchableFeedbackView to={this.props.to} view={{ style: styles.button }}>
              <Icon name='reply' size={24} style={styles.standaloneIcon} />
            </LinkTouchableFeedbackView>
          )}
          <TouchableFeedbackView view={{ style: styles.button }}>
            <Icon name='playlist-add' size={24} style={styles.standaloneIcon} />
          </TouchableFeedbackView>
          <TouchableFeedbackView view={{ style: [styles.row, styles.button] }}>
            <Icon name='favorite-border' size={24} style={styles.likeIcon} />
            <Text style={styles.likeText}>{this.props.likes}</Text>
          </TouchableFeedbackView>
        </View>
      </View>
    );
  }
}

function mapStateToProps(
  { actors, notes, session }: State,
  { id }: { readonly id: string }
) {
  const note = notes.get(id);
  if (!note) {
    throw new Error;
  }

  const attributedToActor = actors.get(note.attributedTo);

  return {
    to: id.substring(('https://' + toASCII(session.host)).length),
    attributedTo: {
      acct: note.attributedTo,
      name: attributedToActor && (
        attributedToActor.name ||
        attributedToActor.preferredUsername)
    },
    content: note.content,
    likes: note.likes,
    published: note.published
  };
}

export default connect(mapStateToProps)(Note);
