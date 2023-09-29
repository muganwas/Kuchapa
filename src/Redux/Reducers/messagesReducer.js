import {
  FETCHED_MESSAGES,
  FETCHED_DB_MESSAGES,
  FETCHING_MESSAGES,
  FETCHING_MESSAGES_ERROR,
  UPDATE_LATEST_CHATS,
  SET_LATEST_CHATS_ERROR,
} from '../types';

const initialState = {
  dataChatSource: {},
  latestChats: [],
  latestChatsMeta: { page: 1, limit: 10 },
  dataChatSourceMeta: { page: 1, limit: 10 },
  messages: {},
  messagesMeta: { page: 1, limit: 10 },
  fetchedLatestChats: false,
  latestChatsError: false,
  fetched: false,
  fetchedDBMessages: false,
  fetching: false,
  error: null,
};

const messagesReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCHING_MESSAGES:
      return {
        ...state,
        feching: true,
        fetched: false,
        error: null,
      };
    case FETCHED_MESSAGES:
      return {
        ...state,
        dataChatSource: action.payload,
        fetched: true,
        fetching: false,
        error: null,
      };
    case FETCHED_DB_MESSAGES:
      return {
        ...state,
        messages: action.payload.data,
        messagesMeta: action.payload.metaData,
        error: null,
        fetchedDBMessages: true,
        fetching: false,
      };
    case FETCHING_MESSAGES_ERROR:
      return {
        ...state,
        error: action.payload,
        fetched: false,
        fetching: false,
      };
    case UPDATE_LATEST_CHATS:
      return {
        ...state,
        latestChats: action.payload.data,
        latestChatsMeta: action.payload.metaData || state.latestChatsMeta,
        fetchedLatestChats: true,
        latestChatsError: false,
      };
    case SET_LATEST_CHATS_ERROR:
      return {
        fetchedLatestChats: false,
        latestChatsError: true,
      };
    default:
      return {
        ...state,
      };
  }
};

export default messagesReducer;
