import React, { Component } from 'react';
import {
  Text,
  StyleSheet,
  View,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  BackHandler,
  RefreshControl,
  StatusBar,
  Platform,
  Switch,
} from 'react-native';
import { connect } from 'react-redux';
import RNExitApp from 'react-native-exit-app';
import SimpleToast from 'react-native-simple-toast';
import ReviewDialog from '../ReviewDialog';
import Config from '../Config';
import ProHamburger from '../ProHamburger';
import WaitingDialog from '../WaitingDialog';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {
  startFetchingJobProvider,
  fetchedJobProviderInfo,
  fetchAllJobRequestsProError,
  fetchProviderJobInfoError,
  setSelectedJobRequest,
  getAllWorkRequestPro,
  getPendingJobRequestProvider
} from '../../Redux/Actions/jobsActions';
import { updateProviderDetails } from '../../Redux/Actions/userActions';
import {
  updateLatestChats,
  setLatestChatsError,
} from '../../Redux/Actions/messageActions';
import {
  acceptChatRequest,
  rejectChatRequest,
  updateAvailabilityInDB,
  getAllRecentChats,
} from '../../controllers/chats';
import { requestClientForReview } from '../../controllers/jobs';
import { reviewTask } from '../../controllers/bookings';
import { font_size, spacing } from '../../Constants/metrics';
import {
  colorBg,
  colorYellow,
  lightGray,
  white,
  themeRed,
  darkGray,
  black,
} from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
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

class ProDashboardScreen extends Component {
  constructor(props) {
    super();
    const {
      generalInfo: { online, connectivityAvailable },
      userInfo: { providerDetails },
      messagesInfo: { fetchedLatestChats }
    } = props;
    this.state = {
      isLoading: true,
      isLoadingLatestChats: !fetchedLatestChats,
      isErrorToast: false,
      mainId: '',
      reviewData: '',
      width: screenWidth,
      status:
        online && providerDetails.online === '1' && connectivityAvailable
          ? 'ONLINE'
          : 'OFFLINE',
      availBackground:
        online && providerDetails.online === '1' && connectivityAvailable
          ? 'green'
          : 'red',
      isDialogLogoutVisible: false,
      isWorkRequest: false,
      isJobRequest: false,
      isRecentUser: false,
      isReviewDialogVisible: false,
      rating: '3',
      review: '',
      refreshing: false,
      pause: false,
      backClickCount: 0,
      selectedReviewItem: null,
      proImageAvailable: null,
    };
    this.springValue = new Animated.Value(100);
  }

  //Get All Bookings
  componentDidMount = () => {
    const { generalInfo: { online, connectivityAvailable }, messagesInfo: { fetchedLatestChats } } = this.props;
    if (!online && connectivityAvailable) Config.socket.connect();
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    if (!fetchedLatestChats)
      this.getAllRecentChatsPro();
  };

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  componentDidUpdate() {
    const {
      generalInfo: { connectivityAvailable },
      userInfo: { providerDetails },
      jobsInfo: {
        dataWorkSource,
        dataWorkSourceFetched
      },
      messagesInfo: { fetchedLatestChats }
    } = this.props;
    const { status, isLoading } = this.state;
    if (dataWorkSource && dataWorkSourceFetched && isLoading) this.setState({ isLoading: false, isWorkRequest: true });
    if (!connectivityAvailable && status === 'ONLINE')
      this.setState({
        status: 'OFFLINE',
        availBackground: 'red',
      });
    else if (
      connectivityAvailable &&
      providerDetails.online === '1' &&
      status === 'OFFLINE'
    ) {
      this.setState({
        status: 'ONLINE',
        availBackground: 'green',
      });
    }
    if (!fetchedLatestChats) this.getAllRecentChatsPro();
  }

  onRefresh = async () => {
    this.setState({ refreshing: true, isLoading: true, isWorkRequest: false });
    const {
      generalInfo: { online, connectivityAvailable },
      userInfo: { providerDetails },
    } = this.props;
    this.setState({
      status:
        online && providerDetails.online === '1' && connectivityAvailable
          ? 'ONLINE'
          : 'OFFLINE'
    });
    await this.getAllRecentChatsPro();
    this.setState({ refreshing: false, isLoading: false, isWorkRequest: true });
    this.springValue = new Animated.Value(100);
  };

