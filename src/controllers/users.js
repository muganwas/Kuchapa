import messaging from '@react-native-firebase/messaging';
import {
  LoginManager,
  AccessToken,
  GraphRequest,
  GraphRequestManager,
} from 'react-native-fbsdk';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import firebaseAuth from '@react-native-firebase/auth';
import rNES from 'react-native-encrypted-storage';
import SimpleToast from 'react-native-simple-toast';
import { cloneDeep } from 'lodash';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import Config from '../components/Config';
import {
  emailCheck,
  passwordCheck,
  sanitizeMobileNumber,
  imageExists as imgExists,
  getDistance,
} from '../misc/helpers';

const PRO_GET_PROFILE = Config.baseURL + 'employee/';
const GET_ALL_PROVIDER_URL = Config.baseURL + 'job/serviceprovider/';
const USER_GET_PROFILE = Config.baseURL + 'users/';
const storageRef = storage().ref('/users_info');

export const checkForUserType = async navigate =>
  await rNES.getItem('userType').then(result => {
    if (!result) navigate('AfterSplash');
  });

export const getFCMToken = async (
  userId = '',
  onSuccess = () => { },
  onError = () => { },
) => {
  messaging()
    .getToken()
    .then(async fcmToken => {
      if (fcmToken) {
        try {
          const userType = await rNES.getItem('userType');
          onSuccess(userId, userType, fcmToken);
        } catch (e) {
          SimpleToast.show('Something went wrong, please try again.');
        }
      }
    })
    .catch(error => {
      onError(error);
    });
};

export const checkValidation = async (
  email,
  password,
  setErrorMessage,
  callback,
) => {
  const emailMsg = await emailCheck(email);
  const passwordMsg = await passwordCheck(password);
  if (emailMsg === true && passwordMsg === true) {
    typeof callback === 'function' && callback();
    return;
  }
  if (emailMsg && emailMsg !== true) {
    setErrorMessage(emailMsg);
    return;
  }
  if (passwordMsg && passwordMsg !== true) {
    setErrorMessage(passwordMsg);
    return;
  }
};

export const getUserType = async (
  onMessagingEnabled = () => { },
  onError = () => { },
) => {
  messaging()
    .requestPermission()
    .then(authStatus => {
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        onMessagingEnabled();
      } else {
        onError();
      }
    })
    .catch(error => {
      onError(error);
    });
};

export const googleLoginTask = async (
  setStateVars = (firebaseId, loginType) => { },
  callback = (name, email, image, loginType) => { },
) => {
  try {
    await GoogleSignin.hasPlayServices();
    var result = await GoogleSignin.signIn();
    const {
      user: { name, email, photo, id },
    } = result;
    setStateVars(id, 'google');
    callback(name, email, photo, 'google');
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      SimpleToast.show('You cancelled sign in.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      SimpleToast.show('Sign in is already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      SimpleToast.show(
        'You need to install play services to use this sign in method.',
      );
    } else {
      SimpleToast.show('Something went wrong, please try again.');
    }
  }
};

export const responseFbCallback = (
  error,
  result,
  setStateVars,
  callback = (name, email, imageURL, loginType) => { },
) => {
  if (!error) {
    const {
      id,
      name,
      email,
      picture: {
        data: { url },
      },
    } = result;
    setStateVars(id, 'facebook');
    callback(name, email, url, 'facebook');
  }
};

export const autoLogin = async (
  { userId, userType, fcmToken },
  setLoading,
  inhouseLogin,
  goTo,
) => {
  if (userId !== null) {
    setLoading();
    const storedInfo = await rNES
      .getItem('auth');

    if (storedInfo) {
      const info = JSON.parse(storedInfo);
      const { email, password } = info;
      const currentEmail = firebaseAuth().currentUser.email;
      const currentFirebaseId = firebaseAuth().currentUser.uid;
      const firebaseId = await rNES.getItem('firebaseId');
      if (currentEmail === email && firebaseId === currentFirebaseId)
        return inhouseLogin(userId, userType, fcmToken);
      firebaseAuth()
        .signInWithEmailAndPassword(email, password)
        .then(() => {
          inhouseLogin(userId, userType, fcmToken);
        })
        .catch(error => {
          SimpleToast.show(
            'Something went wrong, try closing and reopening app',
          );
        });
    } else inhouseLogin(userId, userType, fcmToken);
  } else {
    goTo('AfterSplash');
  }
};

