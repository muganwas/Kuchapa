import React, { Component } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardScreen from '../DashboardScreen';
import CustomMenuLayout from '../CustomMenuLayout';
import MyProfileScreen from '../MyProfileScreen';
import BookingScreen from '../BookingScreen';
import NotificationsScreen from '../NotificationsScreen';
import AllMessageScreen from '../AllMessageScreen';
import ContactUsScreen from '../ContactUsScreen';

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
        <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ header: () => <></> }} />
        <Drawer.Screen name="MyProfile" component={MyProfileScreen} options={{ header: () => <></> }} />
        <Drawer.Screen name="Booking" component={BookingScreen} options={{ header: () => <></> }} />
        <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ header: () => <></> }} />
        <Drawer.Screen name="AllMessage" component={AllMessageScreen} options={{ header: () => <></> }} />
        <Drawer.Screen name="ContactUs" component={ContactUsScreen} options={{ header: () => <></> }} />
      </Drawer.Navigator>
    )
  }
}
