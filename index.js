import 'react-native-gesture-handler';
import { enableLatestRenderer } from 'react-native-maps';
import React from 'react';
import { Provider } from 'react-redux';
import { AppRegistry } from 'react-native';
import App from './src/components/SplashScreen';
import { name as appName } from './app.json';
import configureStore from './store';

enableLatestRenderer();
const store = configureStore();

const IniApp = () => (
    <Provider store={store}>
        <App />
    </Provider >
);

AppRegistry.registerComponent(appName, () => IniApp);
