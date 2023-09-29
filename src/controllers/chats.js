import { cloneDeep } from 'lodash';
import moment from 'moment';
import SimpleToast from 'react-native-simple-toast';
import database from '@react-native-firebase/database';
import firebaseAuth from '@react-native-firebase/auth';
import FilePickerManager from 'react-native-file-picker';
import Config from '../components/Config';
import { uploadAttachment } from './storage';
import { synchroniseOnlineStatus } from './users';

const REJECT_ACCEPT_REQUEST = Config.baseURL + 'jobrequest/updatejobrequest';
const FETCH_RECENT_MESSAGES = Config.baseURL + 'chat/fetchRecentChats';
const socket = Config.socket;
const PRO_INFO_UPDATE = Config.baseURL + 'employee/';

export const acceptChatRequest = async (
  {
    pos,
    fetchedPendingJobInfo,
    providerDetails,
    jobRequests,
    setSelectedJobRequest,
    toggleLoading,
    onError,
    navigate,
  },
  redirect = true,
) => {
  try {
    let newjobRequests = cloneDeep(jobRequests);
    const {
      id,
      user_id,
      fcm_id,
      name,
      service_name,
      order_id,
      image,
      mobile,
      dob,
      address,
      lat,
      lang,
      status,
      delivery_address,
      delivery_lat,
      delivery_lang,
      imageAvailable
    } = jobRequests[pos];

    setSelectedJobRequest(jobRequests[pos]);
    toggleLoading();
    const data = {
      main_id: id,
      chat_status: '1',
      status: 'Pending',
      notification: {
        fcm_id,
        title: 'Chat Request Accepted',
        type: 'ChatAcceptance',
        notification_by: 'Employee',
        save_notification: true,
        user_id,
        employee_id: providerDetails.providerId,
        order_id,
        body:
          'Chat request has been accepted by ' +
          providerDetails.name +
          ' Request Id : ' +
          order_id,
        data: {
          user_id,
          providerId: providerDetails.providerId,
          ProviderData: JSON.stringify(providerDetails),
          serviceName: service_name,
          orderId: order_id,
          mainId: id,
          chat_status: '1',
          status: 'Pending',
        },
      },
    };
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const response = await fetch(REJECT_ACCEPT_REQUEST, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + idToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const responseJson = await response.json();
    if (responseJson.result && responseJson.data) {
      toggleLoading();
      let jobData = {
        id: responseJson.data.id,
        order_id,
        user_id,
        image,
        fcm_id,
        name,
        mobile,
        dob,
        address,
        lat,
        lang,
        service_name,
        chat_status: '1',
        status,
        delivery_address,
        delivery_lat,
        delivery_lang,
        imageAvailable
      };
      newjobRequests[pos] = jobData;
      fetchedPendingJobInfo({ data: newjobRequests });
      if (redirect) navigate();
    } else {
      onError('Something went wrong, no data returned.');
    }
  } catch (e) {
    onError(e.message);
  }
};

export const rejectChatRequest = async (
  {
    pos,
    fetchedPendingJobInfo,
    providerDetails,
    rejectionData,
    jobRequestsProviders,
    toggleLoading,
    onError,
    onSuccess,
    navigate,
  },
  redirect = true,
) => {
  try {
    toggleLoading(true);
    let newjobRequestsProviders = cloneDeep(jobRequestsProviders);
    const { id, user_id, fcm_id, service_name, order_id } = jobRequestsProviders[
      pos
    ];
    const data = rejectionData || {
      main_id: id,
      chat_status: '0',
      status: 'Rejected',
      notification: {
        fcm_id,
        title: 'Chat Request Rejected',
        type: 'JobRejection',
        notification_by: 'Employee',
        save_notification: true,
        user_id,
        employee_id: providerDetails.providerId,
        order_id,
        body:
          'Chat request has been accepted by ' +
          providerDetails.name +
          ' Request Id : ' +
          order_id,
        data: {
          providerId: providerDetails.id,
          serviceName: service_name,
          orderId: order_id,
          mainId: id,
        },
      },
    };
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const response = await fetch(REJECT_ACCEPT_REQUEST, {
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
      if (!rejectionData) {
        toggleLoading(false);
        newjobRequestsProviders.splice(pos, 1);
        fetchedPendingJobInfo({ data: newjobRequestsProviders });
      }
      onSuccess && onSuccess();
    } else {
      onError('Something went wrong');
    }
    if (redirect) navigate();
  } catch (e) {
    onError(e.message);
  }
};

export const updateAvailabilityInDB = async ({
  userData,
  providerDetails,
  updateProviderDetails,
  online,
  onSuccess,
  onError,
}) => {
  try {
    let newProDits = cloneDeep(providerDetails);
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const resp = await fetch(PRO_INFO_UPDATE + providerDetails.providerId, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + idToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const response = await resp.json();
    const { result, data, message } = response;
    if (result && data) {
      newProDits.online = data.online;
      await synchroniseOnlineStatus(providerDetails.providerId, data.online);
      updateProviderDetails(newProDits);
      onSuccess(message, online, data.online);
    } else {
      onError(message);
    }
  } catch (e) {
    onError(e.message);
  }
};
//Recent Chat Message
export const getMoreRecentChats = async ({ id, limit = 10, page = 1, dataSource, onSuccess, onError }) => {
  try {
    if (!id) return onError();
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const res = await fetch(
      FETCH_RECENT_MESSAGES + '?id=' + id + '&limit=' + limit + '&page=' + page, {
      headers: {
        Authorization: 'Bearer ' + idToken
      }
    });
    const response = await res.json();
    if (response.result) {
      return onSuccess(response.data, response.metadata);
    }
    return onError(response.message);
  } catch (e) {
    onError(e.message);
  }
};

export const setMessageChangeListeners = async ({ id, limit = 10, page = 1, dataSource, onSuccess, onError }) => {
  try {
    if (!id) return onError();
    const nLimit = Number(limit);
    const ref = database()
      .ref('recentMessage')
      .child(id);
    const dbRef = ref.limitToLast(nLimit);
    const countResp = await ref.once('value');
    const chatCount = countResp.numChildren();
    const totalPages = (chatCount - ((Number(page) - 1) * nLimit)) / nLimit;
    dbRef.on('value', async resp => {
      const messages = resp.val();
      if (!messages) return onError();
      let msgsArr = Object.values(messages);
      onSuccess(msgsArr, { page, totalPages, limit });
    });
  } catch (e) {
    onError(e.message);
  }
}

export const attachFile = async ({
  senderId,
  receiverId,
  dbMessagesFetched,
  sendMessageTask,
  messagesInfo,
  clearInput,
  toggleUploadingImage,
}) => {
  let newMessages = cloneDeep(messagesInfo.messages);
  const time = moment().toISOString();
  const date =
    new Date().getDate() +
    '/' +
    (new Date().getMonth() + 1) +
    '/' +
    new Date().getFullYear();
  clearInput();
  try {
    FilePickerManager.showFilePicker(null, async response => {
      toggleUploadingImage(true);
      let urlText = response.uri;
      const ext = response.fileName.split('.').pop();
      const altMessage = {
        name: response.fileName,
        ext,
        fileType: response.type,
        uri: urlText,
        path: response.path,
      };
      if (newMessages[receiverId])
        newMessages[receiverId].push({
          textMessage: urlText,
          file: altMessage,
          receiverId,
          senderId,
          local: true,
          notUploaded: true,
          time,
          type: 'image',
          date,
        });
      else {
        newMessages[receiverId] = [];
        newMessages[receiverId].push({
          textMessage: urlText,
          file: altMessage,
          receiverId,
          senderId,
          notUploaded: true,
          local: true,
          type: 'image',
          time,
          date,
        });
      }
      dbMessagesFetched({ data: newMessages });
      const newUrlText = await uploadAttachment(response);
      altMessage.uri = newUrlText;
      if (newUrlText) {
        sendMessageTask('image', altMessage);
        toggleUploadingImage(false);
      }
    });
  } catch (e) {
    SimpleToast.show(
      'Something went wrong, try again later',
      SimpleToast.SHORT,
    );
  }
};

export const sendMessageTask = async ({
  type,
  userType,
  userId,
  inputMessage,
  senderId,
  senderName,
  senderImage,
  receiverId,
  receiverImage,
  fcm_id,
  receiverName,
  serviceName,
  orderId,
  altMessage,
  fetchMessages,
  dbMessagesFetched,
  messagesInfo,
  toggleIsLoading,
  clearInput,
}) => {
  if (!socket.connected) {
    toggleIsLoading(true);
    socket.connect();
    await fetchMessages(userId, () =>
      setTimeout(() => toggleIsLoading(false), 200),
    );
  }
  let newMessages = cloneDeep(messagesInfo.messages);
  const time = moment().toISOString();
  const date =
    new Date().getDate() +
    '/' +
    (new Date().getMonth() + 1) +
    '/' +
    new Date().getFullYear();
  if (inputMessage.length > 0 || (altMessage && type === 'image')) {
    const messageObj = {
      type,
      userType,
      textMessage: inputMessage || altMessage.uri,
      senderId,
      senderName,
      file: altMessage,
      senderImage,
      receiverId,
      receiverName,
      receiverImage,
      fcm_id,
      serviceName,
      orderId,
      time,
      date,
    };
    if (type === 'text') {
      if (newMessages[receiverId])
        newMessages[receiverId].push(messageObj);
      else {
        newMessages[receiverId] = [];
        newMessages[receiverId].push(messageObj);
      }
    } else {
      newMessages[receiverId][
        newMessages[receiverId].length - 1
      ].notUploaded = false;
    }
    if (socket.connected) {
      clearInput();
      dbMessagesFetched({ data: newMessages });
      socket.emit('sent-message', messageObj);
    } else {
      SimpleToast.show(
        'No connection, wait a few seconds and send again or check your internet connection.',
        SimpleToast.LONG,
      );
    }
  }
};

export const setOnlineStatusListener = ({ OnlineUsers, userId, setStatus }) => {
  const userRef = database().ref(`users/${userId}`);
  userRef.on('value', data => {
    if (data) {
      const { status } = data.val();
      if (userId) {
        if (OnlineUsers[userId]) {
          if (OnlineUsers[userId] && status === '1') {
            const onlineStatus = OnlineUsers[userId].status === '1';
            setStatus(status, onlineStatus);
          } else {
            const onlineStatus = status === '1';
            setStatus(status, onlineStatus);
          }
        }
      }
    }
  });
};

export const deregisterOnlineStatusListener = userId => {
  const userRef = database().ref(`users/${userId}`);
  userRef.off('child_changed');
  userRef.off('child_added');
  userRef.off('value');
};
