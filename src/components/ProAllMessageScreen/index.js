import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  BackHandler,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import _ from 'lodash';
import ProHamburger from '../ProHamburger';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {
  startFetchingJobProvider,
  fetchProviderJobInfoError,
  setSelectedJobRequest,
} from '../../Redux/Actions/jobsActions';
import { updateLatestChats } from '../../Redux/Actions/messageActions';
import { getAllRecentChats } from '../../controllers/chats';
import { colorBg, white, themeRed, lightGray } from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
  return Platform.OS === 'ios' ? (
    <View
      style={{
        width: '100%',
        height: STATUS_BAR_HEIGHT,
        backgroundColor: white,
      }}>
      <StatusBar barStyle="dark-content" />
    </View>
  ) : (
    <StatusBar barStyle="dark-content" backgroundColor={white} />
  );
};

class ProAllMessageScreen extends Component {
  constructor() {
    super();
    this.state = {
      isLoading: true,
      dataSource: [],
      isRecentMessage: false,
      query: '',
      isDataMatch: true,
      backClickCount: 0,
    };
    this.springValue = new Animated.Value(100);
  }

  componentDidMount() {
    const {
      messagesInfo: { latestChats },
      navigation
    } = this.props;
    this.setState({ dataSource: latestChats, isLoading: false });
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    this._unsubscribe = navigation.addListener('focus', this.updateDataSource);
  }

  componentDidUpdate() {
    const {
      messagesInfo: { latestChats },
    } = this.props;
    if (!_.isEqual(this.state.dataSource, latestChats)) {
      this.setState({ dataSource: latestChats, isLoading: false });
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    this._unsubscribe();
  }

  updateDataSource = async () => {
    this.setState({ isLoading: true });
    await getAllRecentChats({
      id: this.props?.userInfo?.providerDetails?.providerId,
      dataSource: this.props?.messagesInfo?.latestChats,
      onSuccess: data => {
        this.props.updateLatestChats(data);
        this.setState({ isLoading: false });
      },
      onError: () => this.setState({ isLoading: false })
    });
  }

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
  };

  renderRecentMessageItem = (item, index) => {
    const {
      dispatchSelectedJobRequest,
      jobsInfo: { allJobRequestsProviders },
      navigation
    } = this.props;

    const currentPos = allJobRequestsProviders.findIndex(el => el.user_id === item.id);
    const selectedJobReq = allJobRequestsProviders[currentPos];

    if (selectedJobReq?.user_details)
      return (
        <TouchableOpacity
          key={index}
          style={styles.itemMainContainer}
          onPress={() => {
            dispatchSelectedJobRequest(selectedJobReq);
            if (selectedJobReq.status === 'Pending')
              navigation.navigate('ProAcceptRejectJob', {
                currentPos: currentPos,
                orderId: item.orderId,
              });
            else
              navigation.navigate('ProChat', {
                currentPos,
                receiverId: item.id,
                receiverName: item.name,
                receiverImage: item.image,
                orderId: item.orderId,
                serviceName: item.serviceName,
                pageTitle: 'ProAllMessage',
                imageAvailable: item.imageAvailable
              });
          }}>
          <View style={styles.itemImageView}>
            <Image
              style={{ width: 40, height: 40, borderRadius: 100 }}
              source={
                item.image && item.imageExists
                  ? { uri: item.image }
                  : require('../../images/generic_avatar.png')
              }
            />
          </View>
          <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
            <Text
              style={{
                fontSize: 14,
                color: 'black',
                textAlignVertical: 'center',
              }}>
              {item.name}
            </Text>
            <Text
              style={{
                width: screenWidth - 150,
                fontSize: 10,
                color: 'black',
                textAlignVertical: 'center',
                color: 'gray',
                marginTop: 3,
              }}
              numberOfLines={2}>
              {item.textMessage}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignContent: 'center',
            }}>
            <Text style={{ alignSelf: 'flex-end', marginRight: 20, fontSize: 8 }}>
              {item.date}
            </Text>
          </View>
        </TouchableOpacity>
      );
    return <View key={index}></View>
  };

  searchTask = textInput => {
    let text = textInput.toLowerCase();
    let tracks = _.cloneDeep(this.props.messagesInfo.latestChats);
    let filterTracks = tracks.filter(item => {
      if (item.name.toLowerCase().match(text)) {
        this.setState({
          isDataMatch: true,
        });
        return item;
      }
    });
    this.setState({ dataSource: filterTracks });
  };

  render() {
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View
          style={[
            styles.header,
            { borderBottomWidth: 1, borderBottomColor: themeRed },
          ]}><ProHamburger fix={true} text="Messages" /></View>
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            height: 55,
            backgroundColor: themeRed,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 5,
            paddingBottom: 5,
          }}>
          <View
            style={{
              flexDirection: 'row',
              width: screenWidth - 40,
              height: 45,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 5,
              backgroundColor: 'white',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.75,
              shadowRadius: 5,
              elevation: 5,
            }}>
            <Image
              style={{ width: 15, height: 15, marginLeft: 20 }}
              source={require('../../icons/search.png')}
            />
            <TextInput
              style={{
                width: screenWidth - 60,
                height: 45,
                fontWeight: 'bold',
                marginLeft: 10,
              }}
              placeholder="search..."
              onChangeText={inputText => this.searchTask(inputText)}
            />
          </View>
        </View>

        {this.state.dataSource.length !== 0 && <ScrollView
          contentContainerStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            alwaysBounceVertical: true,
          }}>
          <View style={styles.listView}>
            {this.state.dataSource.map(this.renderRecentMessageItem)}
          </View>
        </ScrollView>}

        {this.state.dataSource.length == 0 && !this.state.isLoading && (
          <View style={styles.noDataStyle}>
            <Text style={{ color: 'black', fontSize: 20 }}>
              You have no messages!
            </Text>
          </View>
        )}

        {this.state.isLoading && (
          <View style={styles.loaderStyle}>
            <ActivityIndicator style={{ height: 80 }} color="#C00" size="large" />
          </View>
        )}
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    jobsInfo: state.jobsInfo,
    generalInfo: state.generalInfo,
    userInfo: state.userInfo,
    messagesInfo: state.messagesInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchNotifications: data => {
      dispatch(startFetchingNotification(data));
    },
    fetchedNotifications: data => {
      dispatch(notificationsFetched(data));
    },
    fetchingNotificationsError: error => {
      dispatch(notificationError(error));
    },
    fetchingPendingJobInfo: () => {
      dispatch(startFetchingJobProvider());
    },
    fetchingPendingJobInfoError: error => {
      dispatch(fetchProviderJobInfoError(error));
    },
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    },
    updateLatestChats: data => {
      dispatch(updateLatestChats(data));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProAllMessageScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightGray,
  },
  listView: {
    flex: 1,
    width: screenWidth,
    backgroundColor: lightGray,
    padding: 5,
  },
  itemMainContainer: {
    height: 70,
    flexDirection: 'row',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    marginVertical: 2,
    borderRadius: 5,
    elevation: 5,
    padding: 5,
  },
  itemImageView: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 5,
  },
  noDataStyle: {
    height: screenHeight - 105,
    backgroundColor: lightGray,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  animatedView: {
    width: screenWidth,
    backgroundColor: colorBg,
    elevation: 2,
    position: 'absolute',
    bottom: 0,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  exitTitleText: {
    textAlign: 'center',
    color: 'white',
    marginRight: 20,
  },
  exitText: {
    color: 'red',
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
