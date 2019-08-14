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
import { Animated, StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import State from '../../redux/state';
import Background from '../background';
import Brand from '../brand';
import { brand as brandColors } from '../colors';
import Form from './form';

const styles = StyleSheet.create({
  left: {
    backgroundColor: brandColors.light,
    overflow: 'hidden',
    shadowRadius: 12
  },
  leftBackgroundDark: {
    backgroundColor: brandColors.dark,
    position: 'absolute'
  },
  leftBackgroundNormal: {
    backgroundColor: brandColors.normal,
    position: 'absolute'
  },
  brand: {
    backgroundColor: '#0004',
    color: '#fff',
    minHeight: 48,
    paddingHorizontal: 8,
    position: 'relative'
  },
  root: { flex: 1, flexDirection: 'row-reverse' }
});

class Lobby extends React.PureComponent<{ fingerHost: string }, {
  width: number;
  height: number;
}> {
  private readonly leftBackgroundRotation: Animated.Value;
  private readonly leftBackgroundRotationAnimation: Animated.CompositeAnimation;
  private readonly onLayout:
    (event: { nativeEvent: { layout: { width: number; height: number } } }) =>
      void;

  constructor(props: { fingerHost: string }) {
    super(props);

    this.leftBackgroundRotation = new Animated.Value(0);

    this.leftBackgroundRotationAnimation = Animated.loop(Animated.timing(this.leftBackgroundRotation, {
      duration: 4e5,
      easing(value) {
        return value % 1;
      },
      toValue: 1
    }));

    this.onLayout = ({ nativeEvent: { layout } }) => {
      this.setState({ width: layout.width, height: layout.height });
    };

    this.state = { width: 0, height: 0 };
  }

  componentDidMount() {
    this.leftBackgroundRotationAnimation.start();
  }

  componentWillUnmount() {
    this.leftBackgroundRotationAnimation.stop();
  }

  render() {
    const leftWidth = this.state.width / 2;
    const leftBackgroundSize = Math.max(leftWidth, this.state.height) * 2;

    const leftBackgroundStyle = {
      top: (this.state.height - leftBackgroundSize) / 2,
      left: (leftWidth - leftBackgroundSize) / 2,
      width: leftBackgroundSize,
      height: leftBackgroundSize
    };

    return (
      <View onLayout={this.onLayout} style={styles.root}>
        <View style={{ width: leftWidth }}>
          <Background />
        </View>
        <View style={[styles.left, { width: leftWidth }]}>
          <Animated.View style={[
            styles.leftBackgroundNormal,
            leftBackgroundStyle,
            {
              transform: [
                {
                  rotate: this.leftBackgroundRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['20deg', '380deg']
                  }),
                },
                { translateX: -leftBackgroundSize / 1.8 }
              ]
            }
          ]} />
          <Animated.View style={[
            styles.leftBackgroundDark,
            leftBackgroundStyle,
            {
              transform: [
                {
                  rotate: this.leftBackgroundRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-140deg', '580deg']
                  }),
                },
                { translateX: -leftBackgroundSize / 1.5 }
              ]
            }
          ]} />
          <Brand style={styles.brand} />
          <Form />
        </View>
      </View>
    );
  }
}

function mapStateToProps({ session: { fingerHost } }: State) {
  return { fingerHost };
}

export default connect(mapStateToProps)(Lobby);