  //Recent Chat Message
  getAllRecentChatsPro = async () =>
    await getAllRecentChats({
      id: this.props?.userInfo?.providerDetails?.providerId,
      dataSource: this.props?.messagesInfo?.latestChats,
      onSuccess: data => {
        this.props.updateLatestChats(data);
        this.setState({ isLoadingLatestChats: false });
      },
      onError: (() => {
        this.props.updateLatestChats(this.props?.messagesInfo?.latestChats || []);
        this.setState({ isLoadingLatestChats: false });
      })
    });

  renderRecentMessageItem = (item, index) => {
    if (item) {
      const {
        dispatchSelectedJobRequest,
        jobsInfo: { allJobRequestsProviders },
        fetchedNotifications,
        navigation,
      } = this.props;

      const currentPos = allJobRequestsProviders.findIndex(el => el.user_id === item.id);
      const selectedJobReq = allJobRequestsProviders[currentPos];

      if (selectedJobReq && selectedJobReq.user_details && (currentPos !== undefined && currentPos !== -1))
        return (
          <TouchableOpacity
            key={index}
            style={styles.itemMainContainer}
            onPress={() => {
              dispatchSelectedJobRequest(selectedJobReq);
              fetchedNotifications({ type: 'messages', value: 0 });
              if (selectedJobReq.status === 'Pending') {
                navigation.navigate('ProAcceptRejectJob', {
                  currentPos,
                  orderId: selectedJobReq.orderId,
                });
              } else
                navigation.navigate('ProChat', {
                  currentPos,
                  userId: item.id,
                  name: item.name,
                  image: item.image,
                  orderId: item.orderId,
                  serviceName: item.serviceName,
                  pageTitle: 'ProDashboard',
                  imageAvailable: item.imageAvailable,
                });
            }}>
            <View style={styles.itemImageView}>
              <Image
                style={{ width: 40, height: 40, borderRadius: 100 }}
                source={{ uri: item.image }}
              />
            </View>
            <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
              <Text
                style={{
                  fontSize: 14,
                  color: 'black',
                  textAlignVertical: 'center',
                }}>
                {item.name}
              </Text>
              <Text
                style={{
                  width: screenWidth - 150,
                  fontSize: 10,
                  color: 'black',
                  textAlignVertical: 'center',
                  color: 'gray',
                  marginTop: 3,
                }}
                numberOfLines={2}>
                {item.textMessage}
              </Text>
            </View>

            <View
              style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
              <Text style={{ alignSelf: 'flex-end', marginRight: 20, fontSize: 8 }}>
                {item.date}
              </Text>
            </View>
          </TouchableOpacity>
        );
    } return <View key={index}></View>
  };

