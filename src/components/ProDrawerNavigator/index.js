import React, { Component } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import ProCustomMenuLayout from '../ProCustomMenuLayout';
import ProDashboardScreen from '../ProDashboardScreen';

const Drawer = createDrawerNavigator();

export default class ProDrawerNavigator extends Component {
  render() {
    return (
      <Drawer.Navigator
        initialRouteName='ProDashboard'
        drawerContent={ProCustomMenuLayout}
        screenOptions={{
          drawerPosition: "left",
          drawerStyle: { width: 275 },
          drawerType: "slide",
          header: () => <></>,
          headerLeft: () => <></>
        }}
      >
        <Drawer.Screen name="ProDashboard" component={ProDashboardScreen} />
      </Drawer.Navigator>
    )
  }
}
