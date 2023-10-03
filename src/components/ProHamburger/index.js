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
import NetInfo from '@react-native-community/netinfo';
import firebaseAuth from '@react-native-firebase/auth';
import { cloneDeep } from 'lodash';
import { DrawerActions } from '@react-navigation/native';
import rNES from 'react-native-encrypted-storage';
import { NavigationEvents, withNavigation } from '@react-navigation/compat';
import database from '@react-native-firebase/database';
import geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import { Notifications } from 'react-native-notifications';
import SimpleToast from 'react-native-simple-toast';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
  updateNotifications,
} from '../../Redux/Actions/notificationActions';
import {
  startFetchingMessages,
  messagesFetched,
  messagesError,
  dbMessagesFetched,
  fetchEmployeeMessages,
} from '../../Redux/Actions/messageActions';
import {
  updatingCoordinates,
  updateCoordinates,
  updateCoordinatesError,
  updateOthersCoordinates,
  updatingOthersCoordinates,
  updateOthersCoordinatesError,
  updateConnectivityStatus,
  updateOnlineStatus,
  updateLiveChatUsers,
} from '../../Redux/Actions/generalActions';
import {
  fetchedJobProviderInfo,
  getPendingJobRequestProvider,
  getAllWorkRequestPro,
  updateCompletedBookingData,
  updateFailedBookingData,
} from '../../Redux/Actions/jobsActions';
import { resetUserDetails } from '../../Redux/Actions/userActions';
import Config from '../Config';
import _ from 'lodash';
import { black, white, red } from '../../Constants/colors';
import {
  locationPermissionRequest,
  returnCoordDetails,
  checkNoficationsAvailability,
} from '../../misc/helpers';
import { deregisterOnlineStatusListener } from '../../controllers/chats';
import { getAllBookings } from '../../controllers/bookings';
import { checkForUserType } from '../../controllers/users';

const socket = Config.socket;
const BOOKING_HISTORY = Config.baseURL + 'jobrequest/employee_request/';
const Android = Platform.OS === 'android';
let notifications = [];

