import io from 'socket.io-client';
import {
  BASE_URL_CLOUD,
  BASE_URL_LOCAL,
  WEB_CLIENT_ID,
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_COUNTRY_ALPHA2,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  MAPS_API_KEY,
  MAP_BOX_ACCESS_TOKEN
} from "../../config.json";
export default class Config {
  static clientId = WEB_CLIENT_ID;
  static baseURL = BASE_URL_LOCAL;
  static apiKey = FIREBASE_API_KEY;
  static mapsApiKey = MAPS_API_KEY;
  static defaultCCode = DEFAULT_COUNTRY_CODE;
  static defaultAlpha2 = DEFAULT_COUNTRY_ALPHA2;
  static authDomain = FIREBASE_AUTH_DOMAIN;
  static databaseURL = FIREBASE_DATABASE_URL;
  static projectId = FIREBASE_PROJECT_ID;
  static storageBucket = FIREBASE_STORAGE_BUCKET;
  static mapboxAccessToken = MAP_BOX_ACCESS_TOKEN;
  static messagingSenderId = FIREBASE_MESSAGING_SENDER_ID;
  static appId = FIREBASE_APP_ID;
  static socket = io(this.baseURL, {
    autoConnect: false,
    secure: true,
    transports: ['websocket'],
  });
}
