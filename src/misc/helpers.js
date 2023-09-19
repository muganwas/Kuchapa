import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Polyline from '@mapbox/polyline';
import firebaseAuth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { exitApp } from 'react-native-exit-app';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { launchImageLibrary } from 'react-native-image-picker';
import { cloneDeep } from 'lodash';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';
import { synchroniseOnlineStatus } from '../controllers/users';
import Config from '../components/Config';

const phoneUtil = PhoneNumberUtil.getInstance();
const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
const passwordRegex = /[^\w\d]*(([0-9]+.*[A-Z]+.*)|[A-Z]+.*([0-9]+.*))/;

const FETCH_MESSAGES = Config.baseURL + 'chat/fetchAllChats';
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
    SimpleToast.show('There was an error setting location permissions.');
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
  const response = await launchImageLibrary(options);
  if (response.didCancel) {
    return SimpleToast.show('You cancelled image selection', SimpleToast.SHORT);
  } else if (response.error) {
    return SimpleToast.show('Something went wrong, try again.');
  } else {
    const source = { uri: response.assets[0].uri };
    if (callback)
      return callback({
        imageURI: source,
        imageDataObject: response.assets[0],
        error: '',
      });
    return {
      imageURI: source,
      imageDataObject: response.assets[0]
    }
  };
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
  const idToken = await firebaseAuth().currentUser.getIdToken();
  const res = await fetch(
    FETCH_MESSAGES + '?sender=' + receiverId + '&userType=employee', {
    headers: {
      Authorization: 'Bearer ' + idToken
    }
  }
  );
  const resJson = await res.json();
  const { result, data, message } = resJson;
  let messages = {};
  let otherUsers = {};
  // get ids of other users this user has chatted with
  if (result) {
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
    dispatch(messagesError(message));
    SimpleToast.show(message);
    callBack && callBack();
  }
}

export const fetchMessagesFunc = async (senderId, dispatch, dbMessagesFetched, callBack) => {
  const idToken = await firebaseAuth().currentUser.getIdToken();
  const res = await fetch(
    FETCH_MESSAGES + '?sender=' + senderId + '&userType=client', {
    headers: {
      Authorization: 'Bearer ' + idToken
    }
  }
  );
  const resJosn = await res.json();
  const { data, result, message } = resJosn;
  let messages = {};
  let otherUsers = {};
  // get ids of other users this user has chatted with
  if (result) {
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
    dispatch(messagesError(message));
    SimpleToast.show(message);
    callBack && callBack();
  }
}

export const fetchUserProfileFunc = async (userId, fcmToken, updateUserDetails, dispatch, callBack) => {
  const idToken = await firebaseAuth().currentUser.getIdToken();
  const response = await fetch(USER_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + idToken,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const responseJson = await response.json();
  if (responseJson && responseJson.result) {
    const id = responseJson.data.id;
    const online = await synchroniseOnlineStatus(
      id,
      responseJson.data.online,
    );
    let userData = {
      userId: responseJson.data.id,
      accountType: responseJson.data.acc_type,
      email: responseJson.data.email,
      password: responseJson.data.password,
      username: responseJson.data.username,
      image: responseJson.data.image,
      mobile: responseJson.data.mobile,
      country_code: responseJson.data.country_code,
      country_alpha: responseJson.data.country_alpha,
      online,
      imageAvailable: responseJson.data.image_available,
      dob: responseJson.data.dob,
      address: responseJson.data.address,
      lat: responseJson.data.lat,
      lang: responseJson.data.lang,
      firebaseId: responseJson.data.id,
      fcmId: responseJson.data.fcm_id,
    };
    dispatch(updateUserDetails(userData));
    return callBack();
  }
  return SimpleToast.show(responseJson.message || 'Could not fetch profile information');
};

export const fetchProviderProfileFunc = async (userId, fcmToken, updateProviderDetails, dispatch, callBack) => {
  const idToken = await firebaseAuth().currentUser.getIdToken();
  const response = await fetch(PRO_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + idToken,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const responseJson = await response.json();
  if (responseJson && responseJson.result) {
    const id = responseJson.data.id;
    const online = await synchroniseOnlineStatus(
      id,
      responseJson.data.online,
    );
    const providerData = {
      providerId: responseJson.data.id,
      name: responseJson.data.username,
      email: responseJson.data.email,
      password: responseJson.data.password,
      image: responseJson.data.image,
      surname: responseJson.data.surname,
      mobile: responseJson.data.mobile,
      country_code: responseJson.data.country_code,
      country_alpha: responseJson.data.country_alpha,
      services: responseJson.data.services,
      description: responseJson.data.description,
      online,
      imageAvailable: responseJson.data.image_available,
      address: responseJson.data.address,
      lat: responseJson.data.lat,
      lang: responseJson.data.lang,
      invoice: responseJson.data.invoice,
      firebaseId: responseJson.data.id,
      status: responseJson.data.status,
      fcmId: responseJson.data.fcm_id,
      accountType: responseJson.data.account_type,
    };
    dispatch(updateProviderDetails(providerData));
    return callBack();
  }
  return SimpleToast.show(responseJson.message || 'Could not fetch profile information');
};

export const getPendingJobRequestProviderFunc = async (providerId, navigation, navTo, fetchedJobProviderInfo, dispatch) => {
  const newJobRequestsProviders = [];
  const idToken = await firebaseAuth().currentUser.getIdToken();
  const response = await fetch(PENDING_JOB_PROVIDER + providerId + '/pending', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + idToken,
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
          imageAvailable: job.customer_details && job.customer_details.image_available,
          service_name: job.service_details.service_name,
          chat_status: job.chat_status,
          status: job.status,
          delivery_address: job.delivery_address,
          delivery_lat: job.delivery_lat,
          delivery_lang: job.delivery_lang,
          customer_details: job.customer_details,
        };
        newJobRequestsProviders.push(jobData);
      }
    });
    dispatch(fetchedJobProviderInfo(newJobRequestsProviders));
    if (navigation && navTo) navigation.navigate(navTo);
  } else {
    SimpleToast.show('Could not fetch pending jobs');
    if (navigation && navTo) navigation.navigate(navTo);
  }
};

