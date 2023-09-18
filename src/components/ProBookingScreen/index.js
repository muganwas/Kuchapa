import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Text,
  BackHandler,
  StatusBar,
  Platform,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import { connect } from 'react-redux';
import _ from 'lodash';
import Toast from 'react-native-simple-toast';
import Config from '../Config';
import WaitingDialog from '../WaitingDialog';
import ProHamburger from '../ProHamburger';
import { font_size, spacing } from '../../Constants/metrics';
import {
  updateCompletedBookingData,
  updateFailedBookingData,
} from '../../Redux/Actions/jobsActions';
import {
  white,
  themeRed,
  black,
  darkGray,
  lightGray,
  colorBg,
} from '../../Constants/colors';
import { getAllBookings } from '../../controllers/bookings';

const screenWidth = Dimensions.get('window').width;
const BOOKING_HISTORY = Config.baseURL + 'jobrequest/employee_request/';
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

class ProBookingScreen extends Component {
  constructor() {
    super();
    this.state = {
      currentPage: 0,
      isLoading: false,
      isErrorToast: false,
      backClickCount: 0,
    };
    this.springValue = new Animated.Value(100);
  }

  componentDidMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    this.fetchCompletedRejectedJobs();
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  handleBackButtonClick = () => {
    const { navigation } = this.props;
    navigation.goBack();
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

  getAllBookingsProvider = async (only, limit) =>
    await getAllBookings({
      userId: this.props?.userInfo?.providerDetails?.providerId,
      userType: 'Provider',
      only,
      limit,
      bookingHistoryURL: BOOKING_HISTORY,
      toggleIsLoading: this.changeWaitingDialogVisibility,
      onSuccess: (bookingCompleteData, bookingRejectData) => {
        this.props.updateCompletedBookingData(bookingCompleteData);
        this.props.updateFailedBookingData(bookingRejectData);
        this.setState({
          isLoading: false,
        });
      },
    });

  fetchCompletedRejectedJobs = () => this.getAllBookingsProvider('Completed,Rejected', 20);

  onPageSelected = event => {
    const currentPage = event.nativeEvent.position;
    this.setState({ currentPage });
  };

  selectPage = title => {
    if (title === 'Completed') {
      this.setState({
        currentPage: 0,
      });
    } else if (title === 'Rejected') {
      this.setState({
        currentPage: 1,
      });
    }
  };

  renderBookingHistoryItem = (item, index) => {
    if (item.user_details)
      return (
        <TouchableOpacity
          key={index}
          style={{
            flexDirection: 'column',
            backgroundColor: white,
            shadowColor: black,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.75,
            shadowRadius: 5,
            elevation: 5,
            marginBottom: 7,
          }}
          onPress={() =>
            this.props.navigation.navigate('ProBookingDetails', {
              bookingDetails: item,
              position: index,
              from: 'ProBooking'
            })
          }>
          <View style={styles.itemContainer}>
            <Image
              style={{
                height: 45,
                width: 45,
                alignSelf: 'flex-start',
                alignContent: 'flex-start',
                borderRadius: 100,
              }}
              source={
                item?.user_details?.image_exists
                  ? { uri: item.user_details.image }
                  : require('../../images/generic_avatar.png')
              }
            />
            <View style={{ flexDirection: 'column' }}>
              <Text
                style={{
                  color: 'black',
                  fontSize: 14,
                  fontWeight: 'bold',
                  textAlignVertical: 'center',
                  marginLeft: 10,
                }}>
                {item.user_details.username}
              </Text>
              <View
                style={{ flexDirection: 'row', marginLeft: 10, marginTop: 5 }}>
                <Image
                  style={{
                    height: 15,
                    width: 15,
                    alignSelf: 'center',
                    alignContent: 'flex-start',
                    borderRadius: 100,
                  }}
                  source={require('../../icons/mobile.png')}
                />
                <Text
                  style={{
                    color: 'black',
                    fontSize: 14,
                    textAlignVertical: 'center',
                    marginLeft: 5,
                  }}>
                  {item.user_details.mobile}
                </Text>
              </View>
            </View>
            <View
              style={{
                flex: 1,
                color: 'white',
                alignContent: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  textAlign: 'center',
                  alignSelf: 'flex-end',
                  padding: 10,
                  fontSize: 12,
                  color: 'black',
                  marginRight: 10,
                }}>
                {item.order_id.replace('"', '')}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colorBg,
              borderTopWidth: 1,
              borderTopColor: lightGray,
            }}>
            <Text
              style={{
                color: 'black',
                fontSize: 14,
                fontWeight: 'bold',
                textAlignVertical: 'center',
                alignSelf: 'center',
                marginLeft: 10,
              }}>
              {item.service_details.service_name}
            </Text>
            <View
              style={{
                flex: 1,
                alignContent: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  textAlign: 'center',
                  alignSelf: 'flex-end',
                  padding: 10,
                  fontSize: 12,
                  color: 'black',
                  marginRight: 10,
                }}>
                {item.createdDate}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
  };

