import React, { Component } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardScreen from '../DashboardScreen';
import CustomMenuLayout from '../CustomMenuLayout';

const Drawer = createDrawerNavigator();

export default class DrawerNavigator extends Component {
  render() {
    return (
      <Drawer.Navigator
        initialRouteName='Dashboard'
        drawerContent={CustomMenuLayout}
        screenOptions={{
          drawerPosition: "left",
          drawerStyle: { width: 275 },
          drawerType: "slide",
          header: () => <></>,
          headerLeft: () => <></>
        }}
      >
        <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ headerLeft: () => <></> }} />
      </Drawer.Navigator>
    )
  }
}