export const synchroniseOnlineStatus = async (id, savedStatus) => {
  let status = savedStatus;
  const usersRef = database().ref(`users/${id}`);
  await usersRef.once('value', snapshot => {
    const value = snapshot.val();
    if (value != undefined) status = value.status;
    else {
      usersRef
        .set({ status })
        .then(() => {
          console.log('status set');
        })
        .catch(e => {
          console.log(e.message);
        });
    }
  });
  return status;
};

export const inhouseLogin = async ({
  userId,
  userType,
  fcmToken,
  onLoginFailure,
  fetchPendingJobInfo,
  fetchJobRequestHistory,
  updateAppUserDetails,
  props,
}) => {
  const home = userType === 'Provider' ? 'ProHome' : 'Home';
  const provider = userType === 'Provider';
  const fetchProfileUrl = provider ? PRO_GET_PROFILE : USER_GET_PROFILE;
  try {
    const response = await fetch(fetchProfileUrl + userId + '?fcm_id=' + fcmToken);
    const responseJson = await response.json();
    let onlineStatus;
    if (responseJson && responseJson.result) {
      const id = responseJson.data.id;
      onlineStatus = await synchroniseOnlineStatus(
        id,
        responseJson.data.online,
      );
      const imageAvailable = await imgExists(responseJson.data.image);
      let data = provider
        ? {
          providerId: responseJson.data.id,
          name: responseJson.data.username,
          email: responseJson.data.email,
          password: responseJson.data.password,
          image: responseJson.data.image,
          imageAvailable,
          surname: responseJson.data.surname,
          mobile: responseJson.data.mobile,
          services: responseJson.data.services,
          description: responseJson.data.description,
          address: responseJson.data.address,
          lat: responseJson.data.lat,
          lang: responseJson.data.lang,
          invoice: responseJson.data.invoice,
          firebaseId: responseJson.data.id,
          online: onlineStatus,
          status: responseJson.data.status,
          fcmId: responseJson.data.fcm_id,
          accountType: responseJson.data.account_type,
        }
        : {
          userId: responseJson.data.id,
          accountType: responseJson.data.acc_type,
          email: responseJson.data.email,
          password: responseJson.data.password,
          username: responseJson.data.username,
          image: responseJson.data.image,
          imageAvailable,
          mobile: responseJson.data.mobile,
          dob: responseJson.data.dob,
          address: responseJson.data.address,
          lat: responseJson.data.lat,
          online: onlineStatus,
          lang: responseJson.data.lang,
          firebaseId: responseJson.data.id,
          fcmId: responseJson.data.fcm_id,
        };
      updateAppUserDetails(data);
      fetchJobRequestHistory(userId);
      fetchPendingJobInfo(props, userId, home);
    } else onLoginFailure(responseJson.message);
  } catch (e) {
    const message = e.message.indexOf('Network') > -1
      ? 'Check your internet connection and try again'
      : 'Something went wrong, try again later';
    onLoginFailure(message);
  }
};

export const facebookLoginTask = async (updateAuthToken, responseCallback) => {
  LoginManager.logInWithPermissions(['public_profile', 'email']).then(
    result => {
      if (result.isCancelled) {
        console.log('Login cancelled');
      } else {
        AccessToken.getCurrentAccessToken()
          .then(data => {
            updateAuthToken(data.accessToken);
            const infoRequest = new GraphRequest(
              '/me?fields=email,name,picture',
              null,
              responseCallback,
            );
            // Start the graph request.
            new GraphRequestManager().addRequest(infoRequest).start();
          })
          .catch(e => {
            SimpleToast.show('Something went wrong, try again later');
          });
      }
    },
    error => {
      SimpleToast.show('Something went wrong, try again later');
    },
  );
};

export const fbGmailLoginTask = async ({
  name,
  email,
  image,
  userType,
  firebaseId,
  accountType,
  loginType,
  updateAppUserDetails,
  fetchAppUserJobRequests,
  fetchJobRequestHistory,
  onError,
  toggleLoading,
  registerUrl,
  fetchProfileUrl,
  props,
}) => {
  const home = userType === 'Provider' ? 'ProHome' : 'Home';
  const userTypeName = userType === 'Provider' ? 'Provider' : 'User';
  const provider = userType === 'Provider';
  toggleLoading();
  const fcmToken = await messaging().getToken();
  if (fcmToken) {
    const userData = {
      account_type: accountType,
      username: name,
      email,
      image,
      mobile: '',
      dob: '',
      fcm_id: fcmToken,
      type: loginType,
    };
    try {
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: userData })
      });
      const responseJson = await response.json();
      if (responseJson.status === 200 && responseJson.data.createdDate) {
        const id = responseJson.data.id;
        const onlineStatus = await synchroniseOnlineStatus(
          id,
          responseJson.data.online,
        );
        try {
          const id = responseJson.data.id;
          const resp = await fetch(fetchProfileUrl + id + '?fcm_id=' + fcmToken, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          });
          const response = await resp.json();
          toggleLoading();
          const imageAvailable = await imgExists(responseJson.data.image);
          const idToken = await firebaseAuth().currentUser.getIdToken(true);
          if (response && response.result) {
            const data = provider
              ? {
                providerId: response.data.id,
                name: response.data.username,
                email: response.data.email,
                password: response.data.password,
                image: response.data.image,
                imageAvailable,
                surname: response.data.surname,
                mobile: response.data.mobile,
                services: response.data.services,
                description: response.data.description,
                address: response.data.address,
                lat: response.data.lat,
                lang: response.data.lang,
                invoice: response.data.invoice,
                firebaseId,
                online: onlineStatus,
                status: response.data.status,
                fcmId: response.data.fcm_id,
                accountType: responseJson.data.account_type,
              }
              : {
                userId: response.data.id,
                accountType: response.data.acc_type,
                email: response.data.email,
                password: response.data.password,
                username: response.data.username,
                image: response.data.image,
                imageAvailable,
                mobile: response.data.mobile,
                dob: response.data.dob,
                address: response.data.address,
                lat: response.data.lat,
                online: onlineStatus,
                lang: response.data.lang,
                firebaseId,
                fcmId: response.data.fcm_id,
              };
            updateAppUserDetails(data);
            //Store data like sharedPreference
            rNES.setItem('userId', id);
            rNES.setItem('idToken', idToken);
            rNES.setItem('userType', userTypeName);
            rNES.setItem('email', data.email);
            rNES.setItem('firebaseId', firebaseId);
            fetchJobRequestHistory(id);
            fetchAppUserJobRequests(props, id, home);
          } else {
            const data = provider
              ? {
                providerId: responseJson.data.id,
                name: responseJson.data.username,
                email: responseJson.data.email,
                password: responseJson.data.password,
                image: responseJson.data.image,
                surname: responseJson.data.surname,
                mobile: responseJson.data.mobile,
                services: responseJson.data.services,
                description: responseJson.data.description,
                address: responseJson.data.address,
                lat: responseJson.data.lat,
                lang: responseJson.data.lang,
                invoice: responseJson.data.invoice,
                online: onlineStatus,
                status: responseJson.data.status,
                fcmId: responseJson.data.fcm_id,
                accountType: responseJson.data.account_type,
                firebaseId,
              }
              : {
                userId: responseJson.data.id,
                accountType: responseJson.data.acc_type,
                email: responseJson.data.email,
                password: responseJson.data.password,
                username: responseJson.data.username,
                image: responseJson.data.image,
                mobile: responseJson.data.mobile,
                dob: responseJson.data.dob,
                address: responseJson.data.address,
                online: onlineStatus,
                lat: responseJson.data.lat,
                lang: responseJson.data.lang,
                fcmId: responseJson.data.fcm_id,
                firebaseId,
              };
            updateAppUserDetails(data);
            //Store data like sharedPreference
            rNES.setItem('userId', id);
            rNES.setItem('idToken', idToken);
            rNES.setItem('userType', userTypeName);
            rNES.setItem('email', data.email);
            rNES.setItem('firebaseId', firebaseId);
            fetchJobRequestHistory(id);
            fetchAppUserJobRequests(props, id, home);
          }
        } catch (e) {
          onError(e.message);
        }
      } else {
        const message =
          responseJson.message === 'Email not found'
            ? "You're not registered, register then login"
            : responseJson.data?.message?.indexOf('deactivated') > -1
              ? 'Your account is currently innactive, contact admin'
              : responseJson.message
                ? responseJson.message
                : 'Something went wrong, please try again later';
        onError(message);
      }
    } catch (e) {
      onError('Something went wrong, please try again later.');
    }
  } else {
    onError(
      'Your device has no fcm token, check your internet connection and try again.',
    );
  }
};

export const authenticateTask = async ({
  email,
  password,
  userType,
  authURL,
  fetchAppUserJobRequests,
  updateAppUserDetails,
  fetchJobRequestHistory,
  toggleLoading,
  onError,
  props,
}) => {
  toggleLoading();
  const fcmToken = await messaging().getToken();
  const provider = userType === 'Provider';
  const home = userType === 'Provider' ? 'ProHome' : 'Home';
  if (fcmToken) {
    firebaseAuth()
      .signInWithEmailAndPassword(email, password)
      .then(async result => {
        const { user } = result;
        if (user && typeof user === 'object') {
          const {
            _user: { uid },
          } = user;
          const data = {
            email,
            password,
            loginType: 'Firebase',
            fcm_id: fcmToken,
          };
          try {
            const response = await fetch(authURL, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            });
            const responseJson = await response.json();
            if (responseJson && responseJson.result) {
              const onlineStatus = await synchroniseOnlineStatus(
                responseJson.data.id,
                responseJson.data.online,
              );
              toggleLoading();
              const id = responseJson.data.id;
              const imageAvailable = await imgExists(responseJson.data.image);
              const idToken = await firebaseAuth().currentUser.getIdToken(true);
              const data = provider
                ? {
                  providerId: responseJson.data.id,
                  name: responseJson.data.username,
                  email: responseJson.data.email,
                  password: responseJson.data.password,
                  image: responseJson.data.image,
                  imageAvailable,
                  surname: responseJson.data.surname,
                  mobile: responseJson.data.mobile,
                  services: responseJson.data.services,
                  description: responseJson.data.description,
                  address: responseJson.data.address,
                  lat: responseJson.data.lat,
                  lang: responseJson.data.lang,
                  invoice: responseJson.data.invoice,
                  online: onlineStatus,
                  status: responseJson.data.status,
                  fcmId: responseJson.data.fcm_id,
                  accountType: responseJson.data.account_type,
                  firebaseId: uid,
                }
                : {
                  userId: responseJson.data.id,
                  accountType: responseJson.data.acc_type,
                  email: responseJson.data.email,
                  password: responseJson.data.password,
                  username: responseJson.data.username,
                  image: responseJson.data.image,
                  imageAvailable,
                  mobile: responseJson.data.mobile,
                  dob: responseJson.data.dob,
                  online: onlineStatus,
                  address: responseJson.data.address,
                  lat: responseJson.data.lat,
                  lang: responseJson.data.lang,
                  fcmId: responseJson.data.fcm_id,
                  firebaseId: uid,
                };
              updateAppUserDetails(data);
              //Store data like sharedPreference
              rNES.setItem('userId', id);
              rNES.setItem('userType', userType);
              const auth = {
                email,
                password,
              };
              rNES.setItem('idToken', idToken);
              rNES.setItem('auth', JSON.stringify(auth));
              rNES.setItem('firebaseId', uid);
              fetchJobRequestHistory(id);
              fetchAppUserJobRequests(props, id, home);
            } else {
              onError(responseJson.message);
            }
          } catch (e) {
            onError('Something went wrong, please try again.');
          }
        } else {
          onError('Something went wrong, please try again later.');
        }
      })
      .catch(error => {
        toggleLoading();
        if (error.code === 'auth/user-not-found') {
          onError("You've not registered yet, please register first");
        } else if (error.code === 'auth/wrong-password') {
          onError('You entered a wrong password!');
        } else {
          onError('Something went wrong, please try again later.');
        }
      });
  } else {
    onError(
      'Your device has no fcm token, check your internet connection and try again.',
    );
  }
};

export const forgotPasswordTask = async ({
  email,
  toggleLoading,
  forgotPasswordURL,
  onSuccess,
  onError,
}) => {
  toggleLoading();
  try {
    const data = {
      email,
    };
    const response = await fetch(forgotPasswordURL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const responseJson = await response.json();
    if (responseJson.result) {
      const msg =
        responseJson.message ||
        'Check you registered email address for further instructions.';
      onSuccess(msg);
    } else {
      const msg =
        responseJson.message || 'Something went wrong, please try again';
      onError(msg);
    }
  } catch (e) {
    const errorMsg = e.message;
    const basicMsg = 'Something went wrong, Try again later';
    let msg;
    if (errorMsg && errorMsg.indexOf('Network') > -1) {
      msg = 'Please check your internet connection and try again.';
    }
    if (!msg) {
      msg = basicMsg;
    }
    onError(msg);
  }
};

export const updateProfileImageTask = async ({
  userId,
  imageObject,
  firebaseId,
  userDetails,
  updateUserDetails,
  toggleIsLoading,
  updateURL,
}) => {
  toggleIsLoading(true);
  const { fileName, path } = imageObject;
  const userDataRef = storageRef.child(`/${firebaseId}/${fileName}`);
  userDataRef
    .putFile(path)
    .then(uploadRes => {
      const { state } = uploadRes;
      if (state === 'success') {
        userDataRef.getDownloadURL().then(async urlResult => {
          const response = await fetch(updateURL, {
            method: 'PUT',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId,
              uri: urlResult,
              name: imageObject.fileName,
            })
          });
          const res = await response.json();
          let newUserDetails = cloneDeep(userDetails);
          /** cater for different names for user and client */
          newUserDetails.image = newUserDetails.image = urlResult;
          newUserDetails.imageAvailable = true;
          await updateUserDetails(newUserDetails);
          toggleIsLoading(false);
          if (res && res.data.result) {
            SimpleToast.show(res.data.message);
          }
        });
      } else {
        SimpleToast.show('Upload failed, try again please.');
      }
    })
    .catch(error => {
      SimpleToast.show('Something went wrong, try again later.');
    });
};

export const updateProfileInfo = async ({
  userId,
  fcmId,
  userData,
  fetchUserProfile,
  updateURL,
  onSuccess,
  toggleIsLoading,
}) => {
  try {
    const resp = await fetch(updateURL + userId, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const response = await resp.json();
    if (response.result) {
      onSuccess(userData);
      SimpleToast.show(response.message);
      fetchUserProfile(userId, fcmId);
    } else {
      toggleIsLoading(false);
      SimpleToast.show(response.message);
    }
  } catch (e) {
    toggleIsLoading(false);
    SimpleToast.show('Something went wrong, try again later.');
  }
};

export const phoneLoginTask = async ({
  userType,
  accountType,
  loginType,
  firebaseId,
  fetchJobRequests,
  fetchJobRequestHistory,
  validationInfo,
  updateUserDetails,
  toggleIsLoading,
  registerURL,
  getProfileURL,
  onError,
  props,
}) => {
  toggleIsLoading(true);
  const fcmToken = await messaging().getToken();
  const Home = userType === 'Provider' ? 'ProHome' : 'Home';
  if (fcmToken) {
    try {
      const { mobile, countryCode } = validationInfo;
      const newMobile = await sanitizeMobileNumber(mobile, countryCode, false);
      const userData = {
        acc_type: accountType,
        username: newMobile,
        mobile: newMobile,
        fcm_id: fcmToken,
        type: loginType,
      };
      const response = await fetch(registerURL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: userData })
      });
      const responseJson = await response.json();
      if (responseJson.status === 200 && responseJson.data.createdDate) {
        const id = responseJson.data.id;
        const onlineStatus = await synchroniseOnlineStatus(
          id,
          responseJson.data.online,
        );
        try {
          /** get stored profile if exists */
          const resp = await fetch(getProfileURL + id + '?fcm_id=' + fcmToken, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          });
          const response = await resp.json();
          toggleIsLoading(false);
          if (response && response.result) {
            const imageAvailable = await imgExists(response.data.image);
            const idToken = await firebaseAuth().currentUser.getIdToken(true);
            const data =
              userType === 'Provider'
                ? {
                  providerId: response.data.id,
                  name: response.data.username,
                  email: response.data.email,
                  password: response.data.password,
                  image: response.data.image,
                  imageAvailable,
                  surname: response.data.surname,
                  mobile: response.data.mobile,
                  services: response.data.services,
                  description: response.data.description,
                  address: response.data.address,
                  lat: response.data.lat,
                  lang: response.data.lang,
                  invoice: response.data.invoice,
                  online: onlineStatus,
                  firebaseId,
                  status: response.data.status,
                  fcmId: response.data.fcm_id,
                  accountType: response.data.account_type,
                }
                : {
                  userId: response.data.id,
                  accountType: response.data.acc_type,
                  email: response.data.email,
                  password: response.data.password,
                  username: response.data.username,
                  image: response.data.image,
                  imageAvailable,
                  mobile: response.data.mobile,
                  dob: response.data.dob,
                  address: response.data.address,
                  online: onlineStatus,
                  lat: response.data.lat,
                  lang: response.data.lang,
                  firebaseId,
                  fcmId: response.data.fcm_id,
                };
            updateUserDetails(data);
            //Store data like sharedPreference
            rNES.setItem('userId', id);
            rNES.setItem('userType', userType);
            rNES.setItem('idToken', idToken);
            rNES.setItem('email', data.email);
            rNES.setItem('firebaseId', firebaseId);
            //Check if any Ongoing Request
            fetchJobRequestHistory(id);
            fetchJobRequests(props, id, Home);
          } else {
            toggleIsLoading(false);
            SimpleToast.show(
              'Something went wrong, try again later',
            );
          }
        } catch (e) {
          toggleIsLoading(false);
          SimpleToast.show(
            'Something went wrong, try again',
            SimpleToast.SHORT,
          );
        }
      } else {
        onError(responseJson.data.message || 'Something went wrong');
      }
    } catch (e) {
      onError('Something went wrong, try again.');
    }
  } else {
    toggleIsLoading(false);
    SimpleToast.show(
      'Something went wrong, we could not retrieve your fcm token, restart app and try again',
      SimpleToast.SHORT,
    );
  }
};

export const registerTask = async ({
  email,
  username,
  surname,
  userType,
  mobile,
  services,
  description,
  address,
  lat,
  lang,
  invoice,
  password,
  fcmToken,
  dob,
  accountType,
  type,
  imageObject,
  toggleIsLoading,
  registerURL,
  updateNewUserInfo,
  onSuccess,
  onError,
}) => {
  toggleIsLoading(true);
  const userData =
    userType === 'Provider'
      ? {
        username,
        surname,
        email,
        password,
        mobile,
        services,
        description,
        address,
        lat,
        lang,
        invoice,
        fcm_id: fcmToken,
        type,
        account_type: accountType,
      }
      : {
        username,
        email,
        mobile,
        password,
        dob,
        acc_type: accountType,
        fcm_id: fcmToken,
        type,
      };
  firebaseAuth()
    .createUserWithEmailAndPassword(email, password)
    .then(result => {
      const { fileName, uri } = imageObject;
      const {
        user: { uid },
      } = result;
      const newUser = Object.assign({ uid }, userData);
      const userDataRef = storageRef.child(`/${uid}/${fileName}`);
      updateNewUserInfo(newUser);
      userDataRef
        .putFile(uri)
        .then(uploadRes => {
          const { state } = uploadRes;
          if (state === 'success') {
            userDataRef.getDownloadURL().then(async urlResult => {
              let newUserData = cloneDeep(userData);
              newUserData.image = urlResult;
              try {
                const response = await fetch(registerURL, {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ data: newUserData })
                })
                const responseJson = await response.json();
                if (
                  responseJson.status === 200 &&
                  responseJson.data.createdDate
                ) {
                  onSuccess(
                    'Please check your email inbox for an account verificatoin link.',
                  );
                } else {
                  onError(
                    responseJson.data.message ||
                    'Something went wrong, try again later',
                  );
                }
              } catch (e) {
                onError('Something went wrong, please try again.');
              };
            });
          }
        })
        .catch((e) => {
          onError('Image upload failed');
        });
    })
    .catch(error => {
      let errMsg;
      if (error.code === 'auth/email-already-in-use')
        errMsg = 'The email is already registerd.';
      else if (error.code === 'auth/invalid-email')
        errMsg = 'Your email address is invalid!';
      else if (error.code === 'auth/weak-password')
        errMsg = 'Your password is too weak';
      else errMsg = 'Something went wrong, please try again later';
      onError(errMsg, true);
    });
};

