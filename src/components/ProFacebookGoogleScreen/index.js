import React, { Component } from 'react';
import {
  View,
  StatusBar,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  BackHandler,
} from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import 'react-native-gesture-handler';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  getAllWorkRequestPro,
  getPendingJobRequestProvider
} from '../../Redux/Actions/jobsActions';
import Config from '../Config';
import WaitingDialog from '../WaitingDialog';
import DialogComponent from '../DialogComponent';
import {
  updateProviderDetails,
  updateProviderAuthToken,
  fetchProviderProfile
} from '../../Redux/Actions/userActions';
import { font_size } from '../../Constants/metrics';
import { themeRed, black, white, lightGray } from '../../Constants/colors';
import { emailCheck, passwordCheck } from '../../misc/helpers';
import {
  facebookLoginTask,
  fbGmailLoginTask,
  responseFbCallback,
  googleLoginTask,
  checkValidation,
  authenticateTask,
} from '../../controllers/users';
import { withNavigation } from '@react-navigation/compat';

const screenWidth = Dimensions.get('window').width;
const REGISTER_URL = Config.baseURL + 'employee/register';
const PRO_GET_PROFILE = Config.baseURL + 'employee/';
const AUTHENTICATE_URL = Config.baseURL + 'employee/authenticate';
const Android = Platform.OS === 'android';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
  return !Android ? (
    <View
      style={{
        width: '100%',
        height: STATUS_BAR_HEIGHT,
        backgroundColor: white,
      }}>
      <StatusBar barStyle="dark-content" />
    </View>
  ) : (
    <StatusBar barStyle="dark-content" backgroundColor={white} />
  );
};

