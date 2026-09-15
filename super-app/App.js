import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppRouter from './src/router'; // Looks at src/router/index.js automatically

export default function App() {
  return (
    <SafeAreaProvider>
      <AppRouter />
    </SafeAreaProvider>
  );
}
