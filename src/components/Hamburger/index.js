import React from 'react';
import { connect } from 'react-redux';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { withNavigation } from '@react-navigation/compat';
import rNES from 'react-native-encrypted-storage';
import firebaseAuth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import SimpleToast from 'react-native-simple-toast';
import NetInfo from '@react-native-community/netinfo';
import _ from 'lodash';
import Config from '../Config';
import geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import { cloneDeep } from 'lodash';
import { Notifications } from 'react-native-notifications';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {
  startFetchingMessages,
  messagesFetched,
  messagesError,
  dbMessagesFetched,
  fetchClientMessages,
} from '../../Redux/Actions/messageActions';
import {
  startFetchingJobCustomer,
  fetchedJobCustomerInfo,
  getAllWorkRequestClient,
  fetchCustomerJobInfoError,
  setSelectedJobRequest,
  updateActiveRequest,
  updateCompletedBookingData,
  updateFailedBookingData,
  getPendingJobRequest
} from '../../Redux/Actions/jobsActions';
import {
  updatingCoordinates,
  updateCoordinates,
  updateCoordinatesError,
  updateOthersCoordinates,
  updatingOthersCoordinates,
  updateOthersCoordinatesError,
  updateOnlineStatus,
  updateConnectivityStatus,
  updateLiveChatUsers,
} from '../../Redux/Actions/generalActions';
import { resetUserDetails } from '../../Redux/Actions/userActions';
import {
  locationPermissionRequest,
  returnCoordDetails,
  checkNoficationsAvailability,
} from '../../misc/helpers';
import { checkForUserType } from '../../controllers/users';
import { updateLatestChats } from '../../Redux/Actions/messageActions';
import { deregisterOnlineStatusListener } from '../../controllers/chats';
import { getAllBookings } from '../../controllers/bookings';
import { white } from '../../Constants/colors';

const socket = Config.socket;
const BOOKING_HISTORY = Config.baseURL + 'jobrequest/customer_request/';
const Android = Platform.OS === 'android';
let notifications = [];
class Hamburger extends React.Component {
  constructor() {
    super();
    this.state = {
      prevConnectivityStatus: false,
      availabilityChecked: false,
      availabilityObj: {},
      currentMessage: null,
      notificationId: null,
    };
    Notifications.registerRemoteNotifications();
  }

  displayNotification = ({ title, body, id }) => {
    const check = id + title;
    if (![check].includes(notifications)) {
      this.setState({ notificationId: id });
      Android
        ? Notifications.postLocalNotification({
          title,
          body,
          extra: 'data',
        })
        : Notifications.postLocalNotification({
          body,
          title,
          sound: 'chime.aiff',
          silent: false,
          category: 'SOME_CATEGORY',
          userInfo: {},
        });
    }
  };

  logout = async () => {
    const { resetUserDetails, navigation: { navigate } } = this.props;
    if (firebaseAuth().currentUser) firebaseAuth().signOut();
    await rNES.removeItem('userId');
    await rNES.removeItem('auth');
    await rNES.removeItem('firebaseId');
    await rNES.removeItem('email');
    await rNES.removeItem('idToken');
    await rNES.removeItem('userType');
    resetUserDetails();
    Config.socket.close();
    navigate('AfterSplash');
  }

