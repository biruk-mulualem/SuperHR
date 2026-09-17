import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRouter from './src/router'; // Looks at src/router/index.js automatically

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppRouter />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}