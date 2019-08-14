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
  Animated,
  NativeSyntheticEvent,
  StyleSheet,
  StyleProp,
  TextInput,
  TextInputFocusEventData,
  TextInputProps
} from 'react-native';
import { primary as primaryColors } from './colors';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const styles = StyleSheet.create({
  textInput: {
    borderBottomWidth: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 8
  }
});

export default class extends React.Component<TextInputProps> {
  private readonly focus: Animated.Value;
  private readonly onBlur: (event: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  private readonly onFocus: (event: NativeSyntheticEvent<TextInputFocusEventData>) => void;

  constructor(props: TextInputProps) {
    super(props);

    this.focus = new Animated.Value(0);

    const blurAnimation = Animated.timing(this.focus, {
      duration: 150,
      toValue: 0
    });

    const focusAnimation = Animated.timing(this.focus, {
      duration: 150,
      toValue: 1
    });

    this.onBlur = event => {
      focusAnimation.stop();
      blurAnimation.start();
      const { onBlur } = this.props;
      if (onBlur) {
        onBlur(event);
      }
    };

    this.onFocus = event => {
      blurAnimation.stop();
      focusAnimation.start();
      const { onFocus } = this.props;
      if (onFocus) {
        onFocus(event);
      }
    };
  }

  render() {
    const { onBlur, onFocus, style, ...props } = this.props;

    let finalizedStyle: StyleProp<unknown>[] = [
      styles.textInput,
      {
        backgroundColor: this.focus.interpolate({
          inputRange: [0, 1],
          outputRange: ['#f5f5f5', '#eee']
        }),
        borderColor: this.focus.interpolate({
          inputRange: [0, 1],
          outputRange: ['#aaa', primaryColors.normal]
        })
      }
    ];

    if (style) {
      finalizedStyle = finalizedStyle.concat(style);
    }

    return (
      <AnimatedTextInput
        onBlur={this.onBlur}
        onFocus={this.onFocus}
        style={finalizedStyle}
        {...props} />
    );
  }
}