  async componentDidMount() {
    const {
      fetchedNotifications,
      updateLiveChatUsers,
      userInfo: { userDetails },
      navigation,
    } = this.props;
    const currentUser = firebaseAuth().currentUser;
    if (!currentUser) this.logout();
    const senderId = userDetails.userId;
    const locationRef = database().ref(`liveLocation/${senderId}`);
    messaging().setBackgroundMessageHandler(message => {
      if (message && message.data) {
        const data = JSON.parse(message.data.data);
        if (data && data.title && data.body)
          this.displayNotification({ title: data.title, body: data.body });
      }
    });
    messaging().onMessage(async message => {
      try {
        const data = JSON.parse(message.data.data);
        const { title, main_id, orderId } = data;
        const check = main_id + title;
        notifications.push(check);
        const {
          fetchedNotifications,
          updateActiveRequest,
          notificationsInfo,
          fetchedPendingJobInfo,
          getAllWorkRequestClient,
          getPendingJobRequest,
          jobsInfo: { jobRequests },
          userInfo: { userDetails },
        } = this.props;
        const senderId = userDetails.userId;
        const { currentMessage } = this.state;
        const currentGenericCount = notificationsInfo.generic;
        this.setState({ currentMessage: message });
        if (!_.isEqual(currentMessage, message)) {
          title !== 'Message Recieved' &&
            fetchedNotifications({
              type: 'generic',
              value: currentGenericCount + 1,
            });
        }
        let newJobRequests = cloneDeep(jobRequests);
        let pos = jobRequests.findIndex(obj => orderId === obj.orderId);
        if (title.toLowerCase() === 'chat request rejected') {
          if (pos !== undefined && pos !== -1) {
            newJobRequests.splice(pos, 1);
            fetchedPendingJobInfo({ data: newJobRequests });
            navigation.navigate('Home');
          } else getPendingJobRequest(this.props, senderId, 'Home');
          getAllWorkRequestClient({ clientId: senderId, props: this.props });
          this.showToast(
            'The service provider rejected your request. please try again later',
          );
        } else if (title.toLowerCase() === 'job accepted') {
          getPendingJobRequest(this.props, senderId, 'Home');
          getAllWorkRequestClient({ clientId: senderId, props: this.props });
          this.getAllBookingsCustomer();
          this.showToast('Your job has been accepted.');
        } else if (title.toLowerCase() === 'job rejected') {
          if (pos !== undefined && pos !== -1) {
            newJobRequests.splice(pos, 1);
            fetchedPendingJobInfo({ data: newJobRequests });
            navigation.navigate('Home');
          } else getPendingJobRequest(this.props, senderId, 'Home');
          this.getAllBookingsCustomer();
          this.showToast('Your job has been rejected. please try again later');
        } else if (title.toLowerCase() === 'job completed') {
          if (pos !== undefined && pos !== -1) {
            newJobRequests.splice(pos, 1);
            fetchedPendingJobInfo({ data: newJobRequests });
            navigation.navigate('Home');
          } else getPendingJobRequest(this.props, senderId, 'Home');
          getAllWorkRequestClient({ clientId: senderId, props: this.props });
          this.getAllBookingsCustomer();
          this.showToast('Your job is complete..');
        } else if (title.toLowerCase() === 'chat request accepted') {
          getPendingJobRequest(this.props, senderId, 'Home');
          getAllWorkRequestClient({ clientId: senderId, props: this.props });
          this.showToast('Chat request accepted');
          updateActiveRequest(false);
        } else if (
          title.toLowerCase() === 'No Response' ||
          title.toLowerCase() === 'cancelled' ||
          title.toLowerCase() === 'job cancelled'
        ) {
          if (pos !== undefined && pos !== -1) {
            newJobRequests.splice(pos, 1);
            fetchedPendingJobInfo({ data: newJobRequests });
            navigation.navigate('Home');
          } else getPendingJobRequest(this.props, senderId, 'Home');
          this.showToast(
            'The service provider is nolonger available. please try again later',
          );
        }
      } catch (e) {
        SimpleToast.show(e.message);
      }
    });
    await checkNoficationsAvailability();
    await checkForUserType(navigation.navigate);
    /** fetch users current position and upload it to db */
    locationPermissionRequest(() => {
      const {
        fetchingCoordinates,
        fetchedCoordinates,
        fetchCoordinatesError,
      } = this.props;
      //use db info first
      fetchingCoordinates();
      fetchedCoordinates({
        latitude: userDetails.lat,
        longitude: userDetails.lang,
      });
      geolocation.getCurrentPosition(
        async info => {
          const {
            coords: { latitude, longitude },
          } = info;
          fetchingCoordinates();
          fetchedCoordinates({
            latitude,
            longitude,
          });
          const addressInfo = await returnCoordDetails({
            lat: latitude.toString(),
            lng: longitude.toString(),
          });
          locationRef
            .set({
              latitude,
              longitude,
              address: addressInfo.msg === 'ok' && addressInfo.address,
            })
            .then(() => {
              if (userDetails.lat != latitude || userDetails.lang != longitude)
                fetchedCoordinates({
                  latitude,
                  longitude,
                });
            })
            .catch(e => {
              SimpleToast.show('Location could not be uploaded');
              fetchCoordinatesError(e.message);
            });
        },
        error => {
          SimpleToast.show('Location could not be retrieved');
          fetchCoordinatesError(error.message);
        },
        {
          enableHighAccuracy: true,
        },
      );

      /** lookout for users changing position start */
      geolocation.watchPosition(
        async info => {
          const {
            coords: { latitude, longitude },
          } = info;
          const {
            fetchedCoordinates,
            fetchCoordinatesError,
          } = this.props;
          const addressInfo = await returnCoordDetails({
            lat: latitude.toString(),
            lng: longitude.toString(),
          });
          locationRef
            .set({
              latitude,
              longitude,
              address: addressInfo.msg === 'ok' && addressInfo.address,
            })
            .then(() => {
              fetchedCoordinates({ latitude, longitude });
            })
            .catch(e => {
              SimpleToast.show('Location could not be uploaded');
              fetchCoordinatesError(e.message);
            });
        },
        error => {
          SimpleToast.show('Location could not be retrieved');
          fetchCoordinatesError(error.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 200
        },
      );
      /** end lookout for pros changing position */
    });

    this.fetchEmployeeLocations();

    const { updateOnlineStatus, updateConnectivityStatus } = this.props;

    NetInfo.addEventListener(status => {
      const {
        userInfo: { userDetails },
      } = this.props;
      const senderId = userDetails.userId;
      if (status.isConnected && !this.state.prevConnectivityStatus) {
        setTimeout(() => {
          getAllWorkRequestClient({ clientId: senderId, props: this.props });
          getPendingJobRequest(this.props, senderId);
        }, 1000);
        this.setState({ prevConnectivityStatus: status.isConnected });
      }
      if (!status.isConnected) {
        this.setState({ prevConnectivityStatus: status.isConnected });
      }
      updateConnectivityStatus(status.isConnected);
    });

    NetInfo.fetch().then(status => {
      updateConnectivityStatus(status.isConnected);
    });

    socket.on('connect', () => {
      const userId = userDetails.userId;
      if (userId) {
        socket.emit('authentication', {
          id: userId,
          userType: 'client',
        });
      }
    });

    socket.on('authorized', response => {
      updateOnlineStatus(true);
    });

    socket.on('unauthorized', reason => {
      updateOnlineStatus(false);
    });

    socket.on('user-disconnected', users => {
      updateLiveChatUsers(users);
    });
    socket.on('user-joined', users => {
      updateLiveChatUsers(users);
    });
    socket.on('chat-message', data => {
      const { sender } = cloneDeep(data);
      const { notificationsInfo, messagesInfo, dbMessagesFetched } = this.props;
      let newMessages = cloneDeep(messagesInfo.messages);
      let currentMessagesCount = notificationsInfo.messages;
      let prevMessages = newMessages[sender]
        ? cloneDeep(newMessages[sender])
        : [];
      let prevMessage = prevMessages.pop();
      if (JSON.stringify(prevMessage) !== JSON.stringify(data)) {
        let newMessagesCount = currentMessagesCount + 1;
        fetchedNotifications({ type: 'messages', value: newMessagesCount });
        newMessages[sender]
          ? newMessages[sender].push(data)
          : (newMessages[sender] = [data]);
        dbMessagesFetched({ data: newMessages });
      }
    });

    socket.on('disconnect', info => {
      const {
        generalInfo: { connectivityAvailable }
      } = this.props;
      try {
        updateLiveChatUsers({});
        updateOnlineStatus(false);
        if (connectivityAvailable) {
          setTimeout(() => {
            socket.connect();
          }, 1000);
        }
      } catch (e) {
        SimpleToast.show(e.message)
      }
    });
    socket.connect();
  }

  componentDidUpdate() {
    const {
      jobsInfo: { jobRequests },
      generalInfo: { othersCoordinatesFetched }
    } = this.props;
    const currentUser = firebaseAuth().currentUser;
    if (!currentUser) this.logout();
    if (jobRequests && !othersCoordinatesFetched)
      this.fetchEmployeeLocations();
  }

  componentWillUnmount() {
    const {
      userInfo: { userDetails },
    } = this.props;
    const senderId = userDetails.userId;
    senderId && deregisterOnlineStatusListener(senderId);
  }

  getAllBookingsCustomer = () =>
    getAllBookings({
      userId: this.props?.userInfo?.userDetails?.userId,
      userType: 'Customer',
      toggleIsLoading: () => { },
      bookingHistoryURL: BOOKING_HISTORY,
      onSuccess: (bookingCompleteData, bookingRejectData, metaData) => {
        this.props.updateCompletedBookingData({ data: bookingCompleteData, metaData });
        this.props.updateFailedBookingData({ data: bookingRejectData, metaData });
      },
    });

  fetchEmployeeLocations = () => {
    const {
      fetchedOthersCoordinates,
      jobsInfo: { jobRequests },
    } = this.props;
    jobRequests.map(obj => {
      const { employee_id } = obj;
      database()
        .ref(`liveLocation/${employee_id}/address`)
        .on('value', (changeData) => {
          const {
            generalInfo: { othersCoordinates, },
          } = this.props;
          const newAddress = changeData.val();
          if (!othersCoordinates[employee_id] || othersCoordinates[employee_id]?.address != newAddress) {
            let newOthersCoordinates = Object.assign({}, othersCoordinates);
            newOthersCoordinates[employee_id] = Object.assign(newOthersCoordinates[employee_id] || {}, { address: newAddress });
            fetchedOthersCoordinates(newOthersCoordinates);
          }
        });
      database()
        .ref(`liveLocation/${employee_id}/latitude`)
        .on('value', (changeData) => {
          const {
            generalInfo: { othersCoordinates, },
          } = this.props;
          const newLat = changeData.val();
          if (othersCoordinates[employee_id] || othersCoordinates[employee_id]?.latitude != newLat) {
            let newOthersCoordinates = Object.assign({}, othersCoordinates);
            newOthersCoordinates[employee_id] = Object.assign(newOthersCoordinates[employee_id] || {}, { latitude: newLat });
            fetchedOthersCoordinates(newOthersCoordinates);
          }
        });
      database()
        .ref(`liveLocation/${employee_id}/longitude`)
        .on('value', (changeData) => {
          const {
            generalInfo: { othersCoordinates, },
          } = this.props;
          const newLong = changeData.val();
          if (othersCoordinates[employee_id] || othersCoordinates[employee_id]?.longitude != newLong) {
            let newOthersCoordinates = Object.assign({}, othersCoordinates);
            newOthersCoordinates[employee_id] = Object.assign(newOthersCoordinates[employee_id] || {}, { longitude: newLong })
            fetchedOthersCoordinates(newOthersCoordinates);
          }
        });
    });
  };

  showToast = message => {
    SimpleToast.show(message, SimpleToast.SHORT);
  };

  render() {
    const { text, navigation, notificationsInfo, fix } = this.props;
    const notificationTotal =
      notificationsInfo.messages +
      notificationsInfo.generic +
      notificationsInfo.adminMessages;
    const isFocused = navigation.isFocused();
    if (isFocused) checkForUserType(navigation.navigate);
    return (
      <>
        <TouchableOpacity
          onPress={() => {
            if (fix) navigation.navigate('Home');
            navigation.dispatch(DrawerActions.openDrawer())
          }}
          style={styles.touchableHighlight}>
          <Image
            style={styles.image}
            source={require('../../icons/humberger.png')}
          />
          {notificationTotal > 0 ? (
            <Text style={styles.noticationsCount}>{notificationTotal}</Text>
          ) : null}
        </TouchableOpacity>

        <View style={styles.textView}>
          <Text style={styles.titleText}>{text}</Text>
        </View>
      </>
    );
  }
}

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    messagesInfo: state.messagesInfo,
    generalInfo: state.generalInfo,
    jobsInfo: state.jobsInfo,
    userInfo: state.userInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchNotifications: data => {
      dispatch(startFetchingNotification(data));
    },
    fetchedNotifications: data => {
      dispatch(notificationsFetched(data));
    },
    fetchingNotificationsError: error => {
      dispatch(notificationError(error));
    },
    fetchMessages: () => {
      dispatch(startFetchingMessages());
    },
    fetchedMessages: data => {
      dispatch(messagesFetched(data));
    },
    fetchingMessagesError: error => {
      dispatch(messagesError(error));
    },
    fetchingCoordinates: () => {
      dispatch(updatingCoordinates());
    },
    fetchedCoordinates: data => {
      dispatch(updateCoordinates(data));
    },
    fetchCoordinatesError: error => {
      dispatch(updateCoordinatesError(error));
    },
    fetchedOthersCoordinates: data => {
      dispatch(updateOthersCoordinates(data));
    },
    fetchingOthersCoordinates: () => {
      dispatch(updatingOthersCoordinates());
    },
    fetchOthersCoordinatesError: error => {
      dispatch(updateOthersCoordinatesError(error));
    },
    fetchingPendingJobInfo: () => {
      dispatch(startFetchingJobCustomer());
    },
    fetchedPendingJobInfo: info => {
      dispatch(fetchedJobCustomerInfo(info));
    },
    fetchingPendingJobInfoError: error => {
      dispatch(fetchCustomerJobInfoError(error));
    },
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    },
    updateActiveRequest: val => {
      dispatch(updateActiveRequest(val));
    },
    updateOnlineStatus: val => {
      dispatch(updateOnlineStatus(val));
    },
    updateConnectivityStatus: val => {
      dispatch(updateConnectivityStatus(val));
    },
    updateLiveChatUsers: val => {
      dispatch(updateLiveChatUsers(val));
    },
    dbMessagesFetched: messages => {
      dispatch(dbMessagesFetched(messages));
    },
    getAllWorkRequestClient: ({ clientId, props }) => {
      dispatch(getAllWorkRequestClient({ clientId, props }));
    },
    fetchClientMessages: (senderId, callBack) => {
      dispatch(fetchClientMessages({ senderId, callBack }));
    },
    updateCompletedBookingData: data => {
      dispatch(updateCompletedBookingData(data));
    },
    updateFailedBookingData: data => {
      dispatch(updateFailedBookingData(data));
    },
    getPendingJobRequest: (props, proId, navTo) => {
      dispatch(getPendingJobRequest(props, proId, navTo));
    },
    resetUserDetails: () => {
      dispatch(resetUserDetails());
    },
    updateLatestChats: data => {
      dispatch(updateLatestChats(data));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigation(Hamburger));

const styles = StyleSheet.create({
  touchableHighlight: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 15,
  },
  noticationsCount: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center',
    textAlign: 'center',
    borderRadius: 10,
    color: white,
    fontSize: 10,
    right: 15,
    height: 20,
    width: 20,
    backgroundColor: 'red',
    top: 5,
  },
  textView: {
    display: 'flex',
    flexDirection: 'column',
    textAlignVertical: 'center',
    marginTop: !Android ? 13 : 0,
  },
  image: {
    width: 25,
    height: 25,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlignVertical: 'center',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
