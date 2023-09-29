import { cloneDeep } from 'lodash';
import database from '@react-native-firebase/database';
import firebaseAuth from '@react-native-firebase/auth';
import Geolocation from 'react-native-geolocation-service';
import SimpleToast from 'react-native-simple-toast';

import Config from '../components/Config';

const ASK_FOR_REVIEW = Config.baseURL + 'notification/addreviewrequest';
const REJECT_ACCEPT_REQUEST = Config.baseURL + 'jobrequest/updatejobrequest';
const SERVICES_URL = Config.baseURL + 'service/getall';

export const requestClientForReview = async ({
  item,
  props,
  fetchJobRequestHistory,
  providerDetails,
  toggleIsLoading,
  onSuccess,
  onError,
}) => {
  if (item.customer_review !== 'Requested' && item.customer_rating === '') {
    toggleIsLoading(true);
    const askReviewData = {
      order_id: item._id,
      user_id: item.user_id,
      employee_id: providerDetails.providerId,
      notification: {
        fcm_id: item.user_details.fcm_id,
        type: 'ReviewRequest',
        notification_by: 'Employee',
        title: 'Ask For Review',
        save_notification: true,
        user_id: item.user_id,
        employee_id: providerDetails.providerId,
        order_id: item._id,
        body:
          providerDetails.name +
          ' ' +
          providerDetails.surname +
          ' waiting for your feedback',
      },
    };
    try {
      const idToken = await firebaseAuth().currentUser.getIdToken();
      const resp = await fetch(ASK_FOR_REVIEW, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + idToken,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(askReviewData),
      });
      const response = await resp.json();
      if (response.result) {
        toggleIsLoading();
        onSuccess('Request submitted successfully');
        fetchJobRequestHistory({ providerId: providerDetails.providerId, props });
      } else {
        onError(response.message);
      }
    } catch (e) {
      onError('Something went wrong, try again');
    }
  } else if (item.customer_review == 'Requested') {
    onError('You have already asked, Please wait for customer feedback');
  }
};

export const jobCancelTask = async ({
  userType,
  currRequestPos,
  toggleIsLoading,
  updatePendingJobInfo,
  jobRequests,
  userDetails,
  onSuccess,
  onError,
  navigate,
}) => {
  toggleIsLoading(true);
  const dash = userType === 'Provider' ? 'ProHome' : 'Home';
  try {
    let newJobRequests = cloneDeep(jobRequests);
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const data =
      userType === 'Provider'
        ? {
          main_id: jobRequests[currRequestPos]?.id,
          chat_status: '1',
          status: 'Cancelled',
          notification: {
            fcm_id: jobRequests[currRequestPos]?.customer_details?.fcm_id,
            title: 'Job Cancelled',
            type: 'JobCancellation',
            body:
              'Your job request has been cancelled by the service provder,' +
              ' Request Id : ' +
              jobRequests[currRequestPos]?.order_id,
            save_notification: true,
            user_id: jobRequests[currRequestPos]?.customer_details?._id,
            employee_id: userDetails.providerId,
            order_id: jobRequests[currRequestPos]?.order_id,
            notification_by: 'Employee',
            data: {
              ProviderId: userDetails.providerId,
              orderId: jobRequests[currRequestPos]?.order_id,
              mainId: jobRequests[currRequestPos]?.id,
            },
          },
        }
        : {
          main_id: jobRequests[currRequestPos].id,
          chat_status: '1',
          status: 'Cancelled',
          notification: {
            fcm_id: jobRequests[currRequestPos].fcm_id,
            title: 'Job Cancelled',
            type: 'JobCancellation',
            user_id: userDetails.userId,
            employee_id: jobRequests[currRequestPos].employee_id,
            order_id: jobRequests[currRequestPos].order_id,
            notification_by: 'Customer',
            save_notification: true,
            body:
              'Job request has been cancelled by client' +
              ' Request Id : ' +
              jobRequests[currRequestPos].order_id,
            data: {
              ProviderId: jobRequests[currRequestPos].employee_id,
              orderId: jobRequests[currRequestPos].order_id,
              mainId: jobRequests[currRequestPos].id,
            },
          },
        };
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
      onSuccess && onSuccess();
      toggleIsLoading(false);
      newJobRequests.splice(currRequestPos, 1);
      updatePendingJobInfo({ data: newJobRequests });
      navigate && navigate(dash);
    } else {
      onError(responseJson.message);
    }
  } catch (e) {
    onError(e.message);
  }
};

export const acceptJobTask = async ({
  receiverId,
  orderId,
  fcm_id,
  mainId,
  providerDetails,
  dataWorkSource,
  fetchedDataWorkSource,
  fetchedPendingJobInfo,
  jobRequestsProviders,
  toggleIsLoading,
  currRequestPos,
  onSuccess,
  onError,
}) => {
  toggleIsLoading(true);
  let newDWS = cloneDeep(dataWorkSource);
  let dataWSPos;
  await newDWS.map((wks, i) => {
    if (wks.order_id === orderId) dataWSPos = i;
  });
  const data = {
    main_id: mainId,
    chat_status: '1',
    status: 'Accepted',
    notification: {
      fcm_id,
      title: 'Job Accepted',
      type: 'JobAcceptence',
      notification_by: 'Employee',
      user_id: receiverId,
      employee_id: providerDetails.providerId,
      order_id: orderId,
      save_notification: true,
      body:
        'Your request has been accepted by ' +
        providerDetails.name +
        ' ' +
        providerDetails.surname +
        ' Request Id : ' +
        orderId,
      data: {
        userId: receiverId,
        providerId: providerDetails.providerId,
        orderId: orderId,
        mainId: mainId,
      },
    },
  };
  try {
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
    let newjobRequestsProviders = cloneDeep(jobRequestsProviders);
    if (responseJson.data) {
      onSuccess();
      if (dataWSPos || dataWSPos === 0) {
        newDWS[dataWSPos].status = 'Accepted';
        fetchedDataWorkSource({ data: newDWS });
      }
      newjobRequestsProviders[currRequestPos].chat_status =
        responseJson.data.chat_status;
      newjobRequestsProviders[currRequestPos].status =
        responseJson.data.status;
      fetchedPendingJobInfo({ data: newjobRequestsProviders });
      //Send Location to Firebase for tracking
      Geolocation.getCurrentPosition(position => {
        let locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        let updates = {};
        updates['tracking/' + orderId] = locationData;
        database()
          .ref()
          .update(updates);
      });
    } else {
      onError();
      SimpleToast.show(responseJson.message);
    }
  } catch (e) {
    toggleIsLoading(false);
    SimpleToast.show(e.message);
  }
};

export const rejectJobTask = async ({
  orderId,
  receiverId,
  currRequestPos,
  mainId,
  fcm_id,
  dataWorkSource,
  providerDetails,
  toggleIsLoading,
  fetchedPendingJobInfo,
  fetchedDataWorkSource,
  jobRequestsProviders,
  navigation,
  onSuccess,
  onError,
}) => {
  toggleIsLoading(true);
  let newDWS = cloneDeep(dataWorkSource);
  let dataWSPos;
  await newDWS.map((wks, i) => {
    if (wks.order_id === orderId) dataWSPos = i;
  });
  const data = {
    main_id: mainId,
    chat_status: '1',
    status: 'Rejected',
    notification: {
      fcm_id,
      title: 'Job Rejected',
      type: 'JobRejection',
      notification_by: 'Employee',
      save_notification: true,
      user_id: receiverId,
      employee_id: providerDetails.providerId,
      order_id: orderId,
      body:
        'Your request has been rejected by ' +
        providerDetails.name +
        ' Request Id : ' +
        orderId,
      data: {
        ProviderId: providerDetails.providerId,
        orderId: orderId,
        mainId: mainId,
      },
    },
  };
  try {
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
    let newjobRequestsProviders = cloneDeep(jobRequestsProviders);
    if (responseJson.result) {
      onSuccess();
      if (dataWSPos || dataWSPos === 0) {
        newDWS.splice(dataWSPos, 1);
        fetchedDataWorkSource(newDWS);
      }
      newjobRequestsProviders.splice(currRequestPos, 1);
      fetchedPendingJobInfo({ data: newjobRequestsProviders });
      navigation.navigate('ProHome');
    } else {
      onError();
      SimpleToast.show(responseJson.message);
    }
  } catch (e) {
    toggleIsLoading(false);
    SimpleToast.show(e.message);
  }
};

