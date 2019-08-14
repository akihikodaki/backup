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
  AccessibilityProps,
  NativeSyntheticEvent,
  Platform,
  Text
} from 'react-native';
import { RouteComponentProps, withRouter } from 'react-router';

interface IntersectionProps {
  onPress?: (event: NativeSyntheticEvent<any>) => void;
}

interface WrappedProps extends AccessibilityProps, IntersectionProps {
  to?: never;
}

type WrappingProps<T> = Omit<T, 'onPress'> & RouteComponentProps & {
  onPress?: T extends IntersectionProps ? T['onPress'] : never;
  to: string;
};

type Props<T> = T extends React.ComponentType<infer P> ? P : never;

export default function link<T extends React.ComponentType<WrappedProps>>(Component: T) {
  class Link extends React.Component<WrappingProps<Props<T>>> {
    private readonly onPress: (event: NativeSyntheticEvent<unknown>) => void;

    constructor(props: WrappingProps<Props<T>>) {
      super(props);

      this.onPress = event => {
        if (this.props.onPress) {
          this.props.onPress(event);
        }

        if (!event.defaultPrevented) {
          this.props.history.push(this.props.to);
        }
      };
    }

    render() {
      const {
        history,
        location,
        match,
        staticContext,
        to,
        ...props
      } = this.props;

      if (Platform.OS == 'web') {
        (props as any).accessibilityRole = 'link';
        (props as any).href = to;
      }
 
      return <Component {...props as any} onPress={this.onPress} />;
    }
  }

  return withRouter(Link);
}

export const LinkText = link(Text);
