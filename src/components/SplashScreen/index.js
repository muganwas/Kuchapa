import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  Image,
  StatusBar,
  ActivityIndicator,
  Platform,
  BackHandler,
  Dimensions,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import firebaseAuth from '@react-native-firebase/auth';
import rNES from 'react-native-encrypted-storage';
import SimpleToast from 'react-native-simple-toast';
import RNExitApp from 'react-native-exit-app';
import HomeScreen from '../HomeScreen';
import DashboardScreen from '../DashboardScreen';
import ProAllMessageScreen from '../ProAllMessageScreen';
import ProBookingScreen from '../ProBookingScreen';
import ProAcceptRejectJobScreen from '../ProAcceptRejectJobScreen';
import ProBookingDetailsScreen from '../ProBookingDetailsScreen';
import ProChatAcceptScreen from '../ProChatAcceptScreen';
import ProChatAfterBookingDetailsScreen from '../ProChatAfterBookingDetailsScreen';
import ProMapDirectionScreen from '../ProMapDirectionScreen';
import ProMyProfileScreen from '../ProMyProfileScreen';
import ProDashboardScreen from '../ProDashboardScreen';
import ProNotificationsScreen from '../ProNotificationsScreen';
import AfterSplashScreen from '../AfterSplashScreen';
import AccountTypeScreen from '../AccountTypeScreen';
import FacebookGoogleScreen from '../FacebookGoogleScreen';
import RegisterScreen from '../RegisterScreen';
import ProAddAddressScreen from '../ProAddAddressScreen';
import ContactUsScreen from '../ContactUsScreen';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import ProFacebookGoogleScreen from '../ProFacebookGoogleScreen';
import ProForgotPasswordScreen from '../ProForgotPasswordScreen';
import ProRegisterFBScreen from '../ProRegisterFBScreen';
import ProRegisterScreen from '../ProRegisterScreen';
import ProServiceSelectScreen from '../ProServiceSelectScreen';
import LoginPhoneScreen from '../LoginPhoneScreen';
import ProLoginPhoneScreen from '../ProLoginPhoneScreen';
import ProHomeScreen from '../ProHomeScreen';
import ProAccountTypeScreen from '../ProAccountTypeScreen';
import SelectAddressScreen from '../SelectAddressScreen';
import DialogComponent from '../DialogComponent';
import MapDirectionScreen from '../MapDirectionScreen';
import ProviderDetailsScreen from '../ProviderDetailsScreen';
import ChatScreen from '../ChatScreen';
import ListOfProviderScreen from '../ListOfProviderScreen';
import AddAddressScreen from '../AddAddressScreen';
import MyProfileScreen from '../MyProfileScreen';
import BookingScreen from '../BookingScreen';
import BookingDetailsScreen from '../BookingDetailsScreen';
import ChatAfterBookingDetailsScreen from '../ChatAfterBookingDetailsScreen';
import AllMessageScreen from '../AllMessageScreen';
import NotificationsScreen from '../NotificationsScreen';
import ProChatScreen from '../ProChatScreen';

import {
  updateUserDetails,
  updateProviderDetails,
  resetUserDetails,
  fetchProviderProfile,
  fetchUserProfile
} from '../../Redux/Actions/userActions';
import {
  getPendingJobRequest,
  getPendingJobRequestProvider,
  getAllWorkRequestPro,
  getAllWorkRequestClient,
} from '../../Redux/Actions/jobsActions';
import {
  getFCMToken,
  getUserType,
  autoLogin,
  inhouseLogin,
} from '../../controllers/users';
import { white } from '../../Constants/colors';
import Config from '../Config';

const screenWidth = Dimensions.get('screen').width;
const Android = Platform.OS === 'android';

class SplashScreen extends Component {
  constructor() {
    super();
    this.state = {
      id: null,
      isLoading: false,
      showDialog: false,
      dialogType: null,
      dialogTitle: '',
      dialogDesc: '',
      dialogLeftText: 'Cancel',
      dialogRightText: 'Retry',
    };
    this.leftButtonActon = null;
    this.rightButtonAction = null;
    this._unsubscribe;
  }

