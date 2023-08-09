import React, { Component } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import ProCustomMenuLayout from '../ProCustomMenuLayout';
import ProDashboardScreen from '../ProDashboardScreen';
import ProMyProfileScreen from '../ProMyProfileScreen';
import ProBookingScreen from '../ProBookingScreen';
import ProNotificationsScreen from '../ProNotificationsScreen';
import ProAllMessageScreen from '../ProAllMessageScreen';
import ContactUsScreen from '../ContactUsScreen';

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
        <Drawer.Screen name="ProDashboard" component={ProDashboardScreen} options={{ header: () => <></> }} />
        <Drawer.Screen name="ProMyProfile" component={ProMyProfileScreen} options={{ header: () => <></> }} />
        <Drawer.Screen name="ProBooking" component={ProBookingScreen} options={{ header: () => <></> }} />
        <Drawer.Screen name="ProNotifications" component={ProNotificationsScreen} options={{ header: () => <></> }} />
        <Drawer.Screen name="ProAllMessage" component={ProAllMessageScreen} options={{ header: () => <></> }} />
        <Drawer.Screen name="ContactUs" component={ContactUsScreen} options={{ header: () => <></> }} />
      </Drawer.Navigator>
    )
  }
}
