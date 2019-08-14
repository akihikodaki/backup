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
import { Animated, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { brand as brandColors } from '../colors';
import typography from '../typography';
import { LinkTouchableFeedback } from '../touchable_feedback';

const styles = StyleSheet.create({
  backgroundRoot: {
    overflow: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  backgroundNode: { flex: 1, marginLeft: -128, marginTop: -128 },
  backgroundLeaf: {
    position: 'absolute',
    shadowColor: '#fff',
    shadowRadius: 128,
    width: 128,
    height: 128
  },
  color: { color: '#fff' },
  home: {
    alignItems: 'center',
    borderColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    display: 'flex',
    marginTop: 32,
    minWidth: 64,
    minHeight: 48,
    paddingHorizontal: 16,
    textTransform: 'uppercase'
  },
  root: {
    alignItems: 'center',
    backgroundColor: brandColors.darkHalf,
    flex: 1,
    justifyContent: 'center'
  }
});

export default class extends React.PureComponent {
  private lightAnimation?: Animated.CompositeAnimation;

  private readonly lightAnimated: {
    readonly left: Animated.AnimatedInterpolation;
    readonly opacity: Animated.AnimatedValue;
    readonly top: Animated.AnimatedInterpolation;
  };

  constructor(props: {}) {
    super(props);

    const lightLeftValue = new Animated.Value(0);
    const lightTopValue = new Animated.Value(0);

    this.lightAnimated = {
      left: lightLeftValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
      }),
      opacity: new Animated.Value(0),
      top: lightTopValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
      })
    };

    this.componentDidMount = () => {
      const [rail, perpendicular] = Math.random() < 0.5 ?
        [lightLeftValue, lightTopValue] : [lightTopValue, lightLeftValue];

      const [corner, terminal] = Math.random() < 0.5 ?
        [0, 1] : [1, 0];

      this.lightAnimation = Animated.sequence([
        Animated.timing(
          this.lightAnimated.opacity, { duration: 512, toValue: 1 }),
        Animated.timing(rail, { duration: 4096, toValue: corner }),
        Animated.timing(rail, { duration: 4096, toValue: terminal }),
        Animated.timing(
          this.lightAnimated.opacity, { duration: 512, toValue: 0 })
      ]);

      rail.setValue(terminal);
      perpendicular.setValue(Math.round(Math.random()));
      this.lightAnimation.start(this.componentDidMount);
    };
  }

  componentWillUnmount() {
    if (this.lightAnimation) {
      this.lightAnimation.stop();
    }
  }

  render() {
    return (
      <View style={styles.root}>
        <View style={styles.backgroundRoot}>
          <View style={styles.backgroundNode}>
            <Animated.View
              style={[styles.backgroundLeaf, this.lightAnimated]} />
          </View>
        </View>
        <Icon name='help-outline' size={96} style={styles.color} />
        <Text style={[styles.color, typography.h3]}>Not Found</Text>
        <Text style={[styles.color, typography.body1]}>
          We couldn't find the requested page.
        </Text>
        <LinkTouchableFeedback to='/'>
          <Text style={[styles.color, styles.home, typography.h6]}>Home</Text>
        </LinkTouchableFeedback>
      </View>
    );
  }
}
