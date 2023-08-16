import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Polyline from '@mapbox/polyline';
import database from '@react-native-firebase/database';
import messaging from '@react-native-firebase/messaging';
import { exitApp } from 'react-native-exit-app';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { launchImageLibrary } from 'react-native-image-picker';
import { cloneDeep } from 'lodash';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';
import Config from '../components/Config';

const phoneUtil = PhoneNumberUtil.getInstance();
const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
const passwordRegex = /[^\w\d]*(([0-9]+.*[A-Z]+.*)|[A-Z]+.*([0-9]+.*))/;

const FETCH_MESSAGES = Config.baseURL + 'chat/fetchChats';
const PRO_GET_PROFILE = Config.baseURL + 'employee/';
const USER_GET_PROFILE = Config.baseURL + 'users/';
const PENDING_JOB_PROVIDER =
  Config.baseURL + 'jobrequest/provider_status_check/';
const PENDING_JOB_CUSTOMER =
  Config.baseURL + 'jobrequest/customer_status_check/';
const BOOKING_HISTORY = Config.baseURL + 'jobrequest/employee_request/';
const CUSTOMER_BOOKING_HISTORY =
  Config.baseURL + 'jobrequest/customer_request/';

export const locationPermissionRequest = async (action = () => { }) => {
  try {
    if (Platform.OS === 'ios') Geolocation.requestAuthorization();
    else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        action();
      } else {
        SimpleToast.show('You have denied location permission');
        exitApp();
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export const returnCoordDetails = async ({ lat = '', lng = '' }) => {
  let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${Config.mapsApiKey}`;
  let msg = {};
  if (lat && lng) {
    try {
      const response = await fetch(url);
      const resp = await response.json();
      if (resp.status.toLowerCase() === 'ok')
        return msg = {
          address: resp?.results[0]?.formatted_address,
          msg: 'ok',
        };
      else return msg = { msg: 'error' };
    } catch (e) {
      return msg = { msg: 'error' };
    }
  }
};

export const phoneNumberCheck = async (phoneNumber, countryLetterCode) => {
  if (phoneNumber && phoneNumber.length > 0) {
    try {
      const number = phoneUtil.parseAndKeepRawInput(
        phoneNumber,
        countryLetterCode,
      );
      const isValid = phoneUtil.isValidNumber(number);
      return isValid;
    } catch (e) {
      return false;
    }
  } else return false;
};

export const checkNoficationsAvailability = async () => {
  if (Platform.OS === 'android') {
    try {
      const authStatus = await messaging().requestPermission();
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          messaging()
            .getInitialNotification()
            .then(remoteMessage => {
              if (remoteMessage) {
                console.log(
                  'Notification caused app to open from quit state:',
                  remoteMessage.notification,
                );
                //setInitialRoute(remoteMessage.data.type);
              }
            });
        } else {
          try {
            await messaging().requestPermission();
          } catch (error) {
            SimpleToast.show(
              "FCM Permission Error, you can't receive notifications",
            );
          }
        }
      } else {
        SimpleToast.show(
          "FCM Token not available, you can't receive notifications",
        );
      }
    } catch (e) {
      SimpleToast.show(
        "Error initializing FCM, you can't receive notifications",
      );
    }
  }
};

export const sanitizeMobileNumber = async (
  mobile = '',
  countryCode,
  removeCode = true,
) => {
  let pN;
  if (mobile && mobile.length > 0) {
    pN = mobile;
    if (pN.indexOf(countryCode) > -1 && removeCode) {
      pN = pN.replace(countryCode, '');
    } else if (String(pN[0]) === '0') {
      pN = pN.slice(pN[1], pN.length);
    }
    pN = pN.replace(/ /g, '');
  }
  return pN;
};

export const emailCheck = async (email = '', setEmail, setError) => {
  const wrongEmailFormat = 'Please enter a proper email address';
  const noEmailAddress = 'Please fill in your email address';
  if (email) {
    if (email.match(emailRegex)) {
      if (setEmail && typeof setEmail === 'function') {
        setEmail(email.trim());
        return;
      } else {
        return true;
      }
    } else {
      if (setError && typeof setError === 'function') {
        setError(wrongEmailFormat);
        return;
      } else return wrongEmailFormat;
    }
  } else {
    if (setError && typeof setError === 'function') {
      setError(noEmailAddress);
      return;
    } else return noEmailAddress;
  }
};

export const passwordCheck = async (password = '', setPassword, setError) => {
  const wrongPassFormat =
    'Your password must have a number, and capital letter';
  const noPassword = 'Please fill enter a password';
  const shortpassword = 'Your password is too short';
  if (password) {
    if (password.length < 8) {
      if (setError && typeof setError === 'function') {
        setError(shortpassword);
        return;
      } else return shortpassword;
    } else if (password.length >= 8 && password.match(passwordRegex)) {
      if (setPassword && typeof setPassword === 'function') {
        setPassword(password);
        return;
      } else return true;
    } else {
      if (setError && typeof setError === 'function') {
        setError(wrongPassFormat);
        return;
      } else return wrongPassFormat;
    }
  } else {
    if (setError && typeof setError === 'function') {
      setError(noPassword);
      return;
    } else return noPassword;
  }
};

export const getDistance = (lat1, lon1, lat2, lon2, unit) => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === 'K') {
      dist = dist * 1.609344;
    }
    if (unit === 'N') {
      dist = dist * 0.8684;
    }
    return dist;
  }
};

export const chatDate = timestamp => {
  let result = '';
  if (timestamp)
    result = moment(timestamp)
      .local()
      .format('DD-MM. HH:mm');
  return result;
};

export const sortByTime = (array, ascending = true) => {
  let messages = cloneDeep(array);
  if (ascending)
    messages.sort((a, b) => {
      return parseFloat(a.time) - parseFloat(b.time);
    });
  else
    messages.sort(function (a, b) {
      return parseFloat(b.time) - parseFloat(a.time);
    });
  return messages;
};

export const imageExists = async image_url => {
  let result = false;
  if (image_url) {
    const img = await fetch(image_url);
    return !!img.url;
  }
  return result;
};

export const selectPhoto = async callback => {
  const options = {
    title: 'Select a photo',
    takePhotoButtonTitle: 'Take a photo',
    chooseFromLibraryButtonTitle: 'Choose from gallery',
    quality: 1,
  };
  launchImageLibrary(options, response => {
    if (response.didCancel) {
      SimpleToast.show('You cancelled image selection', SimpleToast.SHORT);
    } else if (response.error) {
      SimpleToast.show('Something went wrong, try again.');
    } else {
      const source = { uri: response.assets[0].uri };
      callback({
        imageURI: source,
        imageDataObject: response,
        error: '',
      });
    }
  });
};

export const getDirections = async ({ startLoc, destinationLoc, onSuccess }) => {
  if (startLoc && destinationLoc) {
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=${Config.mapsApiKey}`,
      );
      const respJson = await resp.json();
      if (respJson && respJson.routes[0]) {
        const points = Polyline.decode(
          respJson.routes[0].overview_polyline.points,
        );
        let coords = await points.map((point, index) => {
          return {
            latitude: point[0],
            longitude: point[1],
          };
        });
        onSuccess(coords);
      }
    } catch (error) {
      SimpleToast.show('Something went wrong, try again later.');
    }
  } else {
    SimpleToast.show(
      'Destination co-ordinates missing, try later',
      SimpleToast.LONG,
    );
  }
};

