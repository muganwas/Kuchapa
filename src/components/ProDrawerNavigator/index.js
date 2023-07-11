import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
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

const ProMyDrawerNavigator = createDrawerNavigator(
  {
    FacebookGoogle: { screen: FacebookGoogleScreen },
    AfterSplash: { screen: AfterSplashScreen },
    ProChatAccept: { screen: ProChatAcceptScreen },
    Home: { screen: () => <DrawerNavigator /> },
    Dashboard: { screen: () => <DrawerNavigator /> },
    ProDashboard: { screen: ProDashboardScreen },
    ProHome: { screen: ProDashboardScreen },
    ProAddAddress: { screen: ProAddAddressScreen },
    ProMyProfile: { screen: ProMyProfileScreen },
    ProChatAfterBookingDetails: { screen: ProChatAfterBookingDetailsScreen },
    ProNotifications: { screen: ProNotificationsScreen },
    ProAllMessage: { screen: ProAllMessageScreen },
    ContactUs: { screen: ContactUsScreen },
    ProBooking: { screen: ProBookingScreen },
    LoginPhoneScreen: { screen: LoginPhoneScreen },
    ProLoginPhoneScreen: { screen: ProLoginPhoneScreen },
    ProChat: { screen: ProChatScreen },
    ProBookingDetails: { screen: ProBookingDetailsScreen },
    ProFacebookGoogle: { screen: ProFacebookGoogleScreen },
    ProForgotPassword: { screen: ProForgotPasswordScreen },
    AccountType: { screen: AccountTypeScreen },
    ProAccountType: { screen: ProAccountTypeScreen },
    ProAcceptRejectJob: { screen: ProAcceptRejectJobScreen },
    ProMapDirection: { screen: ProMapDirectionScreen },
    ProRegisterFB: { screen: ProRegisterFBScreen },
    ProRegister: { screen: ProRegisterScreen },
    Regisger: { screen: RegisterScreen },
    ForgotPassword: { screen: ForgotPasswordScreen },
    ProServiceSelect: { screen: ProServiceSelectScreen },
    SelectAddress: { screen: SelectAddressScreen },
  },
  {
    initialRouteName: 'ProDashboard',
    drawerWidth: 275,
    drawerPosition: 'left',
    drawerType: 'push-screen',
    contentComponent: ProCustomMenuLayout,
    drawerOpenRoute: 'DrawerOpen',
    drawerCloseRoute: 'DrawerClose',
    drawerToggleRoute: 'DrawerToggle',
  },
);

const AppContainer = <NavigationContainer>{ProMyDrawerNavigator}</NavigationContainer>;

export default class ProDrawerNavigator extends Component {
  render() {
    return <AppContainer />;
  }
}