class FacebookGoogleScreen extends Component {
  constructor(props) {
    super();
    const accountType = props.route.params.accountType;
    this.state = {
      accountType,
      email: '',
      password: '',
      opacity: 1,
      isLoading: false,
      firebaseId: '',
      loginType: null,
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
    GoogleSignin.configure();
    BackHandler.addEventListener('hardwareBackPress', () =>
      this.handleBackButtonClick(),
    );
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
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

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
    return true;
  };

  responseFbCallbackPro = (error, result) =>
    responseFbCallback(
      error,
      result,
      (firebaseId, loginType) => this.setState({ firebaseId, loginType }),
      this.fbGmailLoginTaskPro,
    );

  googleLoginTaskPro = async () =>
    await googleLoginTask(
      (firebaseId, loginType) => this.setState({ firebaseId, loginType }),
      this.fbGmailLoginTaskPro,
    );

  fbGmailLoginTaskPro = async (name, email, image, loginType, idToken) =>
    await fbGmailLoginTask({
      name,
      email,
      image,
      userType: 'Provider',
      firebaseId: this.state.firebaseId,
      idToken,
      accountType: this.state.accountType,
      registerUrl: REGISTER_URL,
      fetchProfileUrl: PRO_GET_PROFILE,
      loginType,
      updateAppUserDetails: this.props.updateProviderDetails,
      fetchAppUserJobRequests: this.props.fetchProvidersJobRequests,
      fetchJobRequestHistory: this.props.fetchJobRequestHistory,
      toggleLoading: this.changeWaitingDialogVisibility,
      onError: message =>
        this.showDialogAction(
          {
            title: 'LOGIN ERROR!',
            message,
            leftButtonText: 'Cancel',
            rightButtonText: 'Retry',
            dialogType: 'Error',
          },
          this.toggleDialogVisibility,
          () => {
            this.toggleDialogVisibility();
            this.fbGmailLoginTaskPro(name, email, image, loginType, idToken);
          },
        ),
      props: this.props,
    });

  authenticateTaskPro = async () =>
    await authenticateTask({
      email: this.state.email,
      password: this.state.password,
      userType: 'Provider',
      authURL: AUTHENTICATE_URL,
      fetchAppUserJobRequests: this.props.fetchProvidersJobRequests,
      fetchJobRequestHistory: this.props.fetchJobRequestHistory,
      updateAppUserDetails: this.props.updateProviderDetails,
      toggleLoading: this.changeWaitingDialogVisibility,
      onError: message => {
        this.showDialogAction(
          {
            title: 'AUTH ERROR!',
            message,
            leftButtonText: 'Cancel',
            rightButtonText: 'Retry',
            dialogType: 'Error',
          },
          this.toggleDialogVisibility,
          () => {
            this.toggleDialogVisibility();
            this.authenticateTaskPro();
          },
        );
      },
      props: this.props,
    });

  changeWaitingDialogVisibility = bool =>
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));

  toggleDialogVisibility = dialogType =>
    this.setState(prevState => ({
      isLoading: false,
      showDialog: !prevState.showDialog,
      dialogType: !prevState.dialogType ? dialogType : null,
    }));

  render() {
    const {
      email,
      password,
      showDialog,
      dialogType,
      dialogTitle,
      dialogDesc,
      dialogLeftText,
      dialogRightText,
    } = this.state;
    const { updateProviderAuthToken } = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <DialogComponent
          isDialogVisible={showDialog && dialogType !== null}
          transparent={true}
          animation="fade"
          width={screenWidth - 80}
          changeDialogVisibility={this.toggleDialogVisibility}
          leftButtonAction={this.leftButtonActon}
          rightButtonAction={this.rightButtonAction}
          isLoading={false}
          titleText={dialogTitle}
          descText={dialogDesc}
          leftButtonText={dialogLeftText}
          rightButtonText={dialogRightText}
        />
        <KeyboardAwareScrollView
          contentContainerStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            alwaysBounceVertical: true,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <View style={styles.logincontainer}>
              {this.state.error && <Text
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                  marginBottom: 10,
                }}>
                {this.state.error}
              </Text>}

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/email.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    height: 50,
                    marginLeft: 10,
                    color: black,
                  }}
                  placeholder="Email"
                  onChangeText={email =>
                    emailCheck(
                      email.trim().toLowerCase(),
                      email => this.setState({ email, error: '' }),
                      error => this.setState({ error }),
                    )
                  }
                />
              </View>

              <View style={[styles.textInputView, { marginTop: 5 }]}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/ic_lock_64dp.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    height: 50,
                    marginLeft: 10,
                    color: black,
                  }}
                  placeholder="Password"
                  secureTextEntry={true}
                  onChangeText={password =>
                    passwordCheck(
                      password.trim(),
                      password => this.setState({ password, error: '' }),
                      error => this.setState({ error }),
                    )
                  }
                />
              </View>
              <View
                style={{
                  width: '100%',
                  marginTop: 10,
                  paddingHorizontal: 20,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <TouchableOpacity
                  onPress={() =>
                    this.props.navigation.navigate('ProLoginPhoneScreen', {
                      accountType: this.state.accountType
                    })
                  }>
                  <Text
                    style={styles.linkStyle}>
                    Login with Phone Number
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    this.props.navigation.navigate('ProForgotPassword', {
                      accountType: this.state.accountType
                    })
                  }>
                  <Text
                    style={styles.linkStyle}>
                    Forgot Password
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={() =>
                  checkValidation(
                    email,
                    password,
                    e => this.setState({ error: e }),
                    this.authenticateTaskPro,
                  )
                }>
                <Text style={styles.text}>Login</Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text
                style={{
                  color: black,
                  fontSize: 13,
                  marginBottom: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                Or Login With
              </Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={[styles.buttonFGContainer, { backgroundColor: '#3c599b' }]}
                onPress={() =>
                  facebookLoginTask(
                    updateProviderAuthToken,
                    this.responseFbCallbackPro,
                  )
                }>
                <Image
                  style={{ width: 20, height: 20 }}
                  source={require('../../icons/facebook.png')}
                />
                <Text style={styles.text}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buttonFGContainer, { backgroundColor: '#DD4D3B' }]}
                onPress={this.googleLoginTaskPro}>
                <Image
                  style={{ width: 20, height: 20 }}
                  source={require('../../icons/google.png')}
                />
                <Text style={styles.text}>Gmail</Text>
              </TouchableOpacity>
              <View />
            </View>
            <TouchableOpacity
              style={{ padding: 5 }}
              onPress={() =>
                this.props.navigation.navigate('ProRegister', {
                  accountType: this.state.accountType,
                })
              }>
              <Text
                style={styles.linkStyle}>
                Don't have an account? Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
        <Modal
          transparent={true}
          visible={this.state.isLoading}
          animationType="fade"
          onRequestClose={this.changeWaitingDialogVisibility}>
          <WaitingDialog
            changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
          />
        </Modal>
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
    fetchJobRequestHistory: (providerId, only) => {
      dispatch(getAllWorkRequestPro(providerId, only));
    },
    fetchProvidersJobRequests: (props, id, to) => {
      dispatch(getPendingJobRequestProvider(props, id, to));
    },
    updateProviderDetails: details => {
      dispatch(updateProviderDetails(details));
    },
    updateProviderAuthToken: token => {
      dispatch(updateProviderAuthToken(token));
    },
    fetchProviderProfile: (proId, fcm) => {
      dispatch(fetchProviderProfile(proId, fcm))
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigation(FacebookGoogleScreen));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightGray,
  },
  logincontainer: {
    width: screenWidth - 15,
    height: 275,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: white,
    shadowColor: black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 4,
  },
  linkStyle: {
    color: black,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 5,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  separator: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#ebebeb',
    marginTop: 5,
    marginBottom: 5,
  },
  textInputView: {
    flexDirection: 'row',
    width: screenWidth - 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: white,
    shadowColor: black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    width: 175,
    height: 50,
    backgroundColor: themeRed,
    shadowColor: black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    textAlign: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonFGContainer: {
    width: screenWidth / 2 - 40,
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 5,
    marginBottom: 10,
    marginLeft: 10,
  },
  text: {
    flex: 1,
    fontSize: font_size.sub_header,
    fontWeight: 'bold',
    color: white,
    textAlign: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    textAlignVertical: 'center',
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
});