export const fetchEmployeeMessagesFunc = async (receiverId, dispatch, dbMessagesFetched, callBack) => {
  const res = await fetch(
    FETCH_MESSAGES + '?sender=' + receiverId + '&userType=employee',
  );
  const data = await res.json();
  let messages = {};
  let otherUsers = {};
  // get ids of other users this user has chatted with
  if (!data.message) {
    await data.map(msgObj => {
      const { sender, recipient } = msgObj;
      if (sender !== receiverId) otherUsers[sender] = sender;
      else if (recipient !== receiverId)
        otherUsers[recipient] = recipient;
    });
    // if any user, seperate the different groups of messages
    if (Object.keys(otherUsers).length > 0) {
      await Object.keys(otherUsers).map(async otherUser => {
        const thisUsersMessages = [];
        await data.map(msgObj => {
          const { sender, recipient } = msgObj;
          if (otherUser === sender || otherUser === recipient)
            thisUsersMessages.push(msgObj);
        });
        if (thisUsersMessages.length > 0)
          messages[otherUser] = thisUsersMessages;
      });
    }
    dispatch(dbMessagesFetched(messages));
    callBack && callBack();
  } else {
    dispatch(messagesError(data.message));
    callBack && callBack();
    SimpleToast.show('Something went wrong, please reload app');
  }
}