  renderDoneJobs = () => {
    const {
      userInfo: { providerDetails },
      jobsInfo: { dataWorkSource },
      navigation,
    } = this.props;
    return <View>{
      dataWorkSource.map((item, index) => {
        if (
          item &&
          String(item.employee_id) === String(providerDetails.providerId) &&
          (item.status === 'Accepted' ||
            item.status === 'Completed' ||
            item.status === 'Cancelled')
        ) {
          return (
            <TouchableOpacity
              key={index}
              style={{
                width: screenWidth,
                flexDirection: 'row',
                backgroundColor: 'white',
              }}
              onPress={() =>
                navigation.navigate('ProBookingDetails', {
                  currentPos: index,
                  bookingDetails: item,
                })
              }>
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingTop: 15,
                  paddingBottom: 15,
                  paddingLeft: 5,
                  paddingRight: 5,
                }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
                  {item.service_details.service_name}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingTop: 15,
                  paddingBottom: 15,
                  paddingLeft: 5,
                  paddingRight: 5,
                }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    ...(item.status === 'Pending'
                      ? styles.colorYellow
                      : item.status === 'Accepted'
                        ? styles.colorGreen
                        : item.status === 'Completed'
                          ? styles.colorBlack
                          : styles.colorRed),
                  }}>
                  {item.status}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingTop: 15,
                  paddingBottom: 15,
                  paddingLeft: 5,
                  paddingRight: 5,
                }}
                onPress={() => this.askForReview(item)}>
                <Text style={{ fontSize: 12 }}>
                  {item.customer_review == 'Requested'
                    ? 'Waiting'
                    : item.customer_rating == ''
                      ? 'Ask for review'
                      : item.customer_rating + '/5'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingTop: 15,
                  paddingBottom: 15,
                  paddingLeft: 5,
                  paddingRight: 5,
                }}
                onPress={() => this.changeDialogVisibility(true, '', item, '', '')}>
                <Text style={{ fontSize: 12 }}>
                  {item.employee_rating == ''
                    ? 'Give review'
                    : item.employee_rating + '/5'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        } return <View key={index}></View>
      })
    }</View>
  };

  updateOnlineAvailability = async userData =>
    await updateAvailabilityInDB({
      userData,
      providerDetails: this.props?.userInfo?.providerDetails,
      updateProviderDetails: this.props?.updateProviderDetails,
      online: this.props?.generalInfo?.online,
      onSuccess: (msg, liveOnline, manualOnline) => {
        this.setState({
          status: manualOnline === '1' && liveOnline ? 'ONLINE' : 'OFFLINE',
          availBackground: manualOnline === '1' && liveOnline ? 'green' : 'red',
          isLoading: false,
          isErrorToast: false,
        });
        this.showToast(msg);
      },
      onError: msg => {
        this.setState({
          isLoading: false,
        });
        this.showToast(msg);
      },
    });

  changeAvailabilityStatus = () => {
    const {
      generalInfo: { online, connectivityAvailable },
      userInfo: { providerDetails },
    } = this.props;
    if (!connectivityAvailable) return false;
    this.setState({
      isLoading: true,
    });
    const liveOffline = !online && providerDetails.online === '1';
    const manualOffline = online && providerDetails.online === '0';
    const combinedOffline = !online && providerDetails.online === '0';

    if (liveOffline) {
      Config.socket.close();
      Config.socket.connect();
      this.setState({ isLoading: false });
    } else if (manualOffline) {
      this.updateOnlineAvailability({
        online: '1',
      });
    } else if (combinedOffline) {
      Config.socket.connect();
      this.updateOnlineAvailability({
        online: '1',
      });
    } else {
      const newStatus = providerDetails.online === '1' ? '0' : '1';
      !online ? Config.socket.connect() : Config.socket.close();
      this.updateOnlineAvailability({ online: newStatus });
    }
  };

  _spring = () =>
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

  handleBackButtonClick = () => {
    if (Platform.OS === 'ios')
      this.state.backClickCount === 1 ? RNExitApp.exitApp() : this._spring();
    else
      this.state.backClickCount === 1 ? BackHandler.exitApp() : this._spring();
    return true;
  };

  renderSeparator = () => {
    return (
      <View style={{ height: 1, width: '100%', backgroundColor: colorBg }} />
    );
  };

  //Call also from ReviewDialog
  changeDialogVisibility = (bool, text, item, rating, review) => {
    if (item) {
      if (item.employee_rating === '') {
        this.setState({
          isDialogLogoutVisible: bool,
          reviewData: item,
          mainId: item._id,
          selectedReviewItem: item,
        });
      }
    } else {
      if (text === 'Not now') {
        this.setState({
          isDialogLogoutVisible: bool,
          reviewData: item,
        });
      } else if (text === 'Submitted') {
        if (this.state.reviewData.status == "Completed")
          this.reviewTaskProvider(this.state.rating, this.state.review, this.state.selectedReviewItem);
        else SimpleToast.show("Task needs to be completed first");
        this.setState({
          isDialogLogoutVisible: bool,
          reviewData: item,
          rating: rating,
          review: review,
        });
      }
    }
  };

  goToProMapDirection = (chat_status, status, jobInfo) => {
    const {
      navigation: { navigate },
      generalInfo: { othersCoordinates },
    } = this.props;
    if (chat_status.toString() === '0') {
      this.setState({
        isErrorToast: true,
      });
      this.showToast('Accept Chat Request First');
    } else {
      const { dispatchSelectedJobRequest } = this.props;
      dispatchSelectedJobRequest(jobInfo);
      if (status === 'Pending') {
        navigate('ProAcceptRejectJob', {
          currentPos: jobInfo.currentPos,
          orderId: jobInfo.orderId,
        });
      } else if (status === 'Accepted') {
        if (!othersCoordinates || !othersCoordinates[jobInfo.user_id]) return SimpleToast.show('Fetching co-ordinates, please wait');
        navigate('ProMapDirection', {
          currentPos: jobInfo.currentPos,
          pageTitle: 'ProDashboard',
        });
      }
    }
  };

  rejectJob = async (pos, redirect) =>
    await rejectChatRequest(
      {
        pos,
        fetchedPendingJobInfo: this.props?.fetchedPendingJobInfo,
        providerDetails: this.props?.userInfo?.providerDetails,
        jobRequestsProviders: this.props?.jobsInfo?.jobRequestsProviders,
        toggleLoading: error => this.changeWaitingDialogVisibility(null, error),
        onError: error => {
          SimpleToast.show(error, SimpleToast.SHORT);
          this.setState({ isErrorToast: true, error });
        },
        navigate: () => this.props.navigation.navigate('ProAcceptRejectJob'),
      },
      redirect,
    );

  acceptChat = async (pos, redirect) =>
    await acceptChatRequest(
      {
        pos,
        fetchedPendingJobInfo: this.props?.fetchedPendingJobInfo,
        providerDetails: this.props?.userInfo?.providerDetails,
        jobRequests: this.props?.jobsInfo?.jobRequestsProviders,
        setSelectedJobRequest: this.props?.dispatchSelectedJobRequest,
        toggleLoading: error => this.changeWaitingDialogVisibility(null, error),
        onError: error => {
          SimpleToast.show(error, SimpleToast.SHORT);
          this.setState({ isErrorToast: true, error });
        },
        navigate: () => this.props.navigation.navigate('ProAcceptRejectJob'),
      },
      redirect,
    );

  renderPendingJobs = (item, index) => {
    if (item) {
      const {
        image,
        name,
        user_id,
        service_name,
        chat_status,
        status,
        imageAvailable,
        order_id,
      } = item;
      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.pendingJobRow,
            {
              paddingVertical: 0,
              shadowColor: black,
              borderWidth: 0.5,
              borderColor: lightGray,
              backgroundColor: darkGray,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.75,
              shadowRadius: 5,
              elevation: 5,
            },
          ]}
          onPress={() =>
            this.goToProMapDirection(chat_status, status, {
              currentPos: index,
              userType: 'provider',
              user_id,
              orderId: order_id,
            })
          }>
          <View style={styles.pendingJobRow}>
            <Image
              style={{
                height: 30,
                width: 30,
                justifyContent: 'center',
                alignSelf: 'center',
                alignContent: 'center',
                marginLeft: 10,
                borderRadius: 200,
              }}
              source={
                image && imageAvailable
                  ? { uri: image }
                  : require('../../images/generic_avatar.png')
              }
            />
            <View
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'center',
                textAlignVertical: 'middle',
              }}>
              <Text
                style={{
                  color: white,
                  fontSize: 12,
                  marginLeft: 10,
                  fontWeight: 'bold',
                }}>
                {name}
              </Text>
              <Text
                style={{
                  color: white,
                  fontSize: 10,
                  marginLeft: 10,
                  textAlignVertical: 'center',
                }}>
                {'Request for ' + service_name}
              </Text>
              <Text
                style={{
                  color: white,
                  fontSize: 10,
                  marginLeft: 10,
                  textAlignVertical: 'center',
                  fontWeight: 'bold',
                }}>
                {chat_status === '0'
                  ? 'New Job Request'
                  : status === 'Pending'
                    ? 'Chat Request Accepted'
                    : 'Job Accepted'}
              </Text>
            </View>
            {chat_status === '1' && (
              <View style={styles.arrowView}>
                <Image
                  style={styles.arrow}
                  source={require('../../icons/arrow_right_animated.gif')}
                />
              </View>
            )}
            {chat_status === '0' && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.viewReject}
                  onPress={() => this.rejectJob(index, false)}>
                  <Text style={styles.textReject}>Reject Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewAccept}
                  onPress={() => this.acceptChat(index, false)}>
                  <Text style={styles.textAccept}>Accept Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }
  };

  reviewTaskProvider = async (rating, review, item) =>
    await reviewTask({
      rating,
      review,
      main_id: this.state.mainId,
      fcm_id: item?.user_details?.fcm_id,
      senderName: this.props?.userInfo?.providerDetails?.name,
      senderId: this.props?.userInfo?.providerDetails?.providerId,
      userType: 'Employee',
      notification_by: 'Employee',
      notificationType: 'Review',
      reviewURL: REVIEW_RATING,
      onSuccess: () => {
        this.setState({
          isErrorToast: false,
          isLoading: false,
          isReviewDialogVisible: false,
          mainId: '',
        });
      },
      toggleIsLoading: bool => {
        if (bool === true) {
          this.setState({
            isLoading: bool,
            isErrorToast: false,
            employee_rating: rating,
            employee_review: review,
          });
        } else {
          this.setState({
            isLoading: false,
            isErrorToast: true,
          });
        }
      },
    });

  askForReview = async item => {
    if (item.status == "Completed")
      await requestClientForReview({
        item,
        fetchJobRequestHistory: this.props?.fetchJobRequestHistory,
        providerDetails: this.props?.userInfo?.providerDetails,
        toggleIsLoading: this.changeWaitingDialogVisibility,
        onSuccess: msg => {
          this.changeWaitingDialogVisibility(false);
          msg && this.showToast(msg);
        },
        onError: msg => {
          this.changeWaitingDialogVisibility(false);
          msg && this.showToast(msg);
        },
      });
    SimpleToast.show('Task has to be completed first');
  }


  showToast = (message, length) => {
    if (length) {
      SimpleToast.show(message, length);
    } else SimpleToast.show(message);
  };

  changeWaitingDialogVisibility = (bool, error) => {
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
      isErrorToast: error ? true : false,
      error,
    }));
  };

  render() {
    const {
      jobsInfo: {
        jobRequestsProviders,
        dataWorkSource,
        dataWorkSourceFetched
      },
      userInfo: { providerDetails },
      messagesInfo: { latestChats, fetchedLatestChats },
      navigation,
    } = this.props;
    const { status, isLoadingLatestChats } = this.state;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View
          style={[
            styles.header,
            { borderBottomWidth: 1, borderBottomColor: themeRed },
          ]}>
          <ProHamburger text="kuchapa" />
        </View>
        <View style={styles.onlineOfflineHeader}>
          <Text
            style={{
              flex: 1,
              textAlignVertical: 'center',
              alignItems: 'flex-start',
              alignContent: 'flex-start',
              justifyContent: 'flex-start',
              marginLeft: 15,
              fontWeight: 'bold',
            }}>
            Availability
          </Text>

          <View style={styles.onlineOfflineView}>
            <Switch
              trackColor={{
                false: '#767577',
                true: this.state.availBackground,
              }}
              thumbColor={
                this.state.status.toLocaleLowerCase() === 'online'
                  ? white
                  : '#f4f3f4'
              }
              ios_backgroundColor={this.state.availBackground}
              onChange={this.changeAvailabilityStatus}
              value={status === 'ONLINE'}
            />
            <Text
              style={{
                color: black,
                textTransform: 'capitalize',
                alignSelf: 'center',
              }}>
              {status}
            </Text>
          </View>
        </View>
        <ScrollView
          style={{
            marginBottom:
              jobRequestsProviders && jobRequestsProviders.length === 0
                ? 0
                : 45 * jobRequestsProviders.length,
            backgroundColor: lightGray,
          }}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
              title="Loading"
            />
          }>
          <View>
            {fetchedLatestChats && (
              <View style={styles.mainContainer}>
                <View style={styles.recentMessageHeader}>
                  <Text
                    style={{
                      flex: 1,
                      textAlignVertical: 'center',
                      alignItems: 'flex-start',
                      fontSize: font_size.header,
                      alignContent: 'flex-start',
                      justifyContent: 'flex-start',
                      marginLeft: 15,
                      fontWeight: 'bold',
                    }}>
                    Recent Message
                  </Text>
                  <TouchableOpacity
                    style={styles.viewAll}
                    onPress={() => navigation.navigate('ProAllMessage')}>
                    <Text style={styles.textViewAll}>View All</Text>
                  </TouchableOpacity>
                </View>
                {latestChats?.length > 0 ?
                  <ScrollView>
                    {<View style={styles.listView}>
                      {latestChats.map(this.renderRecentMessageItem)}
                    </View>}
                  </ScrollView> :
                  <View style={styles.listView}>
                    <Text style={{ fontStyle: 'italic', color: darkGray }}>You have no chats to display</Text>
                  </View>
                }
              </View>
            )}
            {isLoadingLatestChats &&
              <View style={styles.activityIncatorContainer}>
                <ActivityIndicator size={'large'} color={themeRed} />
              </View>
            }
            {this.state.isWorkRequest && dataWorkSourceFetched && (
              <View style={styles.mainContainer}>
                <View style={styles.recentMessageHeader}>
                  <Text
                    style={{
                      flex: 1,
                      textAlignVertical: 'center',
                      alignItems: 'flex-start',
                      fontSize: font_size.header,
                      alignContent: 'flex-start',
                      justifyContent: 'flex-start',
                      marginLeft: 15,
                      fontWeight: 'bold',
                    }}>
                    Work
                  </Text>
                  {false && (
                    <TouchableOpacity onPress={() => navigation.navigate('Booking', { from: 'Dashboard' })} style={styles.viewAll}>
                      <Text style={styles.textViewAll}>View All</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View
                  style={{
                    width: screenWidth,
                    height: 1,
                    backgroundColor: lightGray,
                  }}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    padding: 10,
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                    Job's Name
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                    Status
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                    Review
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                    Client Review
                  </Text>
                </View>
                <View style={styles.listView}>
                  {dataWorkSource && dataWorkSource.length > 0 && <ScrollView>
                    {this.renderDoneJobs()}
                  </ScrollView>}
                  {dataWorkSourceFetched && dataWorkSource.length === 0 && (
                    <View style={{ padding: 15 }}>
                      {providerDetails.address === '' ? (
                        <View
                          style={{
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                          <Text
                            style={{
                              fontStyle: 'italic',
                              color: darkGray,
                              textAlign: 'center',
                            }}>
                            Add your address to your profile for it to be
                            visible to potential clients.
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              navigation.navigate('ProMyProfile', {
                                from: "ProDashboard"
                              });
                            }}
                            style={{
                              backgroundColor: themeRed,
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 5,
                              margin: 5,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.75,
                              shadowRadius: 5,
                              elevation: 5,
                            }}>
                            <Text style={{ color: white }}>Profile</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={{ fontStyle: 'italic', color: darkGray }}>
                          You haven't completed any jobs yet.
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}
            {!dataWorkSourceFetched && <View style={styles.activityIncatorContainer}><ActivityIndicator size={'large'} color={themeRed} /></View>}
          </View>
        </ScrollView>
        {jobRequestsProviders && jobRequestsProviders.length > 0 && (
          <View style={styles.pendingJobsContainer}>
            {jobRequestsProviders.map(this.renderPendingJobs)}
          </View>
        )}
        <Modal
          transparent={true}
          visible={this.state.isDialogLogoutVisible}
          animationType="fade"
          onRequestClose={() =>
            this.changeDialogVisibility(false, '', '', '', '', '')
          }>
          <ReviewDialog
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.75,
              shadowRadius: 5,
              elevation: 5,
            }}
            changeDialogVisibility={this.changeDialogVisibility}
            updateRating={(rating) => this.setState({ rating })}
            updateReview={(review) => this.setState({ review })}
            data={this.state.reviewData}
            review={this.state.review}
            rating={this.state.rating}
          />
        </Modal>

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

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    jobsInfo: state.jobsInfo,
    generalInfo: state.generalInfo,
    messagesInfo: state.messagesInfo,
    userInfo: state.userInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateLatestChats: data => {
      dispatch(updateLatestChats(data));
    },
    setLatestChatsError: () => {
      dispatch(setLatestChatsError());
    },
    fetchNotifications: data => {
      dispatch(startFetchingNotification(data));
    },
    fetchedNotifications: data => {
      dispatch(notificationsFetched(data));
    },
    fetchingNotificationsError: error => {
      dispatch(notificationError(error));
    },
    fetchingPendingJobInfo: () => {
      dispatch(startFetchingJobProvider());
    },
    fetchedPendingJobInfo: info => {
      dispatch(fetchedJobProviderInfo(info));
    },
    fetchPendingJobProviderInfo: (props, proId, navigateTo) => {
      dispatch(getPendingJobRequestProvider(props, proId, navigateTo));
    },
    fetchingPendingJobInfoError: error => {
      dispatch(fetchProviderJobInfoError(error));
    },
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    },
    fetchAllProJobRequestsError: () => {
      dispatch(fetchAllJobRequestsProError());
    },
    fetchJobRequestHistory: providerId => {
      dispatch(getAllWorkRequestPro(providerId));
    },
    updateProviderDetails: dits => {
      dispatch(updateProviderDetails(dits));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProDashboardScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  activityIncatorContainer: {
    display: 'flex',
    backgroundColor: white,
    padding: spacing.small
  },
  onlineOfflineHeader: {
    width: screenWidth,
    height: 50,
    flexDirection: 'row',
    backgroundColor: colorBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
  },
  onlineOfflineView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    textAlignVertical: 'center',
    marginRight: 10,
  },
  onlineOfflineText: {
    width: 90,
    textAlignVertical: 'center',
    textAlign: 'center',
    alignSelf: 'flex-end',
    fontWeight: 'bold',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 8,
    paddingBottom: 8,
    color: 'white',
    borderRadius: 3,
    marginRight: 20,
  },
  mainContainer: {
    flexDirection: 'column',
    backgroundColor: colorBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  noticationsCount: {
    position: 'absolute',
    textAlignVertical: 'center',
    textAlign: 'center',
    borderRadius: 10,
    color: 'white',
    right: 15,
    height: 20,
    width: 20,
    backgroundColor: 'red',
    top: 5,
  },
  recentMessageHeader: {
    width: screenWidth,
    height: 50,
    flexDirection: 'row',
    backgroundColor: colorBg,
    alignItems: 'center',
  },
  viewAll: {
    paddingLeft: spacing.small,
    paddingRight: spacing.small,
    paddingTop: spacing.small,
    paddingBottom: spacing.small,
    backgroundColor: 'white',
    borderColor: themeRed,
    borderWidth: 2,
    borderRadius: 5,
    marginRight: spacing.large,
  },
  textViewAll: {
    textAlignVertical: 'center',
    textAlign: 'center',
    fontSize: font_size.normal,
    alignSelf: 'flex-end',
    color: 'black',
  },
  viewAccept: {
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: white,
    shadowColor: darkGray,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 5,
    marginRight: 5,
  },
  viewReject: {
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: themeRed,
    shadowColor: black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 5,
    marginRight: 5,
  },
  textReject: {
    textAlignVertical: 'center',
    textAlign: 'center',
    alignSelf: 'flex-end',
    fontWeight: 'bold',
    fontSize: 10,
    color: white,
  },
  textAccept: {
    textAlignVertical: 'center',
    textAlign: 'center',
    alignSelf: 'flex-end',
    fontWeight: 'bold',
    fontSize: 10,
    color: darkGray,
  },
  touchaleHighlight: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 15,
  },
  textHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlignVertical: 'center',
    alignSelf: 'center',
  },
  listView: {
    flex: 1,
    backgroundColor: colorBg,
    padding: 5,
  },
  itemMainContainer: {
    width: screenWidth,
    flex: 1,
    height: 70,
    flexDirection: 'row',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    padding: 5,
  },
  itemImageView: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 5,
  },
  colorYellow: {
    color: colorYellow,
  },
  colorRed: {
    color: 'red',
  },
  colorGreen: {
    color: 'green',
  },
  colorBlack: {
    color: 'black',
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
  animatedView: {
    width: screenWidth,
    backgroundColor: colorBg,
    elevation: Platform.OS === 'android' ? 50 : 0,
    position: 'absolute',
    bottom: 0,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 1000,
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
  pendingJobStyle: {
    flex: 1,
    width: screenWidth,
    height: 80,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  pendingJobsContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: screenWidth,
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
  pendingJobRow: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  linearGradient: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: font_size.header,
    fontFamily: 'Gill Sans',
    textAlign: 'center',
    margin: 10,
    color: '#ffffff',
    backgroundColor: 'transparent',
  },
  arrowView: {
    flex: 1,
    color: 'white',
    alignContent: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 40,
    height: 20,
    tintColor: white,
    alignSelf: 'flex-end',
    marginRight: 10,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    end: 0,
    left: 0,
    top: 0,
    bottom: 0,
  },
  modal: {
    height: 360,
    paddingTop: 10,
    alignSelf: 'center',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: colorBg,
    borderRadius: 10,
    padding: 20,
    shadowColor: black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  text: {
    fontSize: font_size.sub_header,
    fontWeight: 'bold',
  },
  touchableHighlight: {
    flex: 1,
    backgroundColor: white,
    paddingVertical: 5,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 5,
    borderColor: black,
    borderWidth: 1,
    borderRadius: 5,
    marginLeft: 5,
    marginRight: 5,
    shadowColor: black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  textView: {
    flex: 1,
    alignItems: 'center',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonView: {
    flex: 1,
    flexDirection: 'row',
  },
});
