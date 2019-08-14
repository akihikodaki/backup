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
  Platform,
  View,
  ViewProps,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableOpacityProps,
  TouchableNativeFeedbackProps
} from 'react-native';
import link from './link';

function TouchableNativeFeedbackView({
  children,
  view,
  ...touchable
}: TouchableNativeFeedbackProps & {
  children?: React.ReactNode,
  view?: ViewProps
}) {
  return (
    <TouchableNativeFeedback {...touchable}>
      <View {...view}>{children}</View>
    </TouchableNativeFeedback>
  );
}

function TouchableOpacityView({
  children,
  view,
  ...touchable
}: TouchableOpacityProps & {
  children?: React.ReactNode,
  view?: ViewProps
}) {
  return (
    <TouchableOpacity {...touchable} {...view}>
      {children}
    </TouchableOpacity>
  );
}

export const TouchableFeedback = Platform.OS == 'android' ? TouchableNativeFeedback : TouchableOpacity as React.ComponentType;
export const TouchableFeedbackView = Platform.OS == 'android' ? TouchableNativeFeedbackView : TouchableOpacityView;
export const LinkTouchableFeedback = link(TouchableFeedback);
export const LinkTouchableFeedbackView = link(TouchableFeedbackView);
