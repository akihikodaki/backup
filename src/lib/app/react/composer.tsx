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
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';
import { send } from '../redux/action';
import { primary as primaryColors } from './colors';
import FilledTextField from './filled_text_field';
import { TouchableFeedbackView } from './touchable_feedback';

const styles = StyleSheet.create({
  composer: {
    borderColor: '#aaa',
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 4
  },
  button: { margin: 4 },
  buttonIcon: {
    alignItems: 'center',
    color: primaryColors.dark,
    display: 'flex',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48
  },
  content: { flex: 1, margin: 4 },
  flex: { flex: 1 }
});

class Composer extends React.PureComponent<
  { send(content: string): void },
  { content: string }
> {
  private readonly onChangeContent: (content: string) => void;
  private readonly onSend: () => void;

  constructor(props: { send(content: string): void }) {
    super(props);

    this.onChangeContent = content => this.setState({ content });

    this.onSend = () => {
      this.props.send(this.state.content);
      this.setState({ content: '' });
    };

    this.state = { content: '' };
  }

  render() {
    return (
      <View style={styles.composer}>
        <TouchableFeedbackView style={styles.button}>
          <Icon name='photo' size={24} style={styles.buttonIcon} />
        </TouchableFeedbackView>
        <View style={styles.content}>
          <FilledTextField
            onChangeText={this.onChangeContent}
            onSubmitEditing={this.onSend}
            placeholder='Meow?'
            style={styles.flex}
            value={this.state.content} />
        </View>
        <TouchableFeedbackView onPress={this.onSend} style={styles.button}>
          <Icon name='send' size={24} style={styles.buttonIcon} />
        </TouchableFeedbackView>
      </View>
    );
  }
}

export default connect(null, { send })(Composer);