  async componentDidMount() {
    this.splashTimeOut();
  }

  async componentDidUpdate() {
    const {
      jobsInfo: { requestsProvidersFetched, requestsFetched },
      userInfo: { fetchingUserDetails, fetchingProviderDetails, providerDetailsFetched, userDetailsFetched }
    } = this.props;
    if (
      requestsProvidersFetched &&
      requestsFetched &&
      this.state.isLoading === true
    )
      this.setState({ isLoading: false });
    const userType = await rNES.getItem('userType');
    if (userType) {
      const isFetching = userType === 'Provider' ? fetchingProviderDetails : fetchingUserDetails;
      const fetched = userType === 'Provider' ? providerDetailsFetched : userDetailsFetched;
      if (!this.state.isLoading && userType && !isFetching && !fetched) {
        this.splashTimeOut();
      }
    }
  }

  showDialogAction = (
    { title, message, leftButtonText, rightButtonText, dialogType },
    leftButtonAction,
    rightButtonAction,
  ) => {
    this.leftButtonActon = leftButtonAction;
    this.rightButtonAction = rightButtonAction;
    this.setState({
      isLoading: false,
      showDialog: true,
      dialogType: dialogType || '...',
      dialogTitle: title,
      dialogDesc: message,
      dialogLeftText: leftButtonText,
      dialogRightText: rightButtonText,
    });
  };

  clearDialog = () =>
    this.setState({
      isLoading: false,
      showDialog: false,
      dialogType: null,
    });

  logout = async () => {
    const { resetUserDetails, navigation: { navigate } } = this.props;
    try {
      if (firebaseAuth().currentUser) firebaseAuth().signOut();
      await rNES.removeItem('userId');
      await rNES.removeItem('auth');
      await rNES.removeItem('firebaseId');
      await rNES.removeItem('email');
      await rNES.removeItem('idToken');
      await rNES.removeItem('userType');
      resetUserDetails();
      Config.socket.close();
      navigate('AfterSplash');
    } catch (e) {
      SimpleToast.show(e.message);
    }
  }

  splashTimeOut = async () => {
    try {
      const {
        navigation,
        fetchPendingJobProviderInfo,
        fetchPendingJobRequestInfo,
        fetchJobRequestHistoryPro,
        fetchJobRequestHistoryClient,
        fetchProviderProfile,
        fetchUserProfile,
      } = this.props;
      const userId = await rNES.getItem('userId');
      getUserType(
        () =>
          getFCMToken(
            userId,
            (userId, userType, fcmToken) =>
              autoLogin(
                { userId, userType, fcmToken },
                () => this.setState({ isLoading: true }),
                async (userId, userType, fcmToken) => {
                  const provider = userType === 'Provider';
                  inhouseLogin({
                    userId,
                    userType,
                    fcmToken,
                    fetchPendingJobInfo: provider
                      ? fetchPendingJobProviderInfo
                      : fetchPendingJobRequestInfo,
                    fetchJobRequestHistory: provider
                      ? fetchJobRequestHistoryPro
                      : fetchJobRequestHistoryClient,
                    updateAppUserDetails: provider
                      ? fetchProviderProfile
                      : fetchUserProfile,
                    onLoginFailure: message =>
                      this.showDialogAction(
                        {
                          title: 'LOGIN ERROR!',
                          message,
                          rightButtonText: 'Ok',
                          dialogType: 'Alert',
                        },
                        null,
                        () => {
                          this.clearDialog();
                          if (message.includes('re-authenticate') || message.includes('Not Found')) {
                            this.logout();
                            return navigation.navigate('AfterSplash');
                          }
                          if (Android) {
                            BackHandler.exitApp();
                          } else RNExitApp.exitApp();
                        },
                      ),
                    props: this.props,
                  });
                },
                () => navigation.navigate('AfterSplash'),
                this.logout
              ),
            () =>
              this.showDialogAction(
                {
                  title: 'AUTH TOKEN!',
                  message:
                    'Your device has not received an authentication token, check your internet connection and try again later',
                  rightButtonText: 'Ok',
                  dialogType: 'Alert',
                },
                null,
                () => {
                  this.clearDialog();
                  this.logout();
                  if (Android) BackHandler.exitApp();
                  else RNExitApp.exitApp();
                },
              ),
          ),
        () =>
          this.showDialogAction(
            {
              title: 'ENABLE NOTIFICATIONS!',
              message:
                "You don't have permission for notification. Please enable notification then try again",
              rightButtonText: 'Ok',
              dialogType: 'Alert',
            },
            null,
            () => {
              this.clearDialog();
              this.logout();
              if (Android) BackHandler.exitApp();
              else RNExitApp.exitApp();
            },
          )
      );
    } catch (e) {
      this.showDialogAction(
        {
          title: 'LOGIN ERROR!',
          message: 'Something went wrong, try again later',
          rightButtonText: 'Ok',
          dialogType: 'Alert',
        },
        null,
        () => {
          this.clearDialog();
          this.logout();
          if (Android) BackHandler.exitApp();
          else RNExitApp.exitApp();
        },
      );
    }
  };