export const jobCompleteTask = async ({
  userType,
  currRequestPos,
  jobRequests,
  userDetails,
  updatePendingJobInfo,
  toggleIsLoading,
  onSuccess,
  onError,
  navigate,
  rejectAcceptURL,
}) => {
  toggleIsLoading(true);
  const dash = userType === 'Provider' ? 'ProHome' : 'Home';
  try {
    let newJobRequests = cloneDeep(jobRequests);
    const idToken = await firebaseAuth().currentUser.getIdToken();
    if (jobRequests[currRequestPos]) {
      const data =
        userType === 'Provider'
          ? {
            main_id: jobRequests[currRequestPos]?.id,
            chat_status: '1',
            status: 'Completed',
            notification: {
              fcm_id: jobRequests[currRequestPos]?.customer_details?.fcm_id,
              title: 'Job Completed',
              type: 'jobCompletion',
              body:
                'Your job request has been completed by the service provder,' +
                ' Request id: ' +
                jobRequests[currRequestPos]?.order_id,
              save_notification: true,
              user_id: jobRequests[currRequestPos]?.customer_details?._id,
              employee_id: userDetails.providerId,
              order_id: jobRequests[currRequestPos]?.order_id,
              notification_by: 'Employee',
              data: {
                ProviderId: userDetails.providerId,
                orderId: jobRequests[currRequestPos]?.order_id,
                mainId: jobRequests[currRequestPos]?.id,
              },
            },
          }
          : {
            main_id: jobRequests[currRequestPos]?.id,
            chat_status: '1',
            status: 'Completed',
            notification: {
              fcm_id: jobRequests[currRequestPos]?.fcm_id,
              title: 'Job Completed',
              body:
                'Job Id : ' +
                jobRequests[currRequestPos]?.order_id +
                ' has been reported complete by the client.',
              type: 'Job Completed',
              user_id: userDetails.userId,
              employee_id: jobRequests[currRequestPos]?.employee_id,
              order_id: jobRequests[currRequestPos]?.order_id,
              notification_by: 'Customer',
              save_notification: true,
              data: {
                ProviderId: jobRequests[currRequestPos]?.employee_id,
                orderId: jobRequests[currRequestPos]?.order_id,
                mainId: jobRequests[currRequestPos]?.id,
              },
            },
          };
      const response = await fetch(rejectAcceptURL, {
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
        onSuccess();
        newJobRequests.splice(currRequestPos, 1);
        updatePendingJobInfo({ data: newJobRequests });
        navigate(dash);
      } else {
        onError(responseJson.message);
      }
    } else {
      SimpleToast.show('Something went wrong, try logging in and out of app');
    }
  } catch (e) {
    onError('Something went wrong, try again later');
  }
};

export const fetchJobInfo = async ({ jobFetchURL }) => {
  try {
    const idToken = await firebaseAuth().currentUser.getIdToken();
    const result = await fetch(jobFetchURL, {
      headers: {
        Authorization: 'Bearer ' + idToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }
    });
    const jobInfo = await result.json();
    return jobInfo?.data;
  } catch (e) {
    SimpleToast.show(e.message);
    return null;
  }
}

export const fetchServices = async ({ onSuccess, onError }) => {
  try {
    const response = await fetch(SERVICES_URL);
    const responseJson = await response.json();
    onSuccess(responseJson.data);
  } catch (e) {
    onError(e.message);
  }
};
