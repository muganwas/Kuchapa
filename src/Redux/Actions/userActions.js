import { fetchUserProfileFunc, fetchProviderProfileFunc } from '../../misc/helpers';
import {
  UPDATE_PROVIDER_DETAILS,
  UPDATE_USER_DETAILS,
  UPDATE_NEW_USER_INFO,
  RESET_USER_DETAILS,
  UPDATE_USER_AUTH_TOKEN,
  UPDATE_PROVIDER_AUTH_TOKEN,
  FETCHING_USER_PROFILE,
  FETCHING_PROVIDER_PROFILE
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

export const fetchingUserDetails = () => {
  return {
    type: FETCHING_USER_PROFILE
  }
}

export const fetchingProviderDetails = () => {
  return {
    type: FETCHING_PROVIDER_PROFILE
  }
}

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

export const fetchProviderProfile = (userId, fcmToken, callBack) => {
  return async dispatch => {
    try {
      dispatch(fetchingProviderDetails());
      fetchProviderProfileFunc(userId, fcmToken, updateProviderDetails, dispatch, callBack);
    } catch (e) {
      dispatch(messagesError(e.message));
    }
  };
};

export const fetchUserProfile = (userId, fcmToken, callBack) => {
  return dispatch => {
    try {
      dispatch(fetchingUserDetails());
      fetchUserProfileFunc(userId, fcmToken, updateUserDetails, dispatch, callBack);
    } catch (e) {
      dispatch(messagesError(e.message));
    }
  };
};
