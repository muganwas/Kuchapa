import React, { Component } from 'react';
import {
  View,
  Image,
  Text,
  StatusBar,
  TouchableOpacity,
  BackHandler,
  Platform,
  StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import RNExitApp from 'react-native-exit-app';
import { themeRed, white, black } from '../../Constants/colors';
import { fetchCountryCodes } from '../../Redux/Actions/validationActions';

class AfterSplashScreen extends Component {
  async componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', () =>
      this.handleBackButtonClick(),
    );
    const { fetchCodes } = this.props;
    await fetchCodes();
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  handleBackButtonClick = () => {
    if (Platform.OS === 'android') BackHandler.exitApp();
    else RNExitApp.exitApp();
  };

  render() {
    const {
      navigation: { navigate },
    } = this.props;
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={white} />

        <Image
          style={{ width: 140, height: 140, marginBottom: 30 }}
          source={require('../../images/kuchapa_logo.png')}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => navigate('AccountType')}>
          <Text style={styles.text}>Client</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => navigate('ProAccountType')}>
          <Text style={styles.text}>Service Provider</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    userInfo: state.userInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchCodes: () => {
      dispatch(fetchCountryCodes())
    }
  };
};

const AfterSplashScreenContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AfterSplashScreen);

export default AfterSplashScreenContainer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: 250,
    backgroundColor: themeRed,
    shadowColor: black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    textAlign: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  text: {
    color: white,
    textAlign: 'center',
    justifyContent: 'center',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
});
