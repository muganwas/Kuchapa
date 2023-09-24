import React, { Component } from 'react';
import {
  View,
  StatusBar,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import DialogComponent from '../DialogComponent';
import WaitingDialog from '../WaitingDialog';
import Config from '../Config';
import { emailCheck } from '../../misc/helpers';
import { forgotPasswordTask } from '../../controllers/users';
import { font_size } from '../../Constants/metrics';
import { black, white, lightGray, themeRed } from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const FORGOT_PASSWORD = Config.baseURL + 'employee/forgot_password/email';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
  return Platform.OS === 'ios' ? (
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

export default class ProForgotPasswordScreen extends Component {
  constructor() {
    super();
    this.state = {
      email: '',
      isLoading: false,
      showDialog: false,
      dialogType: null,
      dialogTitle: '',
      dialogDesc: '',
      emailSent: false,
      dialogLeftText: 'Cancel',
      dialogRightText: 'Retry',
    };
    this.leftButtonActon = null;
    this.rightButtonAction = null;
  }

  checkValidation = async () => {
    const msg = await emailCheck(this.state.email);
    if (msg && msg !== true) {
      this.setState({ error: msg });
    }
    if (msg === true) {
      this.setState({ error: null });
      this.forgotPasswordTaskPro();
    }
  };

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

  forgotPasswordTaskPro = async () =>
    await forgotPasswordTask({
      toggleLoading: this.toggleDialogVisibility,
      email: this.state.email,
      forgotPasswordURL: FORGOT_PASSWORD,
      onSuccess: message =>
        this.showDialogAction(
          {
            title: 'Congratulations!',
            message,
            rightButtonText: 'Ok',
            dialogType: 'Success',
          },
          null,
          this.toggleDialogVisibility,
        ),
      onError: message =>
        this.showDialogAction(
          {
            title: 'RESET ERROR!',
            message,
            leftButtonText: 'Cancel',
            rightButtonText: 'Retry',
            dialogType: 'Error',
          },
          this.toggleDialogVisibility,
          this.forgotPasswordTaskPro,
        ),
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
      showDialog,
      dialogType,
      dialogTitle,
      dialogDesc,
      dialogLeftText,
      dialogRightText,
      emailSent,
    } = this.state;
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
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View style={styles.logincontainer}>
              {this.state.error && <Text
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                  marginBottom: 10,
                }}>
                {this.state.error}
              </Text>}

              <View style={{ padding: 5 }}>
                <Text
                  style={{
                    color: black,
                    fontWeight: 'bold',
                    fontSize: 17,
                    marginBottom: 5,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  Recover Your Password
                </Text>
              </View>

              <View
                style={{
                  padding: 5,
                  width: screenWidth - 50,
                }}>
                <Text
                  style={{
                    color: black,
                    fontSize: 13,
                    marginBottom: 5,
                    textAlign: 'center',
                  }}>
                  Please enter your registered Email address to access your
                  account
                </Text>
              </View>

              <View style={[styles.textInputView, { marginTop: 15 }]}>
                <Image
                  style={{
                    width: 15,
                    height: 15,
                    marginLeft: 5,
                  }}
                  source={require('../../icons/email.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    height: 50,
                    marginLeft: 5,
                    color: black,
                  }}
                  placeholder="Email"
                  onChangeText={emailInput =>
                    this.setState({
                      email: emailInput.trim().toLowerCase(),
                    })
                  }
                />
              </View>

              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={this.checkValidation}>
                <Text style={styles.text}>
                  {`${emailSent ? 'Re-Submit' : 'Submit'}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>

        <Modal
          transparent={true}
          visible={this.state.isLoading}
          animationType="fade"
          onRequestClose={() => this.changeWaitingDialogVisibility}>
          <WaitingDialog
            changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
          />
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightGray,
  },
  logincontainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 10,
  },
  separator: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#ebebeb',
    marginTop: 5,
    marginBottom: 5,
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
    alignItems: 'center',
    marginTop: 10,
  },
  text: {
    fontSize: font_size.sub_header,
    color: white,
    fontWeight: 'bold',
    textAlign: 'center',
    justifyContent: 'center',
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
