import { cloneDeep } from 'lodash';
import firebaseAuth from '@react-native-firebase/auth';
import SimpleToast from 'react-native-simple-toast';
import Config from '../components/Config';

const BOOKING_REQUEST = Config.baseURL + 'jobrequest/addjobrequest';

export const getAllBookings = async ({
  userId,
  only = '',
  limit,
  userType, /** TODO: Refactor userType */
  toggleIsLoading,
  bookingHistoryURL,
  onSuccess,
}) => {
  toggleIsLoading(true);
  try {
    let bookingCompleteData = [];
    let bookingRejectData = [];
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const response = await fetch(bookingHistoryURL + userId + '/bookings?only=' + only + '&limit=' + limit, {
      headers: {
        Authorization: 'Bearer ' + idToken
      }
    });
    const responseJson = await response.json();
    if (responseJson.result && responseJson.data) {
      let newData = cloneDeep(responseJson.data);
      for (let i = 0; i < newData.length; i++) {
        if (newData[i].chat_status === '1') {
          if (newData[i].status === 'Completed') {
            bookingCompleteData.push(newData[i]);
          } else if (newData[i].status === 'Rejected') {
            bookingRejectData.push(newData[i]);
          }
        } else {
          if (newData[i].status === 'Rejected') {
            bookingRejectData.push(newData[i]);
          }
        }
      }
      onSuccess(bookingCompleteData, bookingRejectData);
    } else {
      toggleIsLoading(false);
    }
  } catch (e) {
    toggleIsLoading(false);
    SimpleToast.show('Something went wrong, please try again');
  }
};

export const reviewTask = async ({
  rating,
  review,
  main_id,
  fcm_id,
  senderName,
  senderId,
  userType,
  notification_by,
  notificationType,
  reviewURL,
  onSuccess,
  toggleIsLoading,
}) => {
  toggleIsLoading(true);
  const reviewData = {
    main_id,
    type: userType,
    rating: rating,
    review: review,
    notification: {
      fcm_id,
      type: notificationType,
      notification_by,
      title: 'Given Review',
      save_notification: true,
      senderName,
      senderId,
      body: senderName + ' has given you a review',
    },
  };
  try {
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const resp = await fetch(reviewURL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + idToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });
    const response = resp.json();
    if (response.result) {
      onSuccess();
      SimpleToast.show('Review Submitted');
    } else {
      toggleIsLoading();
      SimpleToast.show('Something went wrong, please try again.');
    }
  } catch (e) {
    toggleIsLoading();
    SimpleToast.show('Something went wrong, please try again.');
  }
};

export const requestForBooking = async ({
  fcm_id,
  providerId,
  serviceId,
  serviceName,
  userDetails,
  online,
  navigation,
  onRequestSending,
  onSuccess,
  onError,
  goBack,
}) => {
  if (!userDetails.lang || !userDetails.lat) {
    onError(true, 'Please provide your address first');
    setTimeout(
      () =>
        navigation.navigate('SelectAddress', {
          onGoBack: goBack,
        }),
      400,
    );
  } else if (!userDetails.mobile) {
    onError(true, 'Please update mobile first');
  } else {
    onRequestSending();
    const data = {
      user_id: userDetails.userId,
      employee_id: providerId,
      service_id: serviceId,
      delivery_address: userDetails.address,
      delivery_lat: userDetails.lat,
      delivery_lang: userDetails.lang,
      notification: {
        fcm_id,
        title: 'Booking Request',
        body: 'You have a booking request from ' + userDetails.username,
        save_notification: true,
        user_id: userDetails.userId,
        employee_id: providerId,
        notification_by: 'Customer',
        data: {
          userId: userDetails.userId,
          serviceName: serviceName,
          delivery_address: userDetails.address,
          delivery_lat: userDetails.lat,
          delivery_lang: userDetails.lang,
        },
      },
    };
    if (!online) {
      onError(
        true,
        'Service provider is Offline and might take a while to respond',
      );
    }
    try {
      const idToken = await firebaseAuth().currentUser.getIdToken();
      const response = await fetch(BOOKING_REQUEST, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + idToken,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const responseJson = await response.json();
      if (responseJson.result) {
        onSuccess('Waiting for acceptance...');
      } else {
        if (responseJson.message === 'Already Exist') {
          onError(
            false,
            'You already have a running job with this provider',
          );
        } else if (responseJson.message === 'Service provider busy') {
          onError(
            false,
            'Service provider is currently busy. please try another service provider',
          );
        } else if (responseJson.message === 'Service provider is offline') {
          onError(
            false,
            'Service provider is offline. Book another service provider',
          );
        } else {
          onError(true, 'Something went wrong');
        }
      }
    } catch (e) {
      onError(true, 'Something went wrong, try again later');
    }
  }
};