export const getAllWorkRequestProFunc = async (providerId, fetchedDataWorkSource, fetchedAllJobRequestsPro, dispatch, only = '') => {
  const idToken = await firebaseAuth().currentUser.getIdToken();
  const response = await fetch(BOOKING_HISTORY + providerId + '/Cancelled?only=' + only, {
    headers: {
      Authorization: 'Bearer ' + idToken
    }
  });
  const responseJson = await response.json();
  let newAllProvidersDetails = responseJson.data
    ? cloneDeep(responseJson.data)
    : [];
  const dataWorkSource = [];
  if (responseJson.result) {
    await responseJson.data.map((dt, i) => {
      if (dt?.status !== 'Pending') {
        dataWorkSource.push(dt);
      }
    });
  }
  dispatch(fetchedDataWorkSource(dataWorkSource));
  dispatch(fetchedAllJobRequestsPro(newAllProvidersDetails));
};

export const getAllWorkRequestClientFunc = async (clientId, fetchedDataWorkSource, fetchedAllJobRequestsClient, dispatch) => {
  const idToken = await firebaseAuth().currentUser.getIdToken();
  const response = await fetch(CUSTOMER_BOOKING_HISTORY + clientId + '/null', {
    headers: {
      Authorization: 'Bearer ' + idToken
    }
  });
  const responseJson = await response.json();
  let newAllClientDetails = responseJson.data
    ? cloneDeep(responseJson.data)
    : [];
  const dataWorkSource = [];
  if (responseJson.result) {
    await responseJson.data.map((dt, i) => {
      if (dt?.status !== 'Pending') {
        dataWorkSource.push(dt);
      };
    })
  }
  dispatch(fetchedDataWorkSource(dataWorkSource));
  dispatch(fetchedAllJobRequestsClient(newAllClientDetails));
};

export const getPendingJobRequestFunc = async (userId, navigation, navTo, fetchedJobCustomerInfo, dispatch) => {
  const idToken = await firebaseAuth().currentUser.getIdToken();
  const response = await fetch(PENDING_JOB_CUSTOMER + userId + '/pending', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + idToken,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const responseJson = await response.json();
  const newJobRequest = [];
  if (responseJson.result) {
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
          imageAvailable: job.employee_details && job.employee_details.image_available,
          service_name: job.service_details.service_name,
          employee_details: job.employee_details,
        };
        newJobRequest.push(jobData);
      }
    });
    dispatch(fetchedJobCustomerInfo(newJobRequest));
    /** navigate away */
    if (navigation && navTo) navigation.navigate(navTo);
  } else {
    SimpleToast.show('Could not fetch pending jobs');
    if (navigation && navTo) navigation.navigate(navTo);
  }
};