export const getAllProviders = async ({
  userDetails,
  serviceId,
  toggleIsLoading,
  usersCoordinates,
  setDistInfo,
  setDistDataSource,
  onSuccess,
  onError,
}) => {
  const data = {
    lat: userDetails.lat,
    lang: userDetails.lang,
  };
  try {
    const response = await fetch(GET_ALL_PROVIDER_URL + serviceId, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const responseJson = await response.json();
    if (responseJson.result) {
      let dataSource = responseJson.data;
      await calculateDistance({
        usersCoordinates,
        dataSource,
        setDistInfo,
        onSuccess: setDistDataSource,
      });
      onSuccess();
    } else {
      onError();
    }
  } catch (e) {
    toggleIsLoading(false);
    SimpleToast.show('Something went wrong, try again');
  }
};

export const calculateDistance = async ({
  usersCoordinates,
  dataSource,
  toggleIsRefreshing,
  setDistInfo,
  onSuccess,
}) => {
  toggleIsRefreshing && toggleIsRefreshing(true);
  var distInfo = {};
  var tempDatasource = cloneDeep(dataSource);
  if (dataSource.length > 0) {
    await dataSource.map(async (obj, key) => {
      const { _id, image } = obj;
      let imageAvaliable = image && image !== 'no-image.jpg' ? true : false;
      if (image && imageAvaliable) {
        imageAvaliable = await imgExists(image);
      }
      tempDatasource[key].imageAvailable = imageAvaliable;
      await database()
        .ref(`liveLocation/${_id}`)
        .once('value', result => {
          const { latitude, longitude, address } = result.val();
          const dist = getDistance(
            latitude,
            longitude,
            usersCoordinates.latitude,
            usersCoordinates.longitude,
            'K',
          );
          distInfo[_id] = parseFloat(dist).toFixed(1);
          tempDatasource[key].hash = parseFloat(dist).toFixed(1);
          tempDatasource[key].currentAddress = address;
          setDistInfo(distInfo);
        })
        .catch(e => {
          console.log('dist cal error ', e.message);
        });
    });
    onSuccess(tempDatasource);
  }
};

export const fetchProfile = async ({
  userId,
  onSuccess,
  setDistance,
  onError,
  userGetProfileURL,
}) => {
  try {
    const response = await fetch(userGetProfileURL + userId, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const responseJson = await response.json();
    let imageAvailable =
      responseJson.data.image && !responseJson.data.image !== 'no-image.jpg'
        ? true
        : false;
    if (imageAvailable)
      imageAvailable = await imgExists(responseJson.data.image);
    if (responseJson.result) {
      const id = responseJson.data.id;
      onSuccess({
        userId: responseJson.data.id,
        userName: responseJson.data.username,
        userImage: responseJson.data.image,
        imageAvailable,
        userMobile: responseJson.data.mobile,
        userDob: responseJson.data.dob,
        userAddress: responseJson.data.address,
        userLat: responseJson.data.lat,
        userLang: responseJson.data.lang,
        userFcmId: responseJson.data.fcm_id,
      });
      await database()
        .ref(`liveLocation/${id}`)
        .once('value', result => {
          const { latitude, longitude } = result.val();
          const fullDist = getDistance(
            latitude,
            longitude,
            responseJson.data.lat,
            responseJson.data.lang,
            'K',
          );
          const distance = parseFloat(fullDist).toFixed(1);
          setDistance(distance);
        })
        .catch(e => {
          onError("Someting went wrong, couldn't fetch user information");
        });
    } else {
      onError('Something went wrong, try again');
    }
  } catch (e) {
    onError("Someting went wrong, couldn't fetch user information");
  }
};

export const getRating = async ({ id, ratingsURL }) => {
  let avg = 0;
  try {
    const response = await fetch(ratingsURL + id);
    const res = await response.json();
    if (res.data.rating > 0) avg = res.data.rating;
  } catch (e) {
    console.log(e);
  }
  return avg;
};