  changeDialogVisibility = () =>
    this.setState(prevState => ({ showDialog: !prevState.showDialog }));

  render() {
    const {
      showDialog,
      dialogType,
      dialogTitle,
      dialogDesc,
      dialogLeftText,
      dialogRightText,
    } = this.state;
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={white} />
        <DialogComponent
          isDialogVisible={showDialog && dialogType !== null}
          transparent={true}
          animation="fade"
          width={screenWidth - 80}
          changeDialogVisibility={this.changeDialogVisibility}
          leftButtonAction={this.leftButtonActon}
          rightButtonAction={this.rightButtonAction}
          isLoading={false}
          titleText={dialogTitle}
          descText={dialogDesc}
          leftButtonText={dialogLeftText}
          rightButtonText={dialogRightText}
        />
        <Image
          style={{ width: 150, height: 150 }}
          source={require('../../images/kuchapa_logo.png')}
          resizeMode={'contain'}
        />

        {this.state.isLoading && (
          <View style={styles.loaderStyle}>
            <ActivityIndicator
              style={{ height: 80 }}
              color="#C00"
              size="large"
            />
          </View>
        )}
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    jobsInfo: state.jobsInfo,
    userInfo: state.userInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchPendingJobRequestInfo: (props, uid, navigateTo) => {
      dispatch(getPendingJobRequest(props, uid, navigateTo));
    },
    fetchPendingJobProviderInfo: (props, proId, navigateTo) => {
      dispatch(getPendingJobRequestProvider(props, proId, navigateTo));
    },
    fetchJobRequestHistoryPro: (providerId, only) => {
      dispatch(getAllWorkRequestPro(providerId, only));
    },
    fetchJobRequestHistoryClient: clientId => {
      dispatch(getAllWorkRequestClient(clientId));
    },
    updateUserDetails: details => {
      dispatch(updateUserDetails(details));
    },
    resetUserDetails: () => {
      dispatch(resetUserDetails());
    },
    updateProviderDetails: details => {
      dispatch(updateProviderDetails(details));
    },
    fetchProviderProfile: (proId, fcm, callBack) => {
      dispatch(fetchProviderProfile(proId, fcm, callBack))
    },
    fetchUserProfile: (userId, fcm, callBack) => {
      dispatch(fetchUserProfile(userId, fcm, callBack))
    }
  };
};

const SplashScreenComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SplashScreen);

const Stack = createNativeStackNavigator();

