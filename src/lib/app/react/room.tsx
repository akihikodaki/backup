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
  StyleSheet,
  Text,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Background from './background';
import Brand from './brand';
import { brand as brandColors, primary as primaryColors } from './colors';
import { TouchableFeedback } from './touchable_feedback';

const styles = StyleSheet.create({
  expander: { color: primaryColors.dark },
  root: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row' },
  footer: { flex: 1, flexDirection: 'row-reverse', overflow: 'hidden' },
  left: {
    backgroundColor: primaryColors.light,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowRadius: 12
  },
  leftBody: {
    backgroundColor: brandColors.light,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  leftSidebar: { justifyContent: 'space-between' },
  leftSidebarIcon: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    margin: 8,
    width: 48,
    height: 48
  },
  right: { overflow: 'hidden' },
  rightShadow: { height: 12, top: -12, shadowRadius: 12 },
  tab: {
    backgroundColor: primaryColors.dark,
    borderRadius: 48,
    color: primaryColors.light
  }
});

export default class extends React.PureComponent<{}, {
  footerWidth: number,
  footerHeight: number
}> {
  private expanded: boolean;
  private readonly expansion: Animated.Value;
  private readonly onLayoutFooter:
    (event: { nativeEvent: { layout: { width: number; height: number } } }) =>
      void;
  private readonly onPressLeftSidebarToggle: () => void;

  constructor(props: {}) {
    super(props);

    this.state = {
      footerWidth: 0,
      footerHeight: 0
    }

    this.expanded = false;
    this.expansion = new Animated.Value(0);

    this.onLayoutFooter = ({ nativeEvent }) => {
      this.setState({
        footerWidth: nativeEvent.layout.width,
        footerHeight: nativeEvent.layout.height
      });
    };

    this.onPressLeftSidebarToggle = () => {
      this.expanded = !this.expanded;
      Animated.timing(this.expansion, this.expanded ?
        { duration: 300, toValue: 1 } :
        { duration: 200, toValue: 0 }).start();
    };
  }

  render() {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Brand />
        </View>
        <View onLayout={this.onLayoutFooter} style={styles.footer}>
          <Animated.View style={[
            styles.right,
            {
              width: this.expansion.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  this.state.footerWidth - 64,
                  this.state.footerWidth / 2
                ]
              }),
              height: this.state.footerHeight
            }
          ]}>
            <View style={styles.rightShadow}></View>
            <Background />
          </Animated.View>
          <Animated.View style={[
            styles.left,
            {
              width: this.expansion.interpolate({
                inputRange: [0, 1],
                outputRange: [64, this.state.footerWidth / 2]
              }),
              height: this.state.footerHeight
            }
          ]}>
            <View style={styles.leftSidebar}>
              <TouchableFeedback>
                <Icon name='home' size={34} style={[styles.leftSidebarIcon, styles.tab]} />
              </TouchableFeedback>
              <TouchableFeedback onPress={this.onPressLeftSidebarToggle}>
                <Animated.View style={[
                  styles.leftSidebarIcon,
                  {
                    transform: [
                      {
                        rotate: this.expansion.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '-180deg']
                        })
                      }
                    ]
                  }
                ]}><Icon name='chevron-right' size={34} style={styles.expander} /></Animated.View>
              </TouchableFeedback>
            </View>
            <View style={[styles.leftBody, { width: this.state.footerWidth / 2 - 64 }]}>
              <Text>TODO</Text>
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }
}
