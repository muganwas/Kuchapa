import 'react-native-gesture-handler';
import { enableLatestRenderer } from 'react-native-maps';
import React from 'react';
import { UIManager } from 'react-native';
import { Provider } from 'react-redux';
import { AppRegistry } from 'react-native';
import App from './src/components/SplashScreen';
import { name as appName } from './app.json';
import configureStore from './store';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

enableLatestRenderer();
const store = configureStore();

const IniApp = () => (
    <Provider store={store}>
        <App />
    </Provider >
);

AppRegistry.registerComponent(appName, () => IniApp);