export default class App extends Component {
  render() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Splash'>
          <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="AccountType" component={AccountTypeScreen} options={{ title: "Account Type" }} />
          <Stack.Screen name="AllMessage" component={AllMessageScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="Booking" component={BookingScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="ChatAfterBookingDetails" component={ChatAfterBookingDetailsScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="FacebookGoogle" component={FacebookGoogleScreen} options={{ title: "Login" }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Forgot Password" }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
          <Stack.Screen name="LoginPhoneScreen" component={LoginPhoneScreen} options={{ title: "Phone Login" }} />
          <Stack.Screen name="SelectAddress" component={SelectAddressScreen} options={{ title: "Select Address" }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ header: () => <></>, title: "Dashboard" }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ header: () => <></>, title: "Home" }} />
          <Stack.Screen name="ListOfProviders" component={ListOfProviderScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="MapDirection" component={MapDirectionScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="MyProfile" component={MyProfileScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="ProviderDetails" component={ProviderDetailsScreen} options={{ header: () => <></> }} />

          <Stack.Screen name="Splash" component={SplashScreenComponent} options={{ header: () => <></> }} />
          <Stack.Screen name="AfterSplash" component={AfterSplashScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="ContactUs" component={ContactUsScreen} options={{ title: "Contact Us" }} />

          <Stack.Screen name="ProAllMessage" component={ProAllMessageScreen} options={{ header: () => <></>, title: "Messages" }} />
          <Stack.Screen name="ProAcceptRejectJob" component={ProAcceptRejectJobScreen} options={{ header: () => <></>, title: "Respond to Job" }} />
          <Stack.Screen name="ProBooking" component={ProBookingScreen} options={{ header: () => <></>, title: "Bookings" }} />
          <Stack.Screen name="ProBookingDetails" component={ProBookingDetailsScreen} options={{ header: () => <></>, title: "Booking Details" }} />
          <Stack.Screen name="ProLoginPhoneScreen" component={ProLoginPhoneScreen} options={{ title: "Phone Login" }} />
          <Stack.Screen name="ProDashboard" component={ProDashboardScreen} options={{ header: () => <></>, title: "Dashboard" }} />
          <Stack.Screen name="ProFacebookGoogle" component={ProFacebookGoogleScreen} options={{ title: "Login" }} />
          <Stack.Screen name="ProForgotPassword" component={ProForgotPasswordScreen} options={{ title: "Forgot Password" }} />
          <Stack.Screen name="ProAccountType" component={ProAccountTypeScreen} options={{ title: "Account Type" }} />
          <Stack.Screen name="ProAddAddress" component={ProAddAddressScreen} options={{ title: "My Address" }} />
          <Stack.Screen name="ProHome" component={ProHomeScreen} options={{ header: () => <></>, title: "Home" }} />
          <Stack.Screen name="ProMapDirection" component={ProMapDirectionScreen} options={{ header: () => <></>, title: "Directions" }} />
          <Stack.Screen name="ProChatAccept" component={ProChatAcceptScreen} options={{ header: () => <></>, title: "Respond to Chat" }} />
          <Stack.Screen name="ProChat" component={ProChatScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="ProChatAfterBookingDetails" component={ProChatAfterBookingDetailsScreen} options={{ header: () => <></>, title: "Chat" }} />
          <Stack.Screen name="ProMyProfile" component={ProMyProfileScreen} options={{ header: () => <></>, title: "Profile" }} />
          <Stack.Screen name="ProNotifications" component={ProNotificationsScreen} options={{ header: () => <></>, title: "Notifications" }} />
          <Stack.Screen name="ProRegisterFB" component={ProRegisterFBScreen} options={{ title: "Register" }} />
          <Stack.Screen name="ProRegister" component={ProRegisterScreen} options={{ title: "Register" }} />
          <Stack.Screen name="ProServiceSelect" component={ProServiceSelectScreen} options={{ title: "Select Services" }} />
        </Stack.Navigator>
      </NavigationContainer>
    )
  }
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
};
