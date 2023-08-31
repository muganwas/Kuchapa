import SimpleToast from 'react-native-simple-toast';
import { cloneDeep } from 'lodash';
import firebaseAuth from '@react-native-firebase/auth';
import { imageExists } from '../misc/helpers';


export const getAllNotifications = async ({
  userId,
  userType,
  toggleIsLoading,
  onSuccess,
  onError,
  notificationsURL,
}) => {
  toggleIsLoading(true);
  try {
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const response = await fetch(notificationsURL + userId, {
      headers: {
        Authorization: 'Bearer ' + idToken
      }
    });
    const responseJson = await response.json();
    if (responseJson.result) {
      let dataSource = cloneDeep(responseJson.data);
      if (userType === 'Provider') {
        dataSource?.map(async (item, i) => {
          dataSource[i].customer_details.imageAvailable = await imageExists(item.customer_details.image);
        });
      } else {
        dataSource?.map(async (item, i) => {
          dataSource[i].employee_details.imageAvailable = await imageExists(item.employee_details.image);
        });
      }
      onSuccess(dataSource);
    } else {
      onError();
    }
  } catch (e) {
    onError();
    SimpleToast.show('An error has occurred, try again.');
  }
};

export const deleteNotification = async ({
  userId,
  deleteNotificationURL,
  dataSource,
  onSuccess,
}) => {
  let altDataSource = cloneDeep(dataSource);
  try {
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const response = await fetch(deleteNotificationURL + userId, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + idToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const responseJson = await response.json();
    if (responseJson) {
      const {
        data: { _id },
      } = responseJson;
      dataSource.map((notification, index) => {
        if (_id === notification._id) altDataSource.splice(index, 1);
      });
      onSuccess(altDataSource);
    }
  } catch (e) {
    SimpleToast.show(
      "Notification couldn't be deleted, try again later",
      SimpleToast.SHORT,
    );
  }
};

export const readNotification = async ({
  userId,
  dataSource,
  onSuccess,
  readNotificationURL,
}) => {
  let altDataSource = cloneDeep(dataSource);
  try {
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const response = await fetch(readNotificationURL + userId, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + idToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const responseJson = await response.json();
    if (responseJson) {
      const {
        data: { _id, status },
      } = responseJson;
      dataSource.map((notification, index) => {
        if (_id === notification._id) altDataSource[index].status = status;
      });
      onSuccess(altDataSource);
    }
  } catch (e) {
    console.log('read notification err', e);
    SimpleToast.show(
      "Notification couldn't be read, try again.",
      SimpleToast.SHORT,
    );
  }
};