  showToast = (message, length) => {
    if (length) Toast.show(message, length);
    else Toast.show(message);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));
  };

  render() {
    const {
      jobsInfo: { bookingCompleteData, bookingRejectData },
    } = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View
          style={[
            styles.header,
            { borderBottomWidth: 1, borderBottomColor: themeRed },
          ]}><ProHamburger text="Bookings" /></View>
        <View
          style={{
            width: screenWidth,
            justifyContent: 'center',
            backgroundColor: themeRed,
            alignItems: 'center',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignContent: 'center',
              marginTop: spacing.small,
              marginBottom: spacing.small,
            }}
          >
            <TouchableOpacity
              style={
                this.state.currentPage === 0
                  ? styles.buttonGreen
                  : styles.buttonPrimaryDark
              }
              onPress={() => this.selectPage('Completed')}>
              <Text
                style={[
                  styles.text,
                  { color: this.state.currentPage === 0 ? black : white },
                ]}>
                Completed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={
                this.state.currentPage === 1
                  ? styles.buttonRed
                  : styles.buttonPrimaryDark
              }
              onPress={() => this.selectPage('Rejected')}>
              <Text
                style={[
                  styles.text,
                  {
                    color: this.state.currentPage === 1 ? black : white,
                    fontWeight: 'bold',
                  },
                ]}>
                Rejected
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
          {this.state.currentPage === 0 ?
            <>
              <ScrollView>
                <View style={styles.listView}>
                  {bookingCompleteData.map(this.renderBookingHistoryItem)}
                </View>
              </ScrollView>
              {bookingCompleteData.length === 0 && !this.state.isLoading && (
                <View style={styles.loaderStyle}>
                  <Text
                    style={{
                      color: darkGray,
                      fontSize: font_size.sub_header,
                      fontStyle: 'italic',
                    }}>
                    No complete bookings found!
                  </Text>
                </View>
              )}
            </> : this.state.currentPage === 1 ?
              <>
                <ScrollView>
                  <View style={styles.listView}>
                    {bookingRejectData.map(this.renderBookingHistoryItem)}
                  </View>
                </ScrollView>
                {bookingRejectData.length === 0 && !this.state.isLoading && (
                  <View style={styles.loaderStyle}>
                    <Text
                      style={{
                        color: darkGray,
                        fontSize: font_size.sub_header,
                        fontStyle: 'italic',
                      }}>
                      No rejected bookings found!
                    </Text>
                  </View>
                )}
              </> : <></>}
        </View>
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
  jobsInfo: state.jobsInfo,
});

const mapDispatchToProps = dispatch => ({
  updateCompletedBookingData: data => {
    dispatch(updateCompletedBookingData(data));
  },
  updateFailedBookingData: data => {
    dispatch(updateFailedBookingData(data));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProBookingScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightGray,
  },
  pageStyle: {
    alignItems: 'center',
    padding: 20,
    color: 'black',
  },
  buttonGreen: {
    flex: 1,
    height: 50,
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
  buttonRed: {
    flex: 1,
    height: 50,
    paddingTop: 10,
    backgroundColor: white,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 1,
    borderColor: themeRed,
    borderWidth: 0,
    textAlign: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
  },
  buttonPrimaryDark: {
    flex: 1,
    height: 50,
    paddingTop: 10,
    backgroundColor: themeRed,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 1,
    borderColor: themeRed,
    borderWidth: 0,
    textAlign: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
  },
  text: {
    fontSize: font_size.sub_header,
    color: white,
    textAlign: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  listView: {
    flex: 1,
    backgroundColor: lightGray,
    padding: 5,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: white,
    padding: 10,
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
