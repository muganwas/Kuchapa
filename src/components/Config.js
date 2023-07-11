import io from 'socket.io-client';
import {
  BASE_URL_CLOUD,
  BASE_URL_LOCAL,
  WEB_CLIENT_ID,
  BASE_URL_LOCAL_ALT,
  BASE_URL_LOCAL_ALT_1,
  BASE_URL_LOCAL_ALT_2,
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_COUNTRY_ALPHA2,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
} from '@env';
/** TODO: Get rid of dotenv
 * too many dependencies
 */
//local_alt
export default class Config {
  static clientId = WEB_CLIENT_ID;
  static baseURL = BASE_URL_LOCAL_ALT;
  static apiKey = FIREBASE_API_KEY;
  static defaultCCode = DEFAULT_COUNTRY_CODE;
  static defaultAlpha2 = DEFAULT_COUNTRY_ALPHA2;
  static authDomain = FIREBASE_AUTH_DOMAIN;
  static databaseURL = FIREBASE_DATABASE_URL;
  static projectId = FIREBASE_PROJECT_ID;
  static storageBucket = FIREBASE_STORAGE_BUCKET;
  static messagingSenderId = FIREBASE_MESSAGING_SENDER_ID;
  static appId = FIREBASE_APP_ID;
  static socket = io(this.baseURL, {
    autoConnect: false,
    transports: ['websocket'],
  });
}
