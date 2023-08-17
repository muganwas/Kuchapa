import React, { Component } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  PermissionsAndroid,
  BackHandler,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-simple-toast';
import { connect } from 'react-redux';
import { updateProviderDetails } from '../../Redux/Actions/userActions';
import WaitingDialog from '../WaitingDialog';
import Config from '../Config';
import {
  colorPrimary,
  colorBg,
  themeRed,
  white,
  black,
  colorGray,
} from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const USER_INFO_UPDATE = Config.baseURL + 'employee/';
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

class ProAddAddressScreen extends Component {
  constructor(props) {
    super();
    const {
      userInfo: { providerDetails },
    } = props;
    this.state = {
      latitude: providerDetails.lat,
      longitude: providerDetails.lang,
      error: null,
      address: providerDetails.address,
      isLoading: true,
      isErrorToast: false,
    };
  }

  watchID = null;

  componentDidMount() {
    const {
      userInfo: { providerDetails },
      navigation,
    } = this.props;
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    if (this.state.address != '') {
      this.setState({
        address: providerDetails.address,
        latitude: providerDetails.lat,
        longitude: providerDetails.lang,
        isLoading: false,
      });
    } else {
      this.setState({
        address: 'Getting address...',
        latitude: 0,
        longitude: 0,
      });
      this.getCurrentLocation();
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    this.watchID != null && Geolocation.clearWatch(this.watchID);
  }

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
    return true;
  };

