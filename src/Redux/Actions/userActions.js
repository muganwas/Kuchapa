import { fetchUserProfileFunc, fetchProviderProfileFunc } from '../../misc/helpers';
import {
  UPDATE_PROVIDER_DETAILS,
  UPDATE_USER_DETAILS,
  UPDATE_NEW_USER_INFO,
  RESET_USER_DETAILS,
  UPDATE_USER_AUTH_TOKEN,
  UPDATE_PROVIDER_AUTH_TOKEN,
} from '../types';
import { messagesError } from './messageActions';

export const updateProviderDetails = payload => {
  return {
    type: UPDATE_PROVIDER_DETAILS,
    payload,
  };
};

export const updateNewUserInfo = payload => {
  return {
    type: UPDATE_NEW_USER_INFO,
    payload,
  };
};

export const updateUserDetails = payload => {
  return {
    type: UPDATE_USER_DETAILS,
    payload,
  };
};

export const resetUserDetails = () => {
  return {
    type: RESET_USER_DETAILS,
  };
};

export const updateUserAuthToken = payload => {
  return {
    type: UPDATE_USER_AUTH_TOKEN,
    payload,
  };
};

export const updateProviderAuthToken = payload => {
  return {
    type: UPDATE_PROVIDER_AUTH_TOKEN,
    payload,
  };
};

export const fetchProviderProfile = (userId, fcmToken) => {
  return async dispatch => {
    try {
      fetchProviderProfileFunc(userId, fcmToken, updateProviderDetails, dispatch);
    } catch (e) {
      console.log('pro profile fetch error', e);
      dispatch(messagesError(e.message));
    }
  };
};

export const fetchUserProfile = (userId, fcmToken) => {
  return dispatch => {
    try {
      fetchUserProfileFunc(userId, fcmToken, updateNewUserInfo, dispatch);
    } catch (e) {
      console.log('user profile fetch error --', e);
      dispatch(messagesError(e.message));
    }
  };
};