class ProHamburger extends React.Component {
  constructor() {
    super();
    this.state = {
      currentMessage: null,
      notificationId: null,
      prevConnectivityStatus: false,
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

  async componentDidMount() {
    const {
      fetchedNotifications,
      userInfo: { providerDetails },
      navigation,
      dispatchFetchedProJobRequests,
      getAllWorkRequestPro,
      getPendingJobRequests,
      generalInfo: { connectivityAvailable }
    } = this.props;
    const currentUser = firebaseAuth().currentUser;
    if (!currentUser) this.logout();
    const receiverId = providerDetails.providerId;
    messaging().setBackgroundMessageHandler(message => {
      if (message && message.data) {
        const data = JSON.parse(message.data.data);
        if (data && data.title && data.body)
          this.displayNotification({ title: data.title, body: data.body });
      }
    });
    messaging().onMessage(async message => {
      const data = JSON.parse(message.data.data);
      const {
        notificationsInfo,
        jobsInfo: { jobRequestsProviders },
        userInfo: { providerDetails }
      } = this.props;
      const receiverId = providerDetails.providerId;
      const { currentMessage } = this.state;
      const { title, main_id } = data;
      const check = main_id + title;
      notifications.push(check);
      const currentGenericCount = notificationsInfo.generic;
      this.setState({ currentMessage: message });
      if (!_.isEqual(currentMessage, message)) {
        title !== 'Message Recieved' &&
          fetchedNotifications({
            type: 'generic',
            value: currentGenericCount + 1,
          });
      }
      const orderId = data.order_id;
      let pos = jobRequestsProviders.findIndex(obj => orderId === obj.order_id);
      let newJobRequestsProviders = cloneDeep(jobRequestsProviders);
      if (pos !== undefined && pos !== -1) {
        newJobRequestsProviders.splice(pos, 1);
        dispatchFetchedProJobRequests({ data: newJobRequestsProviders });
        navigation.navigate('ProHome');
      } else getPendingJobRequests(this.props, receiverId);
      getAllWorkRequestPro({ providerId: receiverId, props: this.props });
      this.getAllBookingsProvider();
      //title !== 'Message Recieved' && this.getAllNotificationsProvider();
      if (title.toLowerCase() === 'booking request') {
        navigation.navigate('ProChatAccept', {
          userId: data.userId,
          serviceName: data.serviceName,
          mainId: data.main_id,
          orderId: data.order_id,
          delivery_address: data.delivery_address,
          delivery_lat: data.delivery_lat,
          delivery_lang: data.delivery_lang,
        });
      } else if (title.toLowerCase() === 'job completed' || title.toLowerCase() === 'job cancelled') {
        navigation.navigate('ProHome');
      } else if (
        title.toLowerCase() === 'job cancelled' ||
        title.toLowerCase() === 'job completed'
      ) {
        SimpleToast.show(
          title.toLowerCase() === 'job cancelled'
            ? 'Job was cancelled by client'
            : 'Job was completed by client',
        );
      }
    });
    await this.fetchOthersLocations();
    await checkNoficationsAvailability();
    await checkForUserType(navigation.navigate);
    const { updateConnectivityStatus, updateOnlineStatus } = this.props;

    NetInfo.addEventListener(state => {
      const { userInfo: { providerDetails } } = this.props;
      const receiverId = providerDetails.providerId;
      if (state.isConnected && !this.state.prevConnectivityStatus && receiverId)
        this.setState({ prevConnectivityStatus: state.isConnected });

      if (!state.isConnected)
        this.setState({ prevConnectivityStatus: state.isConnected });

      updateConnectivityStatus(state.isConnected);
    });
    NetInfo.fetch().then(state => {
      updateConnectivityStatus(state.isConnected);
    });

    socket.on('connect', () => {
      const proId = providerDetails.providerId;
      if (proId) {
        socket.emit('authentication', {
          id: proId,
          userType: 'employee',
        });
      }
    });

    socket.on('authorized', response => {
      updateOnlineStatus(true);
    });

    socket.on('unauthorized', reason => {
      updateOnlineStatus(false);
    });

    socket.on('disconnect', info => {
      try {
        const { userInfo: { providerDetails } } = this.props;
        updateOnlineStatus(false);
        if (connectivityAvailable && providerDetails.online == "1") {
          setTimeout(() => {
            socket.connect();
          }, 1000)
        }
      } catch (e) {
        SimpleToast.show(e.message);
      }
    });
    socket.on('chat-message', data => {
      try {
        const { sender } = cloneDeep(data);
        const { notificationsInfo, messagesInfo, dbMessagesFetched } = this.props;
        let newMessages = cloneDeep(messagesInfo.messages);
        const currentMessagesCount = notificationsInfo.messages;
        let prevMessages = newMessages[sender]
          ? cloneDeep(newMessages[sender])
          : [];
        let prevMessage = prevMessages.pop();
        if (JSON.stringify(prevMessage) === JSON.stringify(data))
          console.log('repeated message');
        else {
          const newMessagesCount = currentMessagesCount + 1;
          fetchedNotifications({ type: 'messages', value: newMessagesCount });
          newMessages[sender]
            ? newMessages[sender].push(data)
            : (newMessages[sender] = [data]);
          dbMessagesFetched({ data: newMessages });
        }
      } catch (e) {
        SimpleToast.show(e.message);
      }
    });
    providerDetails.online == "1" && socket.connect();
    const userRef = database().ref(`liveLocation/${receiverId}`);
    locationPermissionRequest(() => {
      const {
        fetchingCoordinates,
        fetchedCoordinates,
        fetchCoordinatesError,
        userInfo: { providerDetails },
      } = this.props;
      fetchingCoordinates();
      fetchedCoordinates({
        latitude: providerDetails.lat,
        longitude: providerDetails.lang,
      });
      /** get pros current position and upload it to db */
      geolocation.getCurrentPosition(
        async info => {
          const {
            coords: { latitude, longitude },
          } = info;
          const addressInfo = await returnCoordDetails({
            lat: latitude.toString(),
            lng: longitude.toString(),
          });
          userRef
            .set({
              latitude,
              longitude,
              address: addressInfo.msg === 'ok' && addressInfo.address,
            })
            .then(() => {
              if (providerDetails.lat != latitude || providerDetails.lang != longitude)
                fetchedCoordinates({
                  latitude,
                  longitude,
                });
            })
            .catch(e => {
              SimpleToast.show(e.message);
              fetchCoordinatesError(e.message);
            });
        },
        error => {
          SimpleToast.show(error.message);
        },
        {
          enableHighAccuracy: true,
        },
      );

      /** look out for pros changing position */
      geolocation.watchPosition(
        async info => {
          const {
            fetchedCoordinates,
            fetchCoordinatesError,
          } = this.props;
          const {
            coords: { latitude, longitude },
          } = info;
          const addressInfo = await returnCoordDetails({
            lat: latitude.toString(),
            lng: longitude.toString(),
          });
          userRef
            .set({
              latitude,
              longitude,
              address: addressInfo.msg === 'ok' && addressInfo.address,
            })
            .then(() => {
              fetchedCoordinates({
                latitude,
                longitude,
              });
            })
            .catch(e => {
              SimpleToast.show(e.message);
              fetchCoordinatesError(e.message);
            });
        },
        error => {
          SimpleToast.show(error.message);
          fetchCoordinatesError(error.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 200
        },
      );
    });
  }

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

  componentDidUpdate() {
    const {
      jobsInfo: { allJobRequestsProviders },
      generalInfo: { othersCoordinatesFetched }
    } = this.props;
    const currentUser = firebaseAuth().currentUser;
    if (!currentUser) this.logout();
    if (allJobRequestsProviders && !othersCoordinatesFetched)
      this.fetchOthersLocations();
  }

  componentWillUnmount() {
    const {
      userInfo: { providerDetails },
    } = this.props;
    const senderId = providerDetails.providerId;
    senderId && deregisterOnlineStatusListener(senderId);
    geolocation.clearWatch();
  }

  getAllBookingsProvider = () =>
    getAllBookings({
      userId: this.props?.userInfo?.providerDetails?.providerId,
      userType: 'Provider',
      bookingHistoryURL: BOOKING_HISTORY,
      toggleIsLoading: () => { },
      onSuccess: (bookingCompleteData, bookingRejectData, metaData) => {
        this.props.updateCompletedBookingData({ data: bookingCompleteData, metaData });
        this.props.updateFailedBookingData({ data: bookingRejectData, metaData });
      },
    });

  fetchOthersLocations = async () => {
    const {
      jobsInfo: { allJobRequestsProviders },
      fetchedOthersCoordinates,
    } = this.props;
    await allJobRequestsProviders.map(async obj => {
      const { user_id } = obj;
      database()
        .ref(`liveLocation/${user_id}/address`)
        .on('value', (changeData) => {
          const {
            generalInfo: { othersCoordinates, },
          } = this.props;
          const newAddress = changeData.val();
          if (!othersCoordinates[user_id] || othersCoordinates[user_id]?.address != newAddress) {
            let newOthersCoordinates = Object.assign({}, othersCoordinates);
            newOthersCoordinates[user_id] = Object.assign(newOthersCoordinates[user_id] || {}, { address: newAddress });
            fetchedOthersCoordinates(newOthersCoordinates);
          }
        });
      database()
        .ref(`liveLocation/${user_id}/latitude`)
        .on('value', (changeData) => {
          const {
            generalInfo: { othersCoordinates, },
          } = this.props;
          const newLat = changeData.val();
          if (!othersCoordinates[user_id] || othersCoordinates[user_id]?.latitude != newLat) {
            let newOthersCoordinates = Object.assign({}, othersCoordinates);
            newOthersCoordinates[user_id] = Object.assign(newOthersCoordinates[user_id] || {}, { latitude: newLat });
            fetchedOthersCoordinates(newOthersCoordinates);
          }
        });
      database()
        .ref(`liveLocation/${user_id}/longitude`)
        .on('value', (changeData) => {
          const {
            generalInfo: { othersCoordinates, },
          } = this.props;
          const newLong = changeData.val();
          if (!othersCoordinates[user_id] || othersCoordinates[user_id]?.longitude != newLong) {
            let newOthersCoordinates = Object.assign({}, othersCoordinates);
            newOthersCoordinates[user_id] = Object.assign(newOthersCoordinates[user_id] || {}, { longitude: newLong });
            fetchedOthersCoordinates(newOthersCoordinates);
          }
        });
    });
  };

  render() {
    const { text, navigation, notificationsInfo, fix } = this.props;
    const notificationTotal =
      notificationsInfo.messages +
      notificationsInfo.generic +
      notificationsInfo.adminMessages;
    return (
      <>
        <NavigationEvents
          onDidFocus={async () => await checkForUserType(navigation.navigate)}
        />
        <TouchableOpacity
          onPress={() => {
            if (fix) navigation.navigate('ProHome');
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
    generalInfo: state.generalInfo,
    messagesInfo: state.messagesInfo,
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
    fetchingOthersCoordinates: () => {
      dispatch(updatingOthersCoordinates());
    },
    fetchedOthersCoordinates: data => {
      dispatch(updateOthersCoordinates(data));
    },
    fetchOthersCoordinatesError: error => {
      dispatch(updateOthersCoordinatesError(error));
    },
    dispatchFetchedProJobRequests: jobs => {
      dispatch(fetchedJobProviderInfo(jobs));
    },
    updateOnlineStatus: status => {
      dispatch(updateOnlineStatus(status));
    },
    updateConnectivityStatus: status => {
      dispatch(updateConnectivityStatus(status));
    },
    updateLiveChatUsers: val => {
      dispatch(updateLiveChatUsers(val));
    },
    dbMessagesFetched: messages => {
      dispatch(dbMessagesFetched(messages));
    },
    fetchEmployeeMessages: eId => {
      dispatch(fetchEmployeeMessages({ receiverId: eId }));
    },
    getAllWorkRequestPro: ({ providerId, props, only = '' }) => {
      dispatch(getAllWorkRequestPro({ providerId, props, only }));
    },
    getPendingJobRequests: (props, providerId, navTo) => {
      dispatch(getPendingJobRequestProvider(props, providerId, navTo));
    },
    updateNotifications: data => {
      dispatch(updateNotifications(data));
    },
    updateCompletedBookingData: data => {
      dispatch(updateCompletedBookingData(data));
    },
    updateFailedBookingData: data => {
      dispatch(updateFailedBookingData(data));
    },
    resetUserDetails: () => {
      dispatch(resetUserDetails());
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigation(ProHamburger));

const styles = StyleSheet.create({
  touchableHighlight: {
    display: 'flex',
    flexDirection: 'row',
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    backgroundColor: red,
    top: 5,
  },
  textView: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: !Android ? 13 : 0,
  },
  image: {
    width: 25,
    height: 25,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: black,
    textAlignVertical: 'center',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