  getCurrentLocation = async () => {
    if (Platform.OS == 'ios') {
      const { updateProviderDetails } = this.props;
      await Geolocation.requestAuthorization();
      Geolocation.getCurrentPosition(
        async position => {
          this.setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          try {
            //Update Address to Database
            const response = await fetch(
              'https://maps.googleapis.com/maps/api/geocode/json?address=' +
              position.coords.latitude +
              ',' +
              position.coords.longitude +
              '&key=' +
              Config.mapsApiKey,
            );
            const responseJson = await response.json();
            this.setState({
              address: responseJson.results[0].formatted_address,
              isLoading: false,
            });
            const {
              userInfo: { providerDetails },
            } = this.props;
            const userData = {
              address: responseJson.results[0].formatted_address,
              lat: this.state.latitude,
              lang: this.state.longitude,
            };
            try {
              const resp = await fetch(USER_INFO_UPDATE + providerDetails.providerId, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
              });
              const response = resp.json();
              if (response.result) {
                this.setState({
                  isLoading: false,
                });
                const userData = {
                  userId: response.data.id,
                  accountType: response.data.acc_type,
                  email: response.data.email,
                  password: response.data.password,
                  username: response.data.username,
                  image: response.data.image,
                  mobile: responseJson.data.mobile,
                  dob: response.data.dob,
                  address: response.data.address,
                  lat: response.data.lat,
                  lang: response.data.lang,
                  fcmId: response.data.fcm_id,
                };
                updateProviderDetails(userData);
              } else {
                this.setState({
                  isLoading: false,
                });
                this.showToast(response.message);
              }
            } catch (e) {
              this.setState({
                isLoading: false,
              });
            }
          } catch (e) {
            console.log(e);
          }
        },
        error => {
          this.setState({
            isLoading: false,
            isErrorToast: true,
          });
          this.showToast(error.message);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
      );
    } else {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (granted) {
        Geolocation.getCurrentPosition(
          async position => {
            this.setState({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            try {
              const response = await fetch(
                'https://maps.googleapis.com/maps/api/geocode/json?address=' +
                position.coords.latitude +
                ',' +
                position.coords.longitude +
                '&key=' +
                Config.mapsApiKey,
              );
              const responseJson = await response.json();
              this.setState({
                address: responseJson.results[0].formatted_address,
                isLoading: false,
              });
              const {
                userInfo: { providerDetails },
                updateProviderDetails,
              } = this.props;
              const userData = {
                address: responseJson.results[0].formatted_address,
                lat: this.state.latitude,
                lang: this.state.longitude,
              };
              try {
                const resp = await fetch(USER_INFO_UPDATE + providerDetails.providerId, {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(userData),
                });
                const response = await resp.json();
                if (response.result) {
                  this.setState({
                    isLoading: false,
                  });
                  const userData = {
                    userId: response.data.id,
                    accountType: response.data.acc_type,
                    email: response.data.email,
                    password: response.data.password,
                    username: response.data.username,
                    image: response.data.image,
                    mobile: response.data.mobile,
                    dob: response.data.dob,
                    address: response.data.address,
                    lat: response.data.lat,
                    lang: response.data.lang,
                    fcmId: response.data.fcm_id,
                  };
                  updateProviderDetails(userData);
                } else {
                  this.setState({
                    isLoading: false,
                  });
                  this.showToast(response.message);
                }
              } catch (e) {
                this.setState({
                  isLoading: false,
                });
              }
            } catch (e) {
              this.setState({
                isLoading: false,
              });
            }
          },
          error => {
            console.log('Error: ' + error.code, error.message);
            this.setState({
              isErrorToast: true,
            });
            this.showToast(error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      } else {
        this.permissionRequest();
      }
    }
    this.watchID = Geolocation.watchPosition(position => {
      const lastPosition = JSON.stringify(position);
      this.setState({ lastPosition });
    });
  };

  permissionRequest = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(async position => {
          this.setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          try {
            const response = await fetch(
              'https://maps.googleapis.com/maps/api/geocode/json?address=' +
              position.coords.latitude +
              ',' +
              position.coords.longitude +
              '&key=' +
              Config.mapsApiKey,
            );
            const responseJson = await response.json();

            this.updateAddressToDatabase(
              position.coords.latitude,
              position.coords.longitude,
              responseJson.results[0].formatted_address,
            );
          } catch (e) {
            console.log(e);
          }
        });
      } else {
        console.log('location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  getDataFromAddAddressScreen = data => {
    this.setState({
      isLoading: true,
    });
    console.log('Data : ' + data);

    var data = data.split('/');
    this.setState({
      address: data[0],
      latitude: data[1],
      longitude: data[2],
    });

    this.updateAddressToDatabase(data[1], data[2], data[0]);
  };

  //Update Address to Database
  updateAddressToDatabase = async (latitude, longitude, address) => {
    const {
      userInfo: { providerDetails },
      updateProviderDetails,
    } = this.props;
    const userData = {
      address: address,
      lat: latitude,
      lang: longitude,
    };
    try {
      const resp = await fetch(USER_INFO_UPDATE + providerDetails.providerId, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const response = await resp.json();
      if (response.result) {
        this.setState({
          isLoading: false,
          address: address,
        });

        const userData = {
          userId: response.data.id,
          accountType: response.data.acc_type,
          email: response.data.email,
          password: response.data.password,
          username: response.data.username,
          image: response.data.image,
          mobile: response.data.mobile,
          dob: response.data.dob,
          address: response.data.address,
          lat: response.data.lat,
          lang: response.data.lang,
          fcmId: response.data.fcm_id,
        };
        updateProviderDetails(userData);
        this.showToast(response.message);
      } else {
        this.setState({
          isLoading: false,
        });
        this.showToast(response.message);
      }
    } catch (e) {
      this.setState({
        isLoading: false,
      });
    }
  };

  showToast = message => {
    Toast.show(message);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View style={styles.mainContainer}>
          <View
            style={{
              width: screenWidth - 40,
              flexDirection: 'row',
              backgroundColor: themeRed,
              alignContent: 'center',
              padding: 20,
              shadowColor: black,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.75,
              shadowRadius: 5,
              elevation: 5,
              marginTop: 15,
            }}>
            <Text style={{ color: white, fontWeight: 'bold', fontSize: 16 }}>
              {this.state.address}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.buttonContainer, { marginTop: 40 }]}
            onPress={() =>
              this.props.navigation.navigate('SelectAddress', {
                onGoBack: this.getDataFromAddAddressScreen,
              })
            }>
            <Text style={styles.text}>Change location</Text>
          </TouchableOpacity>
        </View>
        <Modal
          transparent={true}
          visible={this.state.isLoading}
          animationType="fade"
          onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
          <WaitingDialog
            changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
          />
        </Modal>
      </View>
    );
  }
}

const mapStateToProps = state => ({
  userInfo: state.userInfo,
});

const mapDispatchToProps = dispatch => ({
  updateProviderDetails: details => {
    dispatch(updateProviderDetails(details));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProAddAddressScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg,
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: colorPrimary,
    paddingLeft: 10,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    shadowColor: black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
  },
  buttonContainer: {
    width: screenWidth - 100,
    padding: 15,
    backgroundColor: white,
    shadowColor: black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 5,
    marginBottom: 25,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: black,
    textAlign: 'center',
    alignSelf: 'center',
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
