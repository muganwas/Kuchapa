import { Config } from '../../components';
import SimpleToast from 'react-native-simple-toast';
import {
  UPDATE_VALIDATION_CODE,
  UPDATE_NUMBER_SENT,
  UPDATE_CONFIRMATION_OBJECT,
  RESET_VALIDATION,
  UPDATE_MOBILE_NUMBER,
  UPDATE_COUNTRY_CODE,
  UPDATE_COUNTRY_ALPHA_2,
} from '../types';

export const updateValidationCode = payload => {
  return {
    type: UPDATE_VALIDATION_CODE,
    payload,
  };
};

export const updateMobileNumber = payload => {
  return {
    type: UPDATE_MOBILE_NUMBER,
    payload,
  };
};

export const updateCountryCode = payload => {
  return {
    type: UPDATE_COUNTRY_CODE,
    payload,
  };
};

export const updateCountryAlpha2 = payload => {
  return {
    type: UPDATE_COUNTRY_ALPHA_2,
    payload,
  };
};

export const updateNumberSent = payload => {
  return {
    type: UPDATE_NUMBER_SENT,
    payload,
  };
};

export const updateConfirmationObject = payload => {
  return {
    type: UPDATE_CONFIRMATION_OBJECT,
    payload,
  };
};

export const resetValidateon = () => {
  return {
    type: RESET_VALIDATION,
  };
};

export const fetchCountryCodes = () => {
  return dispatch => {
    try {
      fetch(Config.baseURL + 'service/countryCodes/all').then(res => res.json())
        .then(responseJson => {
          const { country_code, country_alpha } = responseJson.data;
          dispatch(updateCountryCode(country_code));
          dispatch(updateCountryAlpha2(country_alpha));
        });
    } catch (e) {
      SimpleToast.show('Failed to fetch country information');
      console.log('fetch country codes', e);
    }
  };
};
