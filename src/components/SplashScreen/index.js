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
import rNES from 'react-native-encrypted-storage';
import RNExitApp from 'react-native-exit-app';
import HomeScreen from '../HomeScreen';
import DashboardScreen from '../DashboardScreen';
import ProDashboardScreen from '../ProDashboardScreen';
import AfterSplashScreen from '../AfterSplashScreen';
import AccountTypeScreen from '../AccountTypeScreen';
import FacebookGoogleScreen from '../FacebookGoogleScreen';
import RegisterScreen from '../RegisterScreen';
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
import {
  updateUserDetails,
  updateProviderDetails,
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
import { fetchCountryCodes } from '../../Redux/Actions/validationActions';
import { white } from '../../Constants/colors';

const screenWidth = Dimensions.get('screen').width;
const Android = Platform.OS === 'android';

class SplashScreen extends Component {
  constructor(props) {
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
  }

  componentDidMount() {
    setTimeout(() => this.splashTimeOut(), 3000);
    const { fetchCodes } = this.props;
    fetchCodes();
  }

  componentDidUpdate() {
    const {
      jobsInfo: { requestsProvidersFetched, requestsFetched },
    } = this.props;
    if (
      requestsProvidersFetched &&
      requestsFetched &&
      this.state.isLoading === true
    )
      this.setState({ isLoading: false });
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

  splashTimeOut = async () => {
    try {
      const {
        navigation,
        fetchPendingJobProviderInfo,
        fetchPendingJobRequestInfo,
        fetchJobRequestHistoryPro,
        fetchJobRequestHistoryClient,
        updateUserDetails,
        updateProviderDetails,
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
                (userId, userType, fcmToken) => {
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
                      ? updateProviderDetails
                      : updateUserDetails,
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
                          if (Android) BackHandler.exitApp();
                          else RNExitApp.exitApp();
                        },
                      ),
                    props: this.props,
                  });
                },
                () => navigation.navigate('AfterSplash'),
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
              if (Android) BackHandler.exitApp();
              else RNExitApp.exitApp();
            },
          ),
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
          if (Android) BackHandler.exitApp();
          else RNExitApp.exitApp();
        },
      );
      console.log('login err', e.message);
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
    fetchJobRequestHistoryPro: providerId => {
      dispatch(getAllWorkRequestPro(providerId));
    },
    fetchJobRequestHistoryClient: clientId => {
      dispatch(getAllWorkRequestClient(clientId));
    },
    updateUserDetails: details => {
      dispatch(updateUserDetails(details));
    },
    updateProviderDetails: details => {
      dispatch(updateProviderDetails(details));
    },
    fetchCodes: () => {
      dispatch(fetchCountryCodes());
    },
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
          <Stack.Screen name="Splash" component={SplashScreenComponent} options={{ header: () => <></> }} />
          <Stack.Screen name="AfterSplash" component={AfterSplashScreen} options={{ header: () => <></> }} />
          <Stack.Screen name="FacebookGoogle" component={FacebookGoogleScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="LoginPhoneScreen" component={LoginPhoneScreen} />
          <Stack.Screen name="ProLoginPhoneScreen" component={ProLoginPhoneScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="ProDashboard" component={ProDashboardScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AccountType" component={AccountTypeScreen} />
          <Stack.Screen name="ProFacebookGoogle" component={ProFacebookGoogleScreen} />
          <Stack.Screen name="ProForgotPassword" component={ProForgotPasswordScreen} />
          <Stack.Screen name="ProAccountType" component={ProAccountTypeScreen} />
          <Stack.Screen name="ProRegisterFB" component={ProRegisterFBScreen} />
          <Stack.Screen name="ProRegister" component={ProRegisterScreen} />
          <Stack.Screen name="ProServiceSelect" component={ProServiceSelectScreen} />
          <Stack.Screen name="SelectAddress" component={SelectAddressScreen} />
          <Stack.Screen name="ProHome" component={ProHomeScreen} />
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
