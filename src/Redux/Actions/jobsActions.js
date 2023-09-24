import { getPendingJobRequestProviderFunc, getAllWorkRequestProFunc, getAllWorkRequestClientFunc, getPendingJobRequestFunc } from '../../misc/helpers';
import {
  FETCHING_JOB_REQUESTS,
  FETCHED_JOB_REQUESTS,
  FETCHING_JOB_REQUESTS_ERROR,
  FETCHING_JOB_REQUESTS_PROVIDERS,
  FETCHED_JOB_REQUESTS_PROVIDERS,
  FETCHING_JOB_REQUESTS_PROVIDERS_ERROR,
  SET_SELECTED_JOB_REQUEST,
  FETCHED_ALL_JOB_REQUESTS_PRO,
  FETCH_ALL_JOB_REQUESTS_PRO_ERROR,
  FETCHED_ALL_JOB_REQUESTS_CLIENT,
  FETCH_ALL_JOB_REQUESTS_CLIENT_ERROR,
  FETCHED_DATA_WORK_SOURCE,
  FETCH_DATA_WORK_SOURCE_ERROR,
  UPDATE_ACTIVE_REQUREST,
  UPDATE_BOOKING_COMPLETE_DATA,
  UPDATE_REJECTED_BOOKINGS_DATA,
} from '../types';

export const startFetchingJobCustomer = () => {
  return {
    type: FETCHING_JOB_REQUESTS,
  };
};

export const fetchedJobCustomerInfo = payload => {
  return {
    type: FETCHED_JOB_REQUESTS,
    payload,
  };
};

export const fetchCustomerJobInfoError = payload => {
  return {
    type: FETCHING_JOB_REQUESTS_ERROR,
    payload,
  };
};

export const updateCompletedBookingData = payload => {
  return {
    type: UPDATE_BOOKING_COMPLETE_DATA,
    payload,
  };
};

export const updateFailedBookingData = payload => {
  return {
    type: UPDATE_REJECTED_BOOKINGS_DATA,
    payload,
  };
};

export const startFetchingJobProvider = () => {
  return {
    type: FETCHING_JOB_REQUESTS_PROVIDERS,
  };
};

export const fetchedJobProviderInfo = payload => {
  return {
    type: FETCHED_JOB_REQUESTS_PROVIDERS,
    payload,
  };
};

export const fetchProviderJobInfoError = payload => {
  return {
    type: FETCHING_JOB_REQUESTS_PROVIDERS_ERROR,
    payload,
  };
};

export const setSelectedJobRequest = payload => {
  return {
    type: SET_SELECTED_JOB_REQUEST,
    payload,
  };
};

export const fetchedAllJobRequestsPro = payload => {
  return {
    type: FETCHED_ALL_JOB_REQUESTS_PRO,
    payload,
  };
};

export const fetchAllJobRequestsProError = () => {
  return {
    type: FETCH_ALL_JOB_REQUESTS_PRO_ERROR,
  };
};

export const fetchedAllJobRequestsClient = payload => {
  return {
    type: FETCHED_ALL_JOB_REQUESTS_CLIENT,
    payload,
  };
};

export const fetchAllJobRequestsClientError = () => {
  return {
    type: FETCH_ALL_JOB_REQUESTS_CLIENT_ERROR,
  };
};

export const fetchedDataWorkSource = payload => {
  return {
    type: FETCHED_DATA_WORK_SOURCE,
    payload,
  };
};

export const updateActiveRequest = payload => {
  return {
    type: UPDATE_ACTIVE_REQUREST,
    payload,
  };
};

export const fetchDataWorkSourceError = () => {
  return {
    type: FETCH_DATA_WORK_SOURCE_ERROR,
  };
};

export const getPendingJobRequest = (props, userId, navTo) => {
  return async dispatch => {
    const { navigation } = props;
    dispatch(startFetchingJobCustomer());
    try {
      getPendingJobRequestFunc(userId, navigation, navTo, fetchedJobCustomerInfo, dispatch);
    } catch (e) {
      dispatch(fetchCustomerJobInfoError(e.message));
    }
  };
};

export const getAllWorkRequestClient = (clientId, only) => {
  return dispatch => {
    try {
      getAllWorkRequestClientFunc(clientId, fetchedDataWorkSource, fetchedAllJobRequestsClient, dispatch, only);
    } catch (e) {
      dispatch(fetchAllJobRequestsClientError());
    }
  };
};

export const getAllWorkRequestPro = (providerId, only) => {
  return dispatch => {
    try {
      getAllWorkRequestProFunc(providerId, fetchedDataWorkSource, fetchedAllJobRequestsPro, dispatch, only);
    } catch (e) {
      dispatch(fetchDataWorkSourceError());
      dispatch(fetchAllJobRequestsProError());
    }
  };
};

export const getPendingJobRequestProvider = (props, providerId, navTo) => {
  return dispatch => {
    const { navigation } = props;
    dispatch(startFetchingJobProvider());
    try {
      getPendingJobRequestProviderFunc(providerId, navigation, navTo, fetchedJobProviderInfo, dispatch);
    } catch (e) {
      dispatch(fetchProviderJobInfoError(e.message));
    }
  };
};