export const fetchMessagesFunc = async (senderId, dispatch, dbMessagesFetched, callBack) => {
  const res = await fetch(
    FETCH_MESSAGES + '?sender=' + senderId + '&userType=client',
  );
  const data = await res.json();
  let messages = {};
  let otherUsers = {};
  // get ids of other users this user has chatted with
  if (!data.message) {
    await data.map(msgObj => {
      const { sender, recipient } = msgObj;
      if (sender !== senderId) otherUsers[sender] = sender;
      else if (recipient !== senderId)
        otherUsers[recipient] = recipient;
    });
    // if any user, seperate the different groups of messages
    if (Object.keys(otherUsers).length > 0) {
      await Object.keys(otherUsers).map(async otherUser => {
        const thisUsersMessages = [];
        await data.map(msgObj => {
          const { sender, recipient } = msgObj;
          if (otherUser === sender || otherUser === recipient)
            thisUsersMessages.push(msgObj);
        });
        if (thisUsersMessages.length > 0)
          messages[otherUser] = thisUsersMessages;
      });
    }
    dispatch(dbMessagesFetched(messages));
    callBack && callBack();
  } else {
    dispatch(messagesError(e.message));
    callBack && callBack();
    SimpleToast.show('Something went wrong, please reload app');
  }
}

