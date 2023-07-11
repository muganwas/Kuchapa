import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
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

const MyDrawerNavigator = createDrawerNavigator(
  {
    ProDashboard: { screen: ProDrawerNavigator },
    FacebookGoogle: { screen: FacebookGoogleScreen },
    Register: { screen: RegisterScreen },
    ProRegisterFB: { screen: ProRegisterFBScreen },
    ForgotPassword: { screen: ForgotPasswordScreen },
    ProForgotPassword: { screen: ProForgotPasswordScreen },
    ProRegister: { screen: ProRegisterScreen },
    MapDirection: { screen: MapDirectionScreen },
    AfterSplash: { screen: AfterSplashScreen },
    AccountType: { screen: AccountTypeScreen },
    Chat: { screen: ChatScreen },
    Home: { screen: DashboardScreen },
    ProHome: { screen: () => <ProDrawerNavigator /> },
    ProAccountType: { screen: ProAccountTypeScreen },
    Dashboard: { screen: DashboardScreen },
    ProviderDetails: { screen: ProviderDetailsScreen },
    ProFacebookGoogle: { screen: ProFacebookGoogleScreen },
    ListOfProviders: { screen: ListOfProviderScreen },
    LoginPhoneScreen: { screen: LoginPhoneScreen },
    ProLoginPhoneScreen: { screen: ProLoginPhoneScreen },
    AddAddress: { screen: AddAddressScreen },
    MyProfile: { screen: MyProfileScreen },
    Booking: { screen: BookingScreen },
    BookingDetails: { screen: BookingDetailsScreen },
    ChatAfterBookingDetails: { screen: ChatAfterBookingDetailsScreen },
    ContactUs: { screen: ContactUsScreen },
    AllMessage: { screen: AllMessageScreen },
    Notifications: { screen: NotificationsScreen },
    SelectAddress: { screen: SelectAddressScreen },
  },
  {
    initialRouteName: 'Dashboard',
    drawerWidth: 275,
    drawerPosition: 'left',
    drawerType: 'push-screen',
    contentComponent: CustomMenuLayout,
  },
);

const AppContainer = <NavigationContainer>{MyDrawerNavigator}</NavigationContainer>;

export default class DrawerNavigator extends Component {
  render() {
    return <AppContainer />;
  }
}
