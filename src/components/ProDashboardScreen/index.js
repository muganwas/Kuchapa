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
import { updateOthersCoordinates } from '../../Redux/Actions/generalActions';
import { fetchJobInfo } from '../../controllers/jobs';
import {
  updateLatestChats,
  setLatestChatsError,
} from '../../Redux/Actions/messageActions';
import {
  acceptChatRequest,
  rejectChatRequest,
  updateAvailabilityInDB,
  getMoreRecentChats,
  setMessageChangeListeners
} from '../../controllers/chats';
import { fetchUserLocation } from '../../controllers/users';
import { requestClientForReview } from '../../controllers/jobs';
import { reviewTask } from '../../controllers/bookings';
import metrics, { font_size, spacing } from '../../Constants/metrics';
import {
  colorBg,
  colorYellow,
  lightGray,
  white,
  themeRed,
  darkGray,
  black,
  colorGray,
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
      jobsInfo: { dataWorkSourceFetched },
      userInfo: { providerDetails },
      messagesInfo: { fetchedLatestChats }
    } = props;
    this.state = {
      isLoading: true,
      isLoadingLatestChats: !fetchedLatestChats,
      isLoadingDoneJobs: !dataWorkSourceFetched,
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
      pause: false,
      backClickCount: 0,
      selectedReviewItem: null,
      proImageAvailable: null,
    };
    this.springValue = new Animated.Value(100);
  }

  //Get All Bookings
  componentDidMount = () => {
    const { generalInfo: { online, connectivityAvailable }, userInfo: { providerDetails }, messagesInfo: { fetchedLatestChats } } = this.props;
    if (!online && connectivityAvailable) Config.socket.connect();
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    if (!fetchedLatestChats)
      this.setMessageChangeListenersLocal();
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
        dataWorkSourceFetched
      }
    } = this.props;
    const { status, isLoadingDoneJobs, isLoading } = this.state;
    if (dataWorkSourceFetched && (isLoading || isLoadingDoneJobs)) this.setState({ isLoading: false, isWorkRequest: true, isLoadingDoneJobs: false });
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
  }

  onRefreshRecentChats = async () => {
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
    await this.getMoreRecentChatsLocal();
    this.springValue = new Animated.Value(100);
  };

  //Recent Chat Message
  setMessageChangeListenersLocal = async () =>
    await setMessageChangeListeners({
      id: this.props?.userInfo?.providerDetails?.providerId,
      dataSource: this.props?.messagesInfo?.latestChats,
      onSuccess: async (data, metaData) => {
        this.props.updateLatestChats({ data, metaData });
        this.setState({ isLoading: false, isLoadingLatestChats: false });
      },
      onError: ((error) => {
        SimpleToast.show(error);
        this.setState({ isLoading: false, isLoadingLatestChats: false });
      })
    });

  getMoreRecentChatsLocal = async () => {
    const { messagesInfo: { latestChatsMeta: { page, limit } } } = this.props;
    this.setState({ isLoadingLatestChats: true });
    await getMoreRecentChats({
      id: this.props?.userInfo?.providerDetails?.providerId,
      page: Number(page) + 1,
      limit,
      dataSource: this.props?.messagesInfo?.latestChats,
      onSuccess: (data, metaData) => {
        this.props.updateLatestChats({ data, metaData });
        this.setState({ isLoadingLatestChats: false });
      },
      onError: ((e) => {
        SimpleToast.show(e);
        this.setState({ isLoadingLatestChats: false });
      })
    });
  }

  gotToChat = async ({ selectedJobReq, item, index }) => {
    const {
      dispatchSelectedJobRequest,
      navigation,
      userInfo: { providerDetails: { providerId } },
      fetchedNotifications
    } = this.props;
    if (!selectedJobReq) {
      this.setState({ isLoadingLatestChats: true });
      selectedJobReq = await fetchJobInfo({
        jobFetchURL: Config.baseURL + 'jobrequest/job_details?orderId=' + item.orderId + "&employeeId=" + providerId + "&userId=" + item.id + "&userType=Employee"
      });
    }
    await dispatchSelectedJobRequest(selectedJobReq);
    fetchedNotifications({ type: 'messages', value: 0 });
    this.setState({ isLoadingLatestChats: false });
    if (selectedJobReq.status === 'Pending' || selectedJobReq.status === 'Accepted')
      navigation.navigate('ProAcceptRejectJob', {
        currentPos: index,
        orderId: item.orderId,
      });
    else
      navigation.navigate('ProChat', {
        currentPos: index,
        receiverId: item.id,
        receiverName: item.name,
        receiverImage: item.image,
        orderId: item.orderId,
        serviceName: item.serviceName,
        pageTitle: 'ProAllMessage',
        imageAvailable: item.imageAvailable
      });
  }

  renderRecentMessageItem = (item, index) => {
    if (item) {
      const {
        jobsInfo: { jobRequestsProviders }
      } = this.props;
      const currentPos = jobRequestsProviders.findIndex(el => el.user_id === item.id);
      const selectedJobReq = jobRequestsProviders[currentPos];
      return (
        <TouchableOpacity
          key={index}
          style={styles.itemMainContainer}
          onPress={() => this.gotToChat({ selectedJobReq, item, index: currentPos })}>
          <View style={styles.itemImageView}>
            <Image
              style={{ width: 25, height: 25, borderRadius: 100 }}
              source={{ uri: item.image }}
            />
          </View>
          <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
            <Text
              style={{
                fontSize: metrics.font_size.normal,
                color: black,
                textAlignVertical: 'center',
              }}>
              {item.name}
            </Text>
            <Text
              style={{
                width: screenWidth - 150,
                fontSize: metrics.font_size.small,
                color: black,
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
    return <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{
      dataWorkSource.map((item, index) => {
        const rejected = item.status == 'Rejected';
        const pending = item.status == 'Pending';
        const accepted = item.status == 'Accepted';
        const completed = item.status == 'Completed';
        if (
          item &&
          String(item.employee_id) === String(providerDetails.providerId) &&
          !pending) {
          return (
            <TouchableOpacity
              key={index}
              style={{
                width: screenWidth,
                flexDirection: 'row',
                backgroundColor: lightGray,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 3,
                marginBottom: metrics.spacing.xsmall
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
                  justifyContent: 'center',
                  paddingTop: 15,
                  paddingBottom: 15,
                }}>
                <Text style={{ fontSize: metrics.font_size.small }}>
                  {item.service_details.service_name}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingTop: 15,
                  paddingBottom: 15,
                }}>
                <Text
                  style={{
                    fontSize: metrics.font_size.small,
                    ...(pending
                      ? styles.colorYellow
                      : accepted
                        ? styles.colorGreen
                        : completed
                          ? styles.colorBlack
                          : styles.colorRed),
                  }}>
                  {item.status}
                </Text>
              </View>
              <TouchableOpacity
                style={rejected ? styles.inactiveReviewButton : styles.reviewButton}
                disabled={rejected}
                onPress={() => this.askForReview(item)}>
                <Text style={rejected ? styles.inactiveReviewButtonText : styles.reviewButtonText}>
                  {item.customer_review == 'Requested'
                    ? 'Waiting'
                    : item.customer_rating == ''
                      ? 'Request'
                      : item.customer_rating + '/5'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={rejected ? styles.inactiveReviewButton : styles.reviewButton}
                disabled={rejected}
                onPress={() => this.changeDialogVisibility(true, '', item, '', '')}>
                <Text style={rejected ? styles.inactiveReviewButtonText : styles.reviewButtonText}>
                  {item.employee_rating == ''
                    ? 'Give'
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

  goToNextPage = (chat_status, status, jobInfo) => {
    const {
      navigation: { navigate },
      generalInfo: { othersCoordinates },
      userInfo: { providerDetails },
      jobsInfo: { jobRequestsProviders },
      fetchedOthersCoordinates,
    } = this.props;
    if (chat_status.toString() === '0') {
      this.setState({
        isErrorToast: true,
      });
      this.showToast('Accept Chat Request First');
    } else {
      const { dispatchSelectedJobRequest } = this.props;
      dispatchSelectedJobRequest(jobRequestsProviders[jobInfo.currentPos]);
      if (status === 'Pending') {
        navigate('ProAcceptRejectJob', {
          currentPos: jobInfo.currentPos,
          orderId: jobInfo.orderId,
        });
      } else if (status === 'Accepted') {
        if (!othersCoordinates || !othersCoordinates[jobInfo.user_id]) {
          fetchUserLocation({ id: jobInfo.user_id, othersCoordinates, updateOthersCoordinates: fetchedOthersCoordinates });
          return SimpleToast.show('Fetching co-ordinates, please wait');
        }
        if (!providerDetails.lat || !providerDetails.lang) {
          SimpleToast.show('Please update your address first.');
          this.props.navigation.navigate('ProMyProfile', {
            from: "ProDashboard"
          });
          return;
        }
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
            this.goToNextPage(chat_status, status, {
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
        props: this.props,
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
        dataWorkSourceFetched,
        allJobRequestsProvidersMeta: { page, totalPages }
      },
      userInfo: { providerDetails },
      messagesInfo: { latestChats, fetchedLatestChats },
      navigation,
    } = this.props;
    const { status, isLoadingLatestChats, isLoadingDoneJobs } = this.state;
    /** only display a max of 3 latest chats */
    const pos = latestChats.length >= 3 ? 3 : latestChats.length;
    const subLatestChats = latestChats.slice(0, pos);
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
        <View
          style={{
            marginBottom:
              jobRequestsProviders && jobRequestsProviders.length === 0
                ? 0
                : 45 * jobRequestsProviders.length,
            backgroundColor: lightGray,
          }}
        >
          <ScrollView style={styles.subContainer}>
            <View style={styles.recentChatContainer}>
              <View style={styles.recentMessageHeader}>
                <Text
                  style={{
                    flex: 1,
                    textAlignVertical: 'center',
                    alignItems: 'flex-start',
                    fontSize: font_size.sub_header,
                    alignContent: 'flex-start',
                    justifyContent: 'flex-start',
                    marginLeft: 15,
                    fontWeight: 'bold',
                  }}>
                  Recent Message
                </Text>
                {subLatestChats.length > 0 && <TouchableOpacity
                  style={styles.viewAll}
                  onPress={() => navigation.navigate('ProAllMessage')}>
                  <Text style={styles.textViewAll}>View All</Text>
                </TouchableOpacity>}
              </View>
              {fetchedLatestChats && <ScrollView
                refreshControl={
                  <RefreshControl
                    refreshing={isLoadingLatestChats}
                    onRefresh={this.onRefreshRecentChats}
                  />
                }
              >
                <View style={styles.listView}>
                  {subLatestChats.length > 0 && subLatestChats.map(this.renderRecentMessageItem)}
                </View>
                {
                  latestChats.length === 0 ? < View style={styles.listView}>
                    <Text style={{ fontStyle: 'italic', color: darkGray }}>You have no chats to display</Text>
                  </View> : <></>
                }
              </ScrollView>}
              {isLoadingLatestChats &&
                <View style={styles.activityIncatorContainer}>
                  <ActivityIndicator size={'large'} color={themeRed} />
                </View>
              }
            </View>

            <View style={styles.workContainer}>
              <View style={styles.recentMessageHeader}>
                <Text
                  style={{
                    flex: 1,
                    textAlignVertical: 'center',
                    alignItems: 'flex-start',
                    fontSize: font_size.sub_header,
                    alignContent: 'flex-start',
                    justifyContent: 'flex-start',
                    marginLeft: 15,
                    fontWeight: 'bold',
                  }}>
                  Work
                </Text>
                {
                  totalPages && totalPages / page > 1 &&
                  <TouchableOpacity onPress={() => {
                    const { fetchJobRequestHistory, userInfo: { providerDetails }, jobsInfo: { allJobRequestsProvidersMeta: { page } } } = this.props;
                    this.setState({ isLoadingDoneJobs: true });
                    fetchJobRequestHistory({ providerId: providerDetails.providerId, props: this.props, page: Number(page) + 1 });
                    this.setState({ isLoadingDoneJobs: false });
                  }} style={styles.viewAll}
                  >
                    <Text style={styles.textViewAll}>Load More</Text>
                  </TouchableOpacity>
                }
                {dataWorkSource?.length > 0 && <TouchableOpacity onPress={() => navigation.navigate('ProBooking', { from: 'Dashboard' })} style={styles.viewAll}>
                  <Text style={styles.textViewAll}>View All</Text>
                </TouchableOpacity>}
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
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                }}>
                <View style={styles.sectionTitle}>
                  <Text
                    style={styles.sectionTitleText}>
                    Job
                  </Text>
                </View>
                <View style={styles.sectionTitle}>
                  <Text
                    style={styles.sectionTitleText}>
                    Status
                  </Text>
                </View>
                <View style={styles.sectionTitle}>
                  <Text
                    style={styles.sectionTitleText}>
                    Client Review
                  </Text>
                </View>
                <View style={styles.sectionTitle}>
                  <Text
                    style={styles.sectionTitleText}>
                    Review
                  </Text>
                </View>
              </View>
              <View style={styles.listView}>
                {dataWorkSource?.length > 0 &&
                  <ScrollView
                    refreshControl={
                      <RefreshControl
                        refreshing={isLoadingDoneJobs}
                        onRefresh={() => {
                          const { fetchJobRequestHistory, userInfo: { providerDetails }, jobsInfo: { allJobRequestsProvidersMeta: { page } } } = this.props;
                          this.setState({ isLoadingDoneJobs: true });
                          fetchJobRequestHistory({ providerId: providerDetails.providerId, props: this.props, page: Number(page) + 1 });
                          this.setState({ isLoadingDoneJobs: false });
                        }}
                      />}
                  >
                    {this.renderDoneJobs()}
                    <View style={{ height: 200 }}></View>
                  </ScrollView>}
                {dataWorkSourceFetched && dataWorkSource?.length === 0 && (
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
            {!dataWorkSourceFetched && <View style={styles.activityIncatorContainer}><ActivityIndicator size={'large'} color={themeRed} /></View>}
          </ScrollView>
        </View >
        {jobRequestsProviders && jobRequestsProviders.length > 0 && (
          <View style={styles.pendingJobsContainer}>
            {jobRequestsProviders.map(this.renderPendingJobs)}
          </View>
        )
        }
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

        {/* <Modal
          transparent={true}
          visible={this.state.isLoading}
          animationType="fade"
          onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
          <WaitingDialog
            changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
          />
        </Modal> */}
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
      </View >
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
    fetchedOthersCoordinates: data => {
      dispatch(updateOthersCoordinates(data));
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
    fetchJobRequestHistory: ({ providerId, props, page = 1 }) => {
      dispatch(getAllWorkRequestPro({ providerId, props, page }));
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
  subContainer: {
    height: screenHeight,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: lightGray
  },
  recentChatContainer: {
    flex: 2,
    flexDirection: 'column',
    backgroundColor: colorBg,
    alignItems: 'center',
    marginTop: metrics.spacing.small,
    minHeight: 20,
  },
  workContainer: {
    flex: 5,
    flexDirection: 'column',
    backgroundColor: colorBg,
    alignItems: 'center',
    marginTop: metrics.spacing.small,
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
  sectionTitle: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: metrics.spacing.small,
    paddingRight: metrics.spacing.small,
  },
  sectionTitleText: {
    fontSize: metrics.font_size.small,
    fontWeight: 'bold',
  },
  viewAll: {
    paddingLeft: spacing.small,
    paddingRight: spacing.small,
    paddingTop: spacing.small,
    paddingBottom: spacing.small,
    backgroundColor: white,
    shadowColor: darkGray,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 5,
    marginRight: spacing.large,
  },
  textViewAll: {
    textAlignVertical: 'center',
    textAlign: 'center',
    fontSize: font_size.small,
    alignSelf: 'flex-end',
    color: 'black',
    fontWeight: '600'
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
    marginLeft: metrics.spacing.large,
  },
  reviewButton: {
    flex: 1,
    alignItems: 'center',
    paddingTop: metrics.spacing.small,
    paddingBottom: metrics.spacing.small,
    backgroundColor: white,
    margin: metrics.spacing.small,
    shadowColor: colorGray,
    shadowOffset: { width: 0, height: metrics.elevation.low },
    elevation: metrics.elevation.low,
    borderRadius: metrics.radius.xsmall
  },
  inactiveReviewButton: {
    flex: 1,
    alignItems: 'center',
    paddingTop: metrics.spacing.small,
    paddingBottom: metrics.spacing.small,
    backgroundColor: lightGray,
    margin: metrics.spacing.small,
    shadowColor: lightGray,
    shadowOffset: { width: 0, height: metrics.elevation.xlow },
    elevation: metrics.elevation.xlow,
    borderRadius: metrics.radius.xsmall
  },
  reviewButtonText: {
    fontSize: metrics.font_size.small,
    color: darkGray
  },
  inactiveReviewButtonText: {
    fontSize: metrics.font_size.small,
    color: colorGray
  },
  textHeader: {
    fontSize: metrics.font_size.header,
    fontWeight: 'bold',
    color: black,
    textAlignVertical: 'center',
    alignSelf: 'center',
  },
  listView: {
    flex: 1,
    backgroundColor: colorBg,
  },
  itemMainContainer: {
    width: screenWidth,
    height: 55,
    flexDirection: 'row',
    backgroundColor: white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: metrics.radius.xxsmall,
    elevation: metrics.elevation.low,
    padding: metrics.spacing.small,
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
