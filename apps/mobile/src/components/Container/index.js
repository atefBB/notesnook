import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Feather';
import {br, opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {getElevation, w} from '../../utils/utils';
import {DDS} from '../../../App';
export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

const AnimatedTouchableOpacity = Animatable.createAnimatableComponent(
  TouchableOpacity,
);

export const Container = ({
  children,
  bottomButtonOnPress,
  bottomButtonText,
  noBottomButton = false,
}) => {
  // State
  const [state, dispatch] = useTracked();
  const {colors} = state;

  const [buttonHide, setButtonHide] = useState(false);

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        setButtonHide(true);
      }, 300);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => {
        setButtonHide(false);
      }, 300);
    });
    return () => {
      Keyboard.removeListener('keyboardDidShow', () => {
        setTimeout(() => {
          setButtonHide(true);
        }, 300);
      });
      Keyboard.removeListener('keyboardDidHide', () => {
        setTimeout(() => {
          setButtonHide(false);
        }, 300);
      });
    };
  }, []);
  // Render

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',

        backgroundColor: colors.bg,
      }}>
      <KeyboardAvoidingView
        behavior="padding"
        enabled={Platform.OS === 'ios' ? true : false}
        style={{
          height: '100%',
        }}>
        {children}

        {noBottomButton ? null : (
          <Animatable.View
            transition={['translateY', 'opacity']}
            useNativeDriver={true}
            duration={250}
            style={{
              width: '100%',
              opacity: buttonHide ? 0 : 1,
              position: 'absolute',
              paddingHorizontal: 12,
              zIndex: 10,
              bottom: 10,
              transform: [
                {
                  translateY: buttonHide ? 200 : 0,
                },
              ],
            }}>
            <AnimatedTouchableOpacity
              onPress={bottomButtonOnPress}
              activeOpacity={opacity}
              style={{
                ...getElevation(5),
                width: '100%',

                alignSelf: 'center',
                borderRadius: br,
                backgroundColor: colors.accent,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 0,
              }}>
              <View
                style={{
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  flexDirection: 'row',
                  width: '100%',
                  padding: pv,
                  paddingVertical: pv + 5,
                }}>
                <Icon name="plus" color="white" size={SIZE.xl} />
                <Text
                  style={{
                    fontSize: SIZE.md,
                    color: 'white',
                    fontFamily: WEIGHT.regular,
                    textAlignVertical: 'center',
                  }}>
                  {'  ' + bottomButtonText}
                </Text>
              </View>
            </AnimatedTouchableOpacity>
          </Animatable.View>
        )}
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};

export default Container;
