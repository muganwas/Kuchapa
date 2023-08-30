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
import { connect } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-simple-toast';
import rNES from 'react-native-encrypted-storage';
import WaitingDialog from '../WaitingDialog';
import { updateUserDetails } from '../../Redux/Actions/userActions';
import {
  colorPrimary,
  colorBg,
  themeRed,
  white,
  black,
} from '../../Constants/colors';
import Config from '../Config';

const screenWidth = Dimensions.get('window').width;

const USER_INFO_UPDATE = Config.baseURL + 'users/';
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

function StatusBarPlaceHolder() {
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
}

class AddAddressScreen extends Component {
  constructor(props) {
    super();
    const {
      userInfo: { userDetails },
    } = props;
    this.state = {
      latitude: userDetails.lat,
      longitude: userDetails.lang,
      error: null,
      address: userDetails.address,
      isLoading: true,
      isErrorToast: false,
    };
    console.log('user address', userDetails.address)
  }

  watchID = null;

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', () =>
      this.handleBackButtonClick(),
    );
    const {
      userInfo: { userDetails },
    } = this.props;
    if (this.state.address) {
      this.setState({
        address: userDetails.address,
        latitude: userDetails.lat,
        longitude: userDetails.lang,
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
    this.watchID != null && Geolocation.clearWatch(this.watchID);
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
    return true;
  }

  getCurrentLocation = async () => {
    const {
      updateUserDetails,
      userInfo: { userDetails },
    } = this.props;
    const idToken = await rNES.getItem('idToken');
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization();
      Geolocation.getCurrentPosition(
        async position => {
          this.setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          try {
            //Update Address to Database
            const resp = await fetch(
              'https://maps.googleapis.com/maps/api/geocode/json?address=' +
              position.coords.latitude +
              ',' +
              position.coords.longitude +
              '&key=' +
              Config.mapsApiKey
            );
            const responseJson = await resp.json();
            this.setState({
              address: responseJson.results[0].formatted_address,
              isLoading: false,
            });

            const userData = {
              address: responseJson.results[0].formatted_address,
              lat: this.state.latitude,
              lang: this.state.longitude,
            };
            try {
              const res = await fetch(USER_INFO_UPDATE + userDetails.userId, {
                method: 'POST',
                headers: {
                  Authorization: 'Bearer ' + idToken,
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
              });
              const response = await res.json()
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
                updateUserDetails(userData);
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
              console.log('maps address ..', responseJson);
              const {
                userInfo: { userDetails },
                updateUserDetails,
              } = this.props;
              this.setState({
                address: responseJson.results[0].formatted_address,
                isLoading: false,
              });

              const userData = {
                address: responseJson.results[0].formatted_address,
                lat: this.state.latitude,
                lang: this.state.longitude,
              };
              try {
                const resp = await fetch(USER_INFO_UPDATE + userDetails.userId, {
                  method: 'POST',
                  headers: {
                    Authorization: 'Bearer ' + idToken,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(userData),
                });
                const response = await resp();
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
                  updateUserDetails(userData);
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
  }

  async permissionRequest() {
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
            const responseJson = response.json();
            this.updateAddressToDatabase(
              position.coords.latitude,
              position.coords.longitude,
              responseJson.results[0].formatted_address,
            );
          } catch (e) {
            console.log(e.message);
          }
        });
      } else {
        console.log('location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  getDataFromAddAddressScreen = data => {
    this.setState({
      isLoading: true,
    });
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
    const userData = {
      address: address,
      lat: latitude,
      lang: longitude,
    };
    const {
      userInfo: { userDetails },
      updateUserDetails,
    } = this.props;
    const idToken = await rNES.getItem('idToken');
    try {
      const resp = await fetch(USER_INFO_UPDATE + userDetails.userId, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + idToken,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const response = await resp.json()
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
        updateUserDetails(userData);
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
  }

  showToast = message => {
    Toast.show(message);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  render() {
    const { navigation, route } = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />

        <View style={styles.header}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <TouchableOpacity
              style={{
                width: 35,
                height: 35,
                alignSelf: 'center',
                justifyContent: 'center',
              }}
              onPress={() => navigation.goBack()}>
              <Image
                style={{
                  width: 20,
                  height: 20,
                  alignSelf: 'center',
                  tintColor: black,
                }}
                source={require('../../icons/arrow_back.png')}
              />
            </TouchableOpacity>

            <Text
              style={{
                color: black,
                fontSize: 20,
                fontWeight: 'bold',
                alignSelf: 'center',
                marginLeft: 15,
              }}>
              My position
            </Text>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <Text
            style={{
              color: black,
              fontSize: 20,
              fontWeight: 'bold',
              alignSelf: 'flex-start',
            }}>
            Current position
          </Text>

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
              navigation.navigate('SelectAddress', {
                accountType: route.params.accountType,
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

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    userInfo: state.userInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchNotifications: data => {
      dispatch(startFetchingNotification(data));
    },
    updateUserDetails: details => {
      dispatch(updateUserDetails(details));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AddAddressScreen);

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
