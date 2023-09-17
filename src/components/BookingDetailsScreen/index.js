import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  BackHandler,
  ScrollView,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { connect } from 'react-redux';
import { withNavigation } from '@react-navigation/compat';
import { cloneDeep } from 'lodash';
import { AirbnbRating } from 'react-native-ratings';
import ReviewDialogCustomer from '../ReviewDialogCustomer';
import WaitingDialog from '../WaitingDialog';
import Config from '../Config';
import { reviewTask } from '../../controllers/bookings';
import {
  setSelectedJobRequest,
  updateCompletedBookingData,
} from '../../Redux/Actions/jobsActions';
import metrics, { font_size } from '../../Constants/metrics';
import {
  black,
  colorBg,
  colorPrimary,
  white,
  lightGray,
  themeRed,
  darkGray,
} from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;

const REVIEW_RATING = Config.baseURL + 'jobrequest/ratingreview';
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

class BookingDetailsScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      isLoading: false,
      isErrorToast: false,
      bookingDetails: props.route.params.bookingDetails,
      isRatingDialogVisible: false,
      mainId: '',
      username:
        props.route.params.bookingDetails.employee_details.username,
      fcm_id:
        props.route.params.bookingDetails.employee_details.fcm_id,
      customer_rating:
        props.route.params.bookingDetails.customer_rating,
      customer_review:
        props.route.params.bookingDetails.customer_review,
      employee_rating:
        props.route.params.bookingDetails.employee_rating,
      employee_review:
        props.route.params.bookingDetails.employee_review,
    };
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', () =>
      this.handleBackButtonClick(),
    );
    this.init();
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  init = () => {
    const { route } = this.props;
    this.setState({
      isLoading: false,
      isErrorToast: false,
      bookingDetails: route.params.bookingDetails,
      isRatingDialogVisible: false,
      mainId: '',
      username: route.params.bookingDetails.employee_details.username,
      fcm_id: route.params.bookingDetails.employee_details.fcm_id,
      customer_rating: route.params.bookingDetails.customer_rating,
      customer_review: route.params.bookingDetails.customer_review,
      employee_rating: route.params.bookingDetails.employee_rating,
      employee_review: route.params.bookingDetails.employee_review,
    });
  };

  handleBackButtonClick = () => {
    const { route, navigation } = this.props;
    const from = route.params.from;
    if (from === 'Dashboard')
      navigation.navigate('Home', { from: 'DetailsScreen' });
    if (from === 'Booking')
      navigation.goBack();
    else navigation.goBack();
    return true;
  };

  //Call also from ReviewDialog
  changeDialogVisibility = async (bool, resp) => {
    const { customer_rating, customer_review, bookingDetails } = this.state;
    this.setState({
      isRatingDialogVisible: bool,
      mainId: bookingDetails._id,
    });
    if (
      bookingDetails.customer_rating === '' &&
      customer_rating &&
      customer_rating !== '' &&
      resp === 'Submit'
    ) {
      await this.reviewTaskCustomer(customer_rating, customer_review);
    }
  };

  reviewTaskCustomer = async (rating, review) =>
    await reviewTask({
      rating,
      review,
      main_id: this.state.mainId,
      fcm_id: this.state.fcm_id,
      senderName: this.props?.userInfo?.userDetails?.username,
      senderId: this.props?.userInfo?.userDetails?.senderId,
      userType: 'Customer',
      notification_by: 'Customer',
      notificationType: 'Review',
      reviewURL: REVIEW_RATING,
      onSuccess: () => {
        this.setState({
          isLoading: false,
          isReviewDialogVisible: false,
          mainId: '',
          isErrorToast: false,
        });
        const pos = this.props.route.params.position;
        let newCompletedBookingData = cloneDeep(
          this.props.jobsInfo.bookingCompleteData,
        );
        let newBookingDetails = cloneDeep(this.state.bookingDetails);
        if (pos !== undefined) {
          newBookingDetails.customer_rating = this.state.customer_rating;
          newBookingDetails.customer_review = this.state.customer_review;
          newCompletedBookingData[pos] = newBookingDetails;
          this.props.updateCompletedBookingData(newCompletedBookingData);
        }
      },
      toggleIsLoading: bool => {
        if (bool === true) {
          this.setState({
            isLoading: bool,
            customer_rating: rating,
            customer_review: review,
          });
        } else {
          this.setState({
            isLoading: bool,
            isErrorToast: true,
          });
        }
      },
    });

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  render() {
    const {
      userInfo: { userDetails },
      dispatchSelectedJobRequest,
      navigation,
    } = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            height: 50,
            backgroundColor: colorPrimary,
            paddingLeft: 10,
            paddingRight: 20,
            paddingTop: 5,
            paddingBottom: 5,
          }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <TouchableOpacity
              style={{
                width: 35,
                height: 35,
                alignSelf: 'center',
                justifyContent: 'center',
              }}
              onPress={this.handleBackButtonClick}>
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
              Booking details
            </Text>
          </View>
        </View>
        <View style={styles.mainContainer}>
          <View
            style={{
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignContent: 'flex-start',
              paddingHorizontal: 10,
              borderBottomColor: lightGray,
              borderBottomWidth: 1,
            }}>
            <Text
              style={{ color: darkGray, fontWeight: 'bold', fontSize: 14 }}>
              Order number -{' '}
              {this.state.bookingDetails.order_id.replace('"', '')}
            </Text>
            <Text>{this.state.bookingDetails.createdDate}</Text>
          </View>
          <View style={{ padding: metrics.spacing.medium }}><Text style={{ fontWeight: 'bold' }}>Service Provider</Text></View>
          <View style={styles.providerDetailsContainer}>
            <View styles={styles.profilePictureContainer}>
              <Image
                style={styles.profilePicture}
                source={
                  this.state.bookingDetails.employee_details.image_exists
                    ? {
                      uri: this.state.bookingDetails.employee_details
                        .image,
                    }
                    : require('../../images/generic_avatar.png')
                }
              />
            </View>
            <View style={styles.addressContainer}>
              <Text
                style={{
                  color: black,
                  fontSize: 14,
                  fontWeight: 'bold',
                  textAlignVertical: 'center',
                  marginLeft: 10,
                }}>
                {this.state.bookingDetails.employee_details.username +
                  ' ' +
                  this.state.bookingDetails.employee_details.surname}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  marginLeft: 10,
                  marginTop: 5,
                }}>
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
                    color: black,
                    fontSize: 12,
                    color: darkGray,
                    textAlignVertical: 'center',
                    marginLeft: 5,
                  }}>
                  {this.state.bookingDetails.employee_details.mobile}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  marginLeft: 10,
                  marginTop: 5,
                  marginRight: 50,
                }}>
                <Image
                  style={{
                    height: 15,
                    width: 15,
                    alignSelf: 'center',
                    alignContent: 'flex-start',
                    borderRadius: 100,
                  }}
                  source={require('../../icons/description.png')}
                />
                <Text
                  style={{
                    color: black,
                    fontSize: 12,
                    color: black,
                    textAlignVertical: 'center',
                    marginLeft: 5
                  }}>
                  {this.state.bookingDetails.employee_details.description}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  marginLeft: 10,
                  marginTop: 5,
                  marginRight: 50,
                }}>
                <Image
                  style={{
                    height: 15,
                    width: 15,
                    alignSelf: 'center',
                    alignContent: 'flex-start',
                    borderRadius: 100,
                  }}
                  source={require('../../icons/maps_location.png')}
                />
                <Text
                  style={{
                    color: black,
                    fontSize: 12,
                    color: darkGray,
                    textAlignVertical: 'center',
                    marginLeft: 5
                  }}>
                  {this.state.bookingDetails.employee_details.address}
                </Text>
              </View>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ backgroundColor: lightGray }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignContent: 'flex-start',
                marginTop: 15,
                paddingHorizontal: 10,
                borderTopColor: lightGray,
                borderTopWidth: 1,
              }}>
              <Text style={{ color: black, fontWeight: 'bold', fontSize: 14 }}>
                Service provider's rating
              </Text>
            </View>
            <View style={styles.ratingSect}>
              <AirbnbRating
                type="custom"
                ratingCount={5}
                size={25}
                defaultRating={this.state.employee_rating}
                ratingBackgroundColor={colorBg}
                showRating={false}
                isDisabled={true}
                onFinishRating={rating =>
                  console.log('Employee Rating : ' + rating)
                }
              />
            </View>

            {this.state.employee_review !== '' && (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignContent: 'flex-start',
                    marginTop: 15,
                    marginLeft: 10,
                  }}>
                  <Text
                    style={{ color: black, fontWeight: 'bold', fontSize: 14 }}>
                    Service provider's review
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignContent: 'flex-start',
                    margin: 10,
                  }}>
                  <Text style={{ color: darkGray, fontSize: 14, padding: 10 }}>
                    {this.state.employee_review}
                  </Text>
                </View>
              </View>
            )}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignContent: 'flex-start',
                marginTop: 15,
                paddingHorizontal: 10,
                borderTopColor: lightGray,
                borderTopWidth: 1,
              }}>
              <Text style={{ color: black, fontWeight: 'bold', fontSize: 14 }}>
                Your rating of service
              </Text>
            </View>
            <View style={styles.ratingSect}>
              <AirbnbRating
                type="custom"
                ratingCount={5}
                size={25}
                defaultRating={this.state.customer_rating}
                ratingBackgroundColor={colorBg}
                showRating={false}
                isDisabled={this.state.customer_rating != '' ? true : false}
                onFinishRating={rating => {
                  this.setState({
                    customer_rating: rating,
                  });
                  this.changeDialogVisibility(true);
                }}
              />
            </View>

            {this.state.customer_review !== '' && (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignContent: 'flex-start',
                    marginTop: 15,
                    marginLeft: 10,
                  }}>
                  <Text
                    style={{ color: black, fontWeight: 'bold', fontSize: 14 }}>
                    Your service review
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignContent: 'flex-start',
                    margin: 10,
                  }}>
                  <Text style={{ color: darkGray, fontSize: 14, padding: 10 }}>
                    {this.state.customer_review}
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.chatView}
              onPress={() => {
                dispatchSelectedJobRequest({
                  employee_id: this.state.bookingDetails.employee_id,
                });
                this.props.navigation.navigate('ChatAfterBookingDetails', {
                  providerId: this.state.bookingDetails.employee_id,
                  providerName: this.state.bookingDetails.employee_details
                    .username,
                  providerSurname: this.state.bookingDetails.employee_details
                    .surname,
                  providerImage: this.state.bookingDetails.employee_details
                    .image,
                  imageAvailable: this.state.bookingDetails.employee_details.image_exists,
                  serviceName: this.state.bookingDetails.service_details
                    .service_name,
                  orderId: this.state.bookingDetails.order_id,
                  pageTitle: 'bookingDetails',
                  isJobAccepted: false,
                });
              }}>
              <Image
                style={{
                  width: 20,
                  height: 20,
                  marginLeft: 20,
                  tintColor: white,
                }}
                source={require('../../icons/chatting.png')}
              />
              <Text
                style={{
                  color: white,
                  fontWeight: 'bold',
                  fontSize: font_size.sub_header,
                  textAlign: 'center',
                  marginLeft: 10,
                }}>
                Chat history
              </Text>
              <Image
                style={{
                  width: 20,
                  height: 20,
                  marginLeft: 20,
                  tintColor: white,
                  position: 'absolute',
                  end: 0,
                  marginRight: 15,
                }}
                source={require('../../icons/right_arrow.png')}
              />
            </TouchableOpacity>
          </ScrollView>
          <Modal
            transparent={true}
            visible={this.state.isRatingDialogVisible}
            animationType="fade"
            onRequestClose={() => this.changeDialogVisibility(false)}>
            <ReviewDialogCustomer
              style={{
                shadowColor: black,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.75,
                shadowRadius: 5,
                elevation: 5,
              }}
              rating={this.state.customer_rating}
              review={this.state.customer_review}
              changeDialogVisibility={this.changeDialogVisibility}
              updateReview={review =>
                this.setState({ customer_review: review })
              }
              updateRating={rating =>
                this.setState({ customer_rating: rating })
              }
              data={this.state.bookingDetails}
            />
          </Modal>
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
    jobsInfo: state.jobsInfo,
    userInfo: state.userInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    },
    fetchNotifications: data => {
      dispatch(startFetchingNotification(data));
    },
    updateCompletedBookingData: data => {
      dispatch(updateCompletedBookingData(data));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigation(BookingDetailsScreen));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg,
  },
  mainContainer: {
    flex: 1,
    width: screenWidth,
    backgroundColor: white,
    shadowColor: black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: white,
    borderRadius: 2,
    marginTop: 10,
  },
  providerDetailContainer: {
    width: screenWidth,
    flexDirection: 'row',
    backgroundColor: white,
    padding: 10,
  },
  providerDetailsContainer: {
    width: screenWidth,
    flexDirection: 'row',
    backgroundColor: white,
    margin: 10,
    padding: 10,
  },
  proInfo: {
    width: screenWidth,
    flexDirection: 'row',
    backgroundColor: white,
    padding: 10,
  },
  profilePicture: {
    height: 60,
    width: 60,
    alignSelf: 'flex-start',
    alignContent: 'flex-start',
    borderRadius: 60,
  },
  profilePictureContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingSect: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 0,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 0,
  },
  addressContainer: {
    flexDirection: 'column',
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  chatView: {
    flexDirection: 'row',
    width: screenWidth,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: themeRed,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
