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
import { signUpOrSignIn } from '../../redux/action';
import State from '../../redux/state';
import { primary as primaryColors } from '../colors';
import FilledTextField from '../filled_text_field';
import { TouchableFeedback } from '../touchable_feedback';
import typography from '../typography';

const styles = StyleSheet.create({
  acct: {
    alignItems: 'center',
    flexDirection: 'row',
    margin: 8,
    maxWidth: 288
  },
  acctText: { color: '#111' },
  button: {
    alignItems: 'center',
    color: primaryColors.dark,
    display: 'flex',
    justifyContent: 'center',
    margin: 8,
    minHeight: 48
  },
  caption: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 8,
    textAlign: 'center'
  },
  form: {
    alignItems: 'center',
    backgroundColor: '#fffd',
    marginVertical: 'auto'
  },
  password: { maxWidth: 256 },
  username: { marginHorizontal: 4 }
});

class Form extends React.PureComponent<Props, {
  username: string;
  password: string;
}> {
  private readonly onChangeUsername: (username: string) => void;
  private readonly onChangePassword: (password: string) => void;
  private readonly onPress: () => void;

  constructor(props: Props) {
    super(props);

    this.onChangePassword = password => this.setState({ password });
    this.onChangeUsername = username => this.setState({ username });

    this.onPress =
      () => this.props.signUpOrSignIn(this.state.username, this.state.password);

    this.state = { username: '', password: '' };
  }

  render() {
    return (
      <View style={[styles.form]}>
        <Text style={styles.caption}>A place where you find what you like</Text>
        <View style={styles.acct}>
          <Text style={styles.acctText}>@</Text>
          <FilledTextField
            onChangeText={this.onChangeUsername}
            placeholder='username'
            style={styles.username}
            value={this.state.username} />
          <Text style={styles.acctText}>@{this.props.fingerHost}</Text>
        </View>
        <FilledTextField
          onChangeText={this.onChangePassword}
          placeholder='Password'
          secureTextEntry={true}
          style={styles.password}
          value={this.state.password} />
        <TouchableFeedback onPress={this.onPress}>
          <Text style={[styles.button, typography.subtitle2]}>
            Sign up / Sign in
          </Text>
        </TouchableFeedback>
      </View>
    );
  }
}

function mapStateToProps({ session: { fingerHost } }: State) {
  return { fingerHost };
}

interface Props {
  fingerHost: string;
  signUpOrSignIn(username: string, password: string): void;
}

export default connect(mapStateToProps, { signUpOrSignIn })(Form);
