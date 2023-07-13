import React, { Component } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardScreen from '../DashboardScreen';
import MapDirectionScreen from '../MapDirectionScreen';
import AccountTypeScreen from '../AccountTypeScreen';
import AfterSplashScreen from '../AfterSplashScreen';
import CustomMenuLayout from '../CustomMenuLayout';
import ChatScreen from '../ChatScreen';
import ChatAfterBookingDetailsScreen from '../ChatAfterBookingDetailsScreen';
import ContactUsScreen from '../ContactUsScreen';
import MyProfileScreen from '../MyProfileScreen';
import AllMessageScreen from '../AllMessageScreen';
import NotificationsScreen from '../NotificationsScreen';
import BookingScreen from '../BookingScreen';
import BookingDetailsScreen from '../BookingDetailsScreen';
import ProFacebookGoogleScreen from '../ProFacebookGoogleScreen';
import ProviderDetailsScreen from '../ProviderDetailsScreen';
import ProAccountTypeScreen from '../ProAccountTypeScreen';
import ListOfProviderScreen from '../ListOfProviderScreen';
import LoginPhoneScreen from '../LoginPhoneScreen';
import ProLoginPhoneScreen from '../ProLoginPhoneScreen';
import FacebookGoogleScreen from '../FacebookGoogleScreen';
import AddAddressScreen from '../AddAddressScreen';
import ProDrawerNavigator from '../ProDrawerNavigator';
import RegisterScreen from '../RegisterScreen';
import ProRegisterScreen from '../ProRegisterScreen';
import ProRegisterFBScreen from '../ProRegisterFBScreen';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import SelectAddressScreen from '../SelectAddressScreen';
import ProForgotPasswordScreen from '../ProForgotPasswordScreen';

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
          drawerType: "slide"
        }}
      >
        <Drawer.Screen name="Dashboard" component={DashboardScreen} />
        <Drawer.Screen name="ProDashboard" component={() => <ProDrawerNavigator />} />
        <Drawer.Screen name="FacebookGoogle" component={FacebookGoogleScreen} />
        <Drawer.Screen name="Register" component={RegisterScreen} />
        <Drawer.Screen name="ProRegisterFB" component={ProRegisterFBScreen} />
        <Drawer.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Drawer.Screen name="ProForgotPassword" component={ProForgotPasswordScreen} />
        <Drawer.Screen name="ProRegister" component={ProRegisterScreen} />
        <Drawer.Screen name="MapDirection" component={MapDirectionScreen} />
        <Drawer.Screen name="AfterSplash" component={AfterSplashScreen} />
        <Drawer.Screen name="AccountType" component={AccountTypeScreen} />
        <Drawer.Screen name="Chat" component={ChatScreen} />
        <Drawer.Screen name="Home" component={DashboardScreen} />
        <Drawer.Screen name="ProHome" component={() => <ProDrawerNavigator />} />
        <Drawer.Screen name="ProAccountType" component={ProAccountTypeScreen} />
        <Drawer.Screen name="ProviderDetails" component={ProviderDetailsScreen} />
        <Drawer.Screen name="ProFacebookGoogle" component={ProFacebookGoogleScreen} />
        <Drawer.Screen name="ListOfProviders" component={ListOfProviderScreen} />
        <Drawer.Screen name="LoginPhoneScreen" component={LoginPhoneScreen} />
        <Drawer.Screen name="ProLoginPhoneScreen" component={ProLoginPhoneScreen} />
        <Drawer.Screen name="AddAddress" component={AddAddressScreen} />
        <Drawer.Screen name="MyProfile" component={MyProfileScreen} />
        <Drawer.Screen name="Booking" component={BookingScreen} />
        <Drawer.Screen name="BookingDetails" component={BookingDetailsScreen} />
        <Drawer.Screen name="ChatAfterBookingDetails" component={ChatAfterBookingDetailsScreen} />
        <Drawer.Screen name="ContactUs" component={ContactUsScreen} />
        <Drawer.Screen name="AllMessage" component={AllMessageScreen} />
        <Drawer.Screen name="Notifications" component={NotificationsScreen} />
        <Drawer.Screen name="SelectAddress" component={SelectAddressScreen} />
      </Drawer.Navigator>
    )
  }
}
