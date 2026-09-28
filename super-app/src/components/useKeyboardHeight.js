// src/components/useKeyboardHeight.js
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Dimensions } from 'react-native';

export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const screenH = Dimensions.get('window').height;
      const raw = e?.endCoordinates?.height || 0;

      // On some Android devices inside <Modal>, height comes back as the
      // full screen. Clamp to a sane maximum (60% of screen).
      const sane = raw > screenH * 0.6 ? 0 : raw;

      setHeight(sane);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}