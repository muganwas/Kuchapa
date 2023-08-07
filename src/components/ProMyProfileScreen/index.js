import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Animated,
  Text,
  BackHandler,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { connect } from 'react-redux';
import RNExitApp from 'react-native-exit-app';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import rNES from 'react-native-encrypted-storage';
import TextInputMask from 'react-native-text-input-mask';
import ImagePicker from 'react-native-image-picker';
import Toast from 'react-native-simple-toast';
import Config from '../Config';
import WaitingDialog from '../WaitingDialog';
import Hamburger from '../ProHamburger';
import {
  updateProviderDetails,
  fetchProviderProfile,
} from '../../Redux/Actions/userActions';
import {
  updateProfileImageTask,
  updateProfileInfo,
} from '../../controllers/users';
import { white, themeRed, black, colorBg } from '../../Constants/colors';
import {
  phoneNumberCheck,
  sanitizeMobileNumber,
  emailCheck,
} from '../../misc/helpers';

const screenWidth = Dimensions.get('window').width;

const options = {
  title: 'Select a photo',
  takePhotoButtonTitle: 'Take a photo',
  chooseFromLibraryButtonTitle: 'Choose from gallery',
  quality: 1,
};

const PRO_IMAGE_UPDATE = Config.baseURL + 'employee/upload/';
const PRO_INFO_UPDATE = Config.baseURL + 'employee/';

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

class ProMyProfileScreen extends Component {
  constructor(props) {
    super();
    const {
      userInfo: { providerDetails },
    } = props;
    this.state = {
      providerId: providerDetails.providerId,
      fcmId: providerDetails.fcmId,
      imageSource: providerDetails.imageSource,
      email: providerDetails.email,
      emailDisabled: !!providerDetails.email,
      mobileDisabled: !!providerDetails.mobile,
      emailSet: false,
      name: providerDetails.name,
      surname: providerDetails.surname,
      mobile: providerDetails.mobile,
      services: '',
      description: providerDetails.description,
      address: providerDetails.address,
      error: '',
      lat: providerDetails.lat,
      lang: providerDetails.lang,
      invoice: providerDetails.invoice,
      isLoading: true,
      isErrorToast: false,
      galleryCameraImage: '',
      accountType: providerDetails.accountType,
      backClickCount: 0,
    };
    this.springValue = new Animated.Value(100);
  }

  selectPhoto = () => {
    ImagePicker.showImagePicker(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        let source = { uri: response.uri };
        this.setState({
          imageSource: source,
          error: '',
          galleryCameraImage: 'galleryCamera',
          isLoading: true,
        });
        rNES
          .getItem('userId')
          .then(providerId => this.updateImageTask(providerId, response));
      }
    });
  };

  componentDidMount = async () => {
    const {
      userInfo: { providerDetails },
      validationInfo: { countryCode },
      navigation,
    } = this.props;
    const { mobile } = this.state;
    let newMobile = await sanitizeMobileNumber(mobile, countryCode, false);
    this.setState({ mobile: newMobile });
    navigation.addListener('willFocus', async () => {
      BackHandler.addEventListener('hardwareBackPress', () =>
        this.handleBackButtonClick(),
      );
    });
    navigation.addListener('willBlur', () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
    });
    this.setState({
      isLoading: false,
    });
    let services = JSON.parse(providerDetails.services);
    let serviceName = '';
    let i;
    for (i = 0; i < services.length; i++) {
      serviceName =
        serviceName +
        services[i].service_name +
        `${services.length > 1 ? ',' : ''}`;
    }

    this.setState({
      services: serviceName,
    });
  };

  handleBackButtonClick = () => {
    if (Platform.OS === 'ios')
      this.state.backClickCount === 1 ? RNExitApp.exitApp() : this._spring();
    else
      this.state.backClickCount === 1 ? BackHandler.exitApp() : this._spring();
  };

  _spring = () => {
    this.setState({ backClickCount: 1 }, () => {
      Animated.sequence([
        Animated.spring(this.springValue, {
          toValue: -0.15 * 1,
          friction: 5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(this.springValue, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        this.setState({ backClickCount: 0 });
      });
    });
  };

  getDataFromServiceScreen = data => {
    var data = data.split('/');
    this.setState({
      serviceIds: data[0],
      services: data[1],
    });
  };

  getDataFromAddAddressScreen = data => {
    var data = data.split('/');
    this.setState({
      address: data[0],
      lat: data[1],
      lng: data[2],
    });
  };

  checkValidation = () => {
    rNES
      .getItem('userId')
      .then(async providerId => await this.updateInformation(providerId));
  };

  updateInformation = async providerId => {
    const {
      name,
      fcmId,
      surname,
      mobile,
      email,
      serviceIds,
      description,
      address,
      lat,
      lang,
      invoice,
    } = this.state;
    const {
      fetchProviderProfile,
      validationInfo: { countryAlpha2 },
    } = this.props;
    this.setState({
      isLoading: true,
    });
    const userData = {
      username: name,
      surname,
      mobile,
      email,
      services: serviceIds,
      description,
      address,
      lat,
      lang,
      invoice,
    };
    phoneNumberCheck(mobile, countryAlpha2).then(async isValid => {
      if (!isValid) {
        this.setState({
          error: 'Your phone number is invalid',
          isLoading: false,
        });
      } else {
        email &&
          (await emailCheck(
            email,
            () => this.setState({ error: '' }),
            error => {
              this.setState({ error, isLoading: false });
            },
          ));
        if (!this.state.error)
          await updateProfileInfo({
            userId: providerId,
            fcmId,
            userData,
            fetchUserProfile: fetchProviderProfile,
            updateURL: PRO_INFO_UPDATE,
            onSuccess: userData => {
              this.setState({
                emailSet: userData && userData.email,
                isLoading: false,
                isErrorToast: false,
              });
            },
            toggleIsLoading: this.changeWaitingDialogVisibility,
          });
      }
    });
  };

  updateImageTask = async (userId, imageObject) =>
    await updateProfileImageTask({
      userId,
      imageObject,
      firebaseId: this.props?.userInfo?.providerDetails?.firebaseId,
      userDetails: this.props?.userInfo?.providerDetails,
      updateUserDetails: this.props?.updateProviderDetails,
      toggleIsLoading: this.changeWaitingDialogVisibility,
      updateURL: PRO_IMAGE_UPDATE,
    });

  showToast = message => {
    Toast.show(message);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));
  };

  render() {
    const {
      mobile,
      emailDisabled,
      emailSet,
      mobileDisabled,
      galleryCameraImage,
      imageSource,
    } = this.state;
    const {
      validationInfo: { countryCode },
    } = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View style={styles.header}>
          <Hamburger navigation={this.props.navigation} text="My Profile" />
        </View>

        <KeyboardAwareScrollView
          contentContainerStyle={{
            flexGrow: 1,
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
            <View
              style={{
                flex: 0.35,
                width: screenWidth,
                backgroundColor: white,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Image
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 100,
                  marginTop: 20,
                }}
                source={
                  !galleryCameraImage
                    ? imageSource
                      ? { uri: imageSource }
                      : require('../../images/generic_avatar.png')
                    : { uri: imageSource.uri }
                }
              />

              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  alignSelf: 'flex-end',
                  alignContent: 'center',
                  justifyContent: 'center',
                  borderRadius: 50,
                  backgroundColor: '#fff',
                  margin: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.75,
                  shadowRadius: 5,
                  elevation: 5,
                }}
                onPress={this.selectPhoto}>
                <Image
                  style={{
                    width: 20,
                    tintColor: themeRed,
                    height: 20,
                    alignSelf: 'center',
                  }}
                  source={require('../../icons/camera.png')}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.logincontainer}>
              {this.state.error && <Text
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                  marginBottom: 10,
                }}>
                {this.state.error}
              </Text>}

              <View
                style={{
                  width: screenWidth - 50,
                  height: 50,
                  justifyContent: 'center',
                  marginBottom: 15,
                  backgroundColor: themeRed,
                  alignItems: 'center',
                  borderRadius: 5,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    marginTop: 10,
                    marginBottom: 10,
                  }}>
                  <View style={styles.buttonPrimaryDark}>
                    <Text style={[styles.text, { fontWeight: 'bold' }]}>
                      Account Type
                    </Text>
                  </View>
                  <View style={styles.buttonGreen}>
                    <Text
                      style={[styles.text, { color: black, fontWeight: 'bold' }]}>
                      {this.state.accountType}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/ic_user_64dp.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    height: 50,
                    marginLeft: 10,
                  }}
                  placeholder="Name"
                  value={this.state.name}
                  onChangeText={nameInput =>
                    this.setState({ error: '', name: nameInput })
                  }
                />
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/email.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    marginLeft: 10,
                    textAlignVertical: 'center',
                    alignSelf: 'center',
                  }}
                  editable={!emailDisabled && !emailSet}
                  placeholder="Your email address"
                  value={this.state.email}
                  onChangeText={email => this.setState({ error: '', email })}
                />
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/mobile.png')}
                />
                <TextInputMask
                  style={{
                    width: screenWidth - 85,
                    height: 50,
                    marginLeft: 10,
                  }}
                  refInput={ref => {
                    this.input = ref;
                  }}
                  editable={!mobileDisabled}
                  keyboardType="phone-pad"
                  placeholder={`${countryCode} 000 000 000`}
                  value={mobile}
                  onChangeText={mobileInput =>
                    this.setState({ error: '', mobile: mobileInput })
                  }
                  mask={`${countryCode} [000] [000] [000]`}
                />
              </View>

              <View style={styles.textView1}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/ic_settings_64dp.png')}
                />
                <Text
                  style={{
                    width: screenWidth - 85,
                    color: 'black',
                    fontSize: 16,
                    textAlignVertical: 'center',
                    marginLeft: 10,
                  }}
                  multiline={true}
                  onPress={() =>
                    this.props.navigation.navigate('ProServiceSelect', {
                      onGoBack: this.getDataFromServiceScreen,
                      from: 'profile-screen',
                    })
                  }>
                  {this.state.services}
                </Text>
              </View>

              <View style={styles.textView1}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/description.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    color: 'black',
                    fontSize: 16,
                    marginLeft: 10,
                  }}
                  placeholder="Description"
                  value={this.state.description}
                  multiline={true}
                  onChangeText={descriptionInput =>
                    this.setState({
                      error: '',
                      description: descriptionInput,
                    })
                  }
                />
              </View>

              <View style={styles.textView1}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/maps_location.png')}
                />
                <Text
                  style={{
                    width: screenWidth - 85,
                    color: 'black',
                    fontSize: 16,
                    marginLeft: 10,
                  }}
                  value={this.state.address}
                  multiline={true}
                  onPress={() =>
                    this.props.navigation.navigate('SelectAddress', {
                      onGoBack: this.getDataFromAddAddressScreen,
                      from: 'profile-screen',
                    })
                  }>
                  {this.state.address}
                </Text>
              </View>

              <View style={styles.textView}>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 16,
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    marginTop: 5,
                  }}>
                  Can you provide invoice
                </Text>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    marginTop: 10,
                    justifyContent: 'center',
                  }}>
                  <TouchableOpacity
                    style={
                      this.state.invoice === '1'
                        ? styles.invoiceBorder
                        : styles.invoice
                    }
                    onPress={() => this.setState({ invoice: '1' })}>
                    <Text
                      style={{
                        color: black,
                        alignSelf: 'center',
                        textAlignVertical: 'center',
                      }}>
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      this.state.invoice === '0'
                        ? styles.invoiceBorder
                        : styles.invoice,
                      { marginLeft: 20 },
                    ]}
                    onPress={() => this.setState({ invoice: '0' })}>
                    <Text
                      style={{
                        color: black,
                        alignSelf: 'center',
                        textAlignVertical: 'center',
                      }}>
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={this.checkValidation}>
                <Text style={[styles.text, { fontWeight: 'bold', color: black }]}>
                  Update
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
        <Modal
          transparent={true}
          visible={this.state.isLoading}
          animationType="fade"
          onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
          <WaitingDialog
            changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
          />
        </Modal>

        <Animated.View
          style={[
            styles.animatedView,
            { transform: [{ translateY: this.springValue }] },
          ]}>
          <Text style={styles.exitTitleText}>
            Press back again to exit the app
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => BackHandler.exitApp()}>
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
}

const mapStateToProps = state => ({
  userInfo: state.userInfo,
  validationInfo: state.validationInfo,
});

const mapDispatchToProps = dispatch => ({
  updateProviderDetails: details => {
    dispatch(updateProviderDetails(details));
  },
  fetchProviderProfile: (id, fcmid) => {
    dispatch(fetchProviderProfile(id, fcmid));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProMyProfileScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8EEE9',
  },
  header: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    backgroundColor: white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonGreen: {
    flex: 1,
    height: 40,
    paddingTop: 10,
    backgroundColor: white,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 1,
    borderColor: white,
    borderWidth: 0,
    textAlign: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
  },
  buttonPrimaryDark: {
    flex: 1,
    height: 40,
    paddingTop: 10,
    backgroundColor: themeRed,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    textAlign: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
  },
  logincontainer: {
    flex: 0.65,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingBottom: 25,
  },
  textInputView: {
    flexDirection: 'row',
    width: screenWidth - 40,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 10,
  },
  textView1: {
    flex: 1,
    flexDirection: 'row',
    width: screenWidth - 40,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 5,
    paddingRight: 5,
  },
  buttonContainer: {
    width: 200,
    paddingTop: 15,
    backgroundColor: white,
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    shadowColor: themeRed,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 7,
    marginBottom: 25,
    textAlign: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    justifyContent: 'center',
  },
  textView: {
    flex: 1,
    width: screenWidth - 40,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 5,
    paddingRight: 5,
  },
  textInputViewDes: {
    flexDirection: 'row',
    width: screenWidth - 40,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 10,
  },
  invoice: {
    height: 30,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 2,
    paddingBottom: 2,
    backgroundColor: white,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 1,
    borderColor: 'grey',
    borderRadius: 5,
    justifyContent: 'center',
    color: white,
  },
  invoiceBorder: {
    height: 30,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 2,
    paddingBottom: 2,
    backgroundColor: white,
    borderColor: themeRed,
    shadowColor: themeRed,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 5,
    borderWidth: 0.1,
    justifyContent: 'center',
    alignContent: 'center',
    color: white,
  },
  animatedView: {
    width: screenWidth,
    backgroundColor: colorBg,
    elevation: 2,
    position: 'absolute',
    bottom: 0,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  exitTitleText: {
    textAlign: 'center',
    color: black,
    marginRight: 20,
  },
  exitText: {
    color: themeRed,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 3,
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
