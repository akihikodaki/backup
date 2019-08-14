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
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle
} from 'react-native';
import { LinkText } from './link';

const styles = StyleSheet.create({
  miniverse: {
    fontFamily: 'Lobster Regular',
    fontSize: 34
  }
});

const styleArray: StyleProp<TextStyle>[] = [styles.miniverse];

export default function({ style, ...props }: TextProps) {
  const textStyle = style ? styleArray.concat(style) : styles.miniverse;

  return (
    <LinkText to='/' allowFontScaling={false} style={textStyle} {...props}>
      Miniverse
    </LinkText>
  );
}
