import React, { Component } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import ProCustomMenuLayout from '../ProCustomMenuLayout';
import ProAddAddressScreen from '../ProAddAddressScreen';
import ProChatAcceptScreen from '../ProChatAcceptScreen';
import ProDashboardScreen from '../ProDashboardScreen';
import ProMyProfileScreen from '../ProMyProfileScreen';
import ProNotificationsScreen from '../ProNotificationsScreen';
import ProAllMessageScreen from '../ProAllMessageScreen';
import ContactUsScreen from '../ContactUsScreen';
import ProAcceptRejectJobScreen from '../ProAcceptRejectJobScreen';
import ProMapDirectionScreen from '../ProMapDirectionScreen';
import ProBookingScreen from '../ProBookingScreen';
import ProBookingDetailsScreen from '../ProBookingDetailsScreen';
import ProChatScreen from '../ProChatScreen';
import ProChatAfterBookingDetailsScreen from '../ProChatAfterBookingDetailsScreen';
import ProFacebookGoogleScreen from '../ProFacebookGoogleScreen';
import ProForgotPasswordScreen from '../ProForgotPasswordScreen';
import AfterSplashScreen from '../AfterSplashScreen';
import AccountTypeScreen from '../AccountTypeScreen';
import LoginPhoneScreen from '../LoginPhoneScreen';
import ProLoginPhoneScreen from '../ProLoginPhoneScreen';
import ProAccountTypeScreen from '../ProAccountTypeScreen';
import ProRegisterFBScreen from '../ProRegisterFBScreen';
import FacebookGoogleScreen from '../FacebookGoogleScreen';
import ProRegisterScreen from '../ProRegisterScreen';
import ProServiceSelectScreen from '../ProServiceSelectScreen';
import DrawerNavigator from '../DrawerNavigator';
import RegisterScreen from '../RegisterScreen';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import SelectAddressScreen from '../SelectAddressScreen';

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
          header: () => <></>
        }}
      >
        <Drawer.Screen name="FacebookGoogle" component={FacebookGoogleScreen} />
        <Drawer.Screen name="AfterSplash" component={AfterSplashScreen} />
        <Drawer.Screen name="ProChatAccept" component={ProChatAcceptScreen} />
        <Drawer.Screen name="Home" component={() => <DrawerNavigator />} />
        <Drawer.Screen name="Dashboard" component={() => <DrawerNavigator />} />
        <Drawer.Screen name="ProDashboard" component={ProDashboardScreen} />
        <Drawer.Screen name="ProHome" component={ProDashboardScreen} />
        <Drawer.Screen name="ProAddAddress" component={ProAddAddressScreen} />
        <Drawer.Screen name="ProMyProfile" component={ProMyProfileScreen} />
        <Drawer.Screen name="ProChatAfterBookingDetails" component={ProChatAfterBookingDetailsScreen} />
        <Drawer.Screen name="ProNotifications" component={ProNotificationsScreen} />
        <Drawer.Screen name="ProAllMessage" component={ProAllMessageScreen} />
        <Drawer.Screen name="ContactUs" component={ContactUsScreen} />
        <Drawer.Screen name="ProBooking" component={ProBookingScreen} />
        <Drawer.Screen name="LoginPhoneScreen" component={LoginPhoneScreen} />
        <Drawer.Screen name="ProLoginPhoneScreen" component={ProLoginPhoneScreen} />
        <Drawer.Screen name="ProChat" component={ProChatScreen} />
        <Drawer.Screen name="ProBookingDetails" component={ProBookingDetailsScreen} />
        <Drawer.Screen name="ProFacebookGoogle" component={ProFacebookGoogleScreen} />
        <Drawer.Screen name="ProForgotPassword" component={ProForgotPasswordScreen} />
        <Drawer.Screen name="AccountType" component={AccountTypeScreen} />
        <Drawer.Screen name="ProAccountType" component={ProAccountTypeScreen} />
        <Drawer.Screen name="ProAcceptRejectJob" component={ProAcceptRejectJobScreen} />
        <Drawer.Screen name="ProMapDirection" component={ProMapDirectionScreen} />
        <Drawer.Screen name="ProRegisterFB" component={ProRegisterFBScreen} />
        <Drawer.Screen name="ProRegister" component={ProRegisterScreen} />
        <Drawer.Screen name="Regisger" component={RegisterScreen} />
        <Drawer.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Drawer.Screen name="ProServiceSelect" component={ProServiceSelectScreen} />
        <Drawer.Screen name="SelectAddress" component={SelectAddressScreen} />
      </Drawer.Navigator>
    )
  }
}
