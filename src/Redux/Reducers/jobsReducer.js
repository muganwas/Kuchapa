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

const initialState = {
  selectedJobRequest: null,
  jobRequests: [],
  jobRequestsMeta: { page: 1, limit: 10 },
  dataWorkSourceMeta: { page: 1, limit: 10 },
  allJobRequestsClientMeta: { page: 1, limit: 10 },
  allJobRequestsProvidersMeta: { page: 1, limit: 10 },
  jobRequestsProvidersMeta: { page: 1, limit: 10 },
  bookingCompleteMeta: { page: 1, limit: 20 },
  bookingRejectMeta: { page: 1, limit: 20 },
  dataWorkSource: [],
  jobRequestsProviders: [],
  allJobRequestsProviders: [],
  allJobRequestsClient: [],
  bookingCompleteData: [],
  bookingRejectData: [],
  requestsProvidersFetched: false,
  allJobRequestsProvidersFetched: false,
  allJobRequestsClientFetched: false,
  fetchingRequestsProviders: false,
  dataWorkSourceFetched: false,
  requestsProvidersError: null,
  requestsFetched: false,
  fetchingRequests: false,
  activeRequest: false,
  requestsError: null,
};

const jobsReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCHING_JOB_REQUESTS:
      return {
        ...state,
        feching: true,
        requestsFetched: false,
        requestsError: null,
      };
    case FETCHED_JOB_REQUESTS:
      return {
        ...state,
        jobRequests: action.payload.data,
        jobRequestsMeta: action.payload.metaData,
        requestsFetched: true,
        fetchingRequests: false,
        requestsError: null,
      };
    case FETCHING_JOB_REQUESTS_ERROR:
      return {
        ...state,
        requestsError: action.payload,
        requestsFetched: false,
        fetchingRequests: false,
      };
    case FETCHING_JOB_REQUESTS_PROVIDERS:
      return {
        ...state,
        fetchingRequestsProviders: true,
        requestsProvidersFetched: false,
        requestsProvidersError: null,
      };
    case FETCHED_JOB_REQUESTS_PROVIDERS:
      return {
        ...state,
        jobRequestsProviders: action.payload.data,
        jobRequestsProvidersMeta: action.payload.metaData,
        requestsProvidersFetched: true,
        fetchingRequestsProviders: false,
        requestsProvidersError: null,
      };
    case FETCHING_JOB_REQUESTS_PROVIDERS_ERROR:
      return {
        ...state,
        requestsProvidersError: action.payload,
        requestsProvidersFetched: false,
        fetchingRequestsProviders: false,
      };
    case SET_SELECTED_JOB_REQUEST:
      return {
        ...state,
        selectedJobRequest: action.payload,
      };
    case FETCHED_ALL_JOB_REQUESTS_PRO:
      return {
        ...state,
        allJobRequestsProviders: action.payload.data,
        allJobRequestsProvidersMeta: action.payload.metaData,
        allJobRequestsProvidersFetched: true,
      };
    case UPDATE_BOOKING_COMPLETE_DATA:
      return {
        ...state,
        bookingCompleteData: action.payload.data,
        bookingCompleteMeta: action.payload.metaData
      };
    case UPDATE_REJECTED_BOOKINGS_DATA:
      return {
        ...state,
        bookingRejectData: action.payload.data,
        bookingRejectMeta: action.payload.metaData
      };
    case FETCH_ALL_JOB_REQUESTS_PRO_ERROR:
      return {
        ...state,
        allJobRequestsProvidersFetched: false,
      };
    case FETCHED_ALL_JOB_REQUESTS_CLIENT:
      return {
        ...state,
        allJobRequestsClient: action.payload.data,
        allJobRequestsClientMeta: action.payload.metaData,
        allJobRequestsClientFetched: true,
      };
    case FETCH_ALL_JOB_REQUESTS_CLIENT_ERROR:
      return {
        ...state,
        allJobRequestsClientFetched: false,
      };
    case FETCHED_DATA_WORK_SOURCE:
      return {
        ...state,
        dataWorkSource: action.payload.data,
        dataWorkSourceMeta: action.payload.metaData,
        dataWorkSourceFetched: true,
      };
    case FETCH_DATA_WORK_SOURCE_ERROR:
      return {
        ...state,
        dataWorkSourceFetched: false,
      };
    case UPDATE_ACTIVE_REQUREST:
      return {
        ...state,
        activeRequest: action.payload,
      };
    default:
      return {
        ...state,
      };
  }
};

export default jobsReducer;
