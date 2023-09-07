import { fetchMessagesFunc, fetchEmployeeMessagesFunc } from '../../misc/helpers';
import {
  FETCHING_MESSAGES,
  FETCHED_MESSAGES,
  FETCHING_MESSAGES_ERROR,
  FETCHED_DB_MESSAGES,
  UPDATE_LATEST_CHATS,
  SET_LATEST_CHATS_ERROR,
} from '../types';

export const startFetchingMessages = payload => {
  return {
    type: FETCHING_MESSAGES,
    payload,
  };
};

export const messagesFetched = payload => {
  return {
    type: FETCHED_MESSAGES,
    payload,
  };
};

export const dbMessagesFetched = payload => {
  return {
    type: FETCHED_DB_MESSAGES,
    payload,
  };
};

export const messagesError = payload => {
  return {
    type: FETCHING_MESSAGES_ERROR,
    payload,
  };
};

export const updateLatestChats = payload => {
  return {
    type: UPDATE_LATEST_CHATS,
    payload,
  };
};

export const setLatestChatsError = () => {
  return {
    type: SET_LATEST_CHATS_ERROR,
  };
};

export const fetchEmployeeMessages = ({ receiverId, callBack }) => {
  return async dispatch => {
    try {
      fetchEmployeeMessagesFunc(receiverId, dispatch, dbMessagesFetched, callBack);
    } catch (e) {
      dispatch(messagesError(e.message));
      callBack && callBack();
    }
  };
};

export const fetchClientMessages = ({ senderId, callBack }) => {
  return dispatch => {
    try {
      fetchMessagesFunc(senderId, dispatch, dbMessagesFetched, callBack);
    } catch (e) {
      dispatch(messagesError(e.message));
      callBack && callBack();
    }
  };
};