export const fetchUserProfileFunc = async (userId, fcmToken, updateUserDetails, dispatch) => {
  const response = await fetch(USER_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const responseJson = await response.json();
  if (responseJson && responseJson.result) {
    let userData = {
      userId: responseJson.data.id,
      accountType: responseJson.data.acc_type,
      email: responseJson.data.email,
      password: responseJson.data.password,
      username: responseJson.data.username,
      image: responseJson.data.image,
      mobile: responseJson.data.mobile,
      dob: responseJson.data.dob,
      address: responseJson.data.address,
      lat: responseJson.data.lat,
      lang: responseJson.data.lang,
      firebaseId: responseJson.data.id,
      fcmId: responseJson.data.fcm_id,
    };
    const id = responseJson.data.id;
    const usersRef = database().ref(`users/${id}`);
    await usersRef.once('value', snapshot => {
      const value = snapshot.val();
      if (value) status = value.status;
      else {
        usersRef
          .set({ status: responseJson.data.status })
          .then(() => {
            console.log('status set');
          })
          .catch(e => {
            console.log(e.message);
          });
      }
    });
    dispatch(updateUserDetails(userData));
  }
};

export const fetchProviderProfileFunc = async (userId, fcmToken, updateProviderDetails, dispatch) => {
  const response = await fetch(PRO_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const responseJson = await response.json();
  let status;
  if (responseJson && responseJson.result) {
    const id = responseJson.data.id;
    const usersRef = database().ref(`users/${id}`);
    await usersRef.once('value', snapshot => {
      const value = snapshot.val();
      if (value) status = value.status;
      else {
        usersRef
          .set({ status: responseJson.data.status })
          .then(() => {
            console.log('status set');
          })
          .catch(e => {
            console.log(e.message);
          });
      }
    });
    const providerData = {
      providerId: responseJson.data.id,
      name: responseJson.data.username,
      email: responseJson.data.email,
      password: responseJson.data.password,
      imageSource: responseJson.data.image,
      surname: responseJson.data.surname,
      mobile: responseJson.data.mobile,
      services: responseJson.data.services,
      description: responseJson.data.description,
      address: responseJson.data.address,
      lat: responseJson.data.lat,
      lang: responseJson.data.lang,
      invoice: responseJson.data.invoice,
      firebaseId: responseJson.data.id,
      status: status != undefined ? status : responseJson.data.status,
      fcmId: responseJson.data.fcm_id,
      accountType: responseJson.data.account_type,
    };
    dispatch(updateProviderDetails(providerData));
  }
};

export const getPendingJobRequestProviderFunc = async (providerId, navigation, navTo, fetchedJobProviderInfo, dispatch) => {
  const newJobRequestsProviders = [];
  const response = await fetch(PENDING_JOB_PROVIDER + providerId + '/pending', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const responseJson = await response.json();
  if (responseJson.result) {
    responseJson.data.map(async (job, index) => {
      if (job && job.customer_details) {
        var jobData = {
          id: job._id,
          order_id: job.order_id,
          user_id: job.customer_details && job.customer_details._id,
          image: job.customer_details && job.customer_details.image,
          fcm_id: job.customer_details && job.customer_details.fcm_id,
          name: job.customer_details && job.customer_details.username,
          mobile: job.customer_details && job.customer_details.mobile,
          dob: job.customer_details && job.customer_details.dob,
          address: job.customer_details && job.customer_details.address,
          lat: job.customer_details && job.customer_details.lat,
          lang: job.customer_details && job.customer_details.lang,
          service_name: job.service_details.service_name,
          chat_status: job.chat_status,
          status: job.status,
          delivery_address: job.delivery_address,
          delivery_lat: job.delivery_lat,
          delivery_lang: job.delivery_lang,
          customer_details: job.customer_details,
        };
        //check if image is reachable
        if (job.customer_details)
          jobData.imageAvailable = await imageExists(job.customer_details.image);
        newJobRequestsProviders.push(jobData);
      }
    });
    dispatch(fetchedJobProviderInfo(newJobRequestsProviders));
    if (navigation && navTo) navigation.navigate(navTo);
  } else {
    dispatch(fetchedJobProviderInfo(newJobRequestsProviders));
    if (navigation && navTo) navigation.navigate(navTo);
  }
};

export const getAllWorkRequestProFunc = async (providerId, fetchedDataWorkSource, fetchedAllJobRequestsPro, dispatch) => {
  const response = await fetch(BOOKING_HISTORY + providerId + '/Cancelled');
  const responseJson = await response.json();
  let newAllProvidersDetails = responseJson.data
    ? cloneDeep(responseJson.data)
    : [];
  const dataWorkSource = [];
  if (responseJson.result) {
    for (let i = 0; i < responseJson.data.length; i++) {
      newAllProvidersDetails[i].imageAvailable = await imageExists(responseJson.data[i].user_details.image);
      if (responseJson.data[i].chat_status === '1') {
        dataWorkSource.push(responseJson.data[i]);
      } else if (responseJson.data[i].chat_status === '0') {
        if (responseJson.data[i].status !== 'Pending') {
          dataWorkSource.push(responseJson.data[i]);
        }
      }
      dispatch(fetchedDataWorkSource(dataWorkSource));
      dispatch(fetchedAllJobRequestsPro(newAllProvidersDetails));
    }
  }
};

export const getAllWorkRequestClientFunc = async (clientId, fetchedDataWorkSource, fetchedAllJobRequestsClient, dispatch) => {
  const response = await fetch(CUSTOMER_BOOKING_HISTORY + clientId + '/null');
  const responseJson = await response.json();
  let newAllClientDetails = responseJson.data
    ? cloneDeep(responseJson.data)
    : [];
  const dataWorkSource = [];
  if (responseJson.result) {
    for (let i = 0; i < responseJson.data.length; i++) {
      if (responseJson.data[i]) {
        if (responseJson.data[i].employee_details)
          newAllClientDetails[i].imageAvailable = await imageExists(responseJson.data[i].employee_details.image);
        if (responseJson.data[i].chat_status == '1') {
          dataWorkSource.push(responseJson.data[i]);
        } else if (responseJson.data[i].chat_status == '0') {
          if (responseJson.data[i].status != 'Pending') {
            dataWorkSource.push(responseJson.data[i]);
          }
        }
      }
      dispatch(fetchedDataWorkSource(dataWorkSource));
      dispatch(fetchedAllJobRequestsClient(newAllClientDetails));
    }
  }
};

export const getPendingJobRequestFunc = async (userId, navigation, navTo, fetchedJobCustomerInfo, dispatch) => {
  const response = await fetch(PENDING_JOB_CUSTOMER + userId + '/pending', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const responseJson = await response.json();
  const newJobRequest = [];
  if (responseJson.result) {
    //const id = responseJson.data.id;
    responseJson.data.map(async (job, index) => {
      if (job && job.employee_details) {
        let jobData = {
          id: job._id,
          order_id: job.order_id,
          employee_id: job.employee_details && job.employee_details._id,
          image: job.employee_details && job.employee_details.image,
          fcm_id: job.employee_details && job.employee_details.fcm_id,
          name: job.employee_details && job.employee_details.username,
          surName: job.employee_details && job.employee_details.surname,
          status: job.status,
          chat_status: job.chat_status,
          mobile: job.employee_details && job.employee_details.mobile,
          description:
            job.employee_details && job.employee_details.description,
          address: job.employee_details && job.employee_details.address,
          lat: job.employee_details && job.employee_details.lat,
          lang: job.employee_details && job.employee_details.lang,
          service_name: job.service_details.service_name,
          employee_details: job.employee_details,
        };
        //check if image is reachable
        if (job.employee_details)
          jobData.imageAvailable = await imageExists(job.employee_details.image);
        newJobRequest.push(jobData);
      }
    });
    dispatch(fetchedJobCustomerInfo(newJobRequest));
    /** navigate away */
    if (navigation && navTo) navigation.navigate(navTo);
  } else {
    /** navigate away */
    dispatch(fetchedJobCustomerInfo(newJobRequest));
    if (navigation && navTo) navigation.navigate(navTo);
  }
};
