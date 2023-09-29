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
  RefreshControl,
  BackHandler,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import _ from 'lodash';
import SimpleToast from 'react-native-simple-toast';
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
import { fetchJobInfo } from '../../controllers/jobs';
import Config from '../Config';
import { updateLatestChats } from '../../Redux/Actions/messageActions';
import { colorBg, white, themeRed, darkGray, lightGray } from '../../Constants/colors';
import { font_size, spacing } from '../../Constants/metrics';
import { getMoreRecentChats } from '../../controllers/chats';

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
      messagesInfo: { latestChats, fetchedLatestChats },
    } = this.props;
    this.setState({ dataSource: latestChats, isLoading: !fetchedLatestChats });
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
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
  }

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
  };

  gotToChat = async ({ selectedJobReq, item, index }) => {
    const {
      dispatchSelectedJobRequest,
      navigation,
      userInfo: { providerDetails: { providerId } }
    } = this.props;
    if (!selectedJobReq) {
      this.setState({ isLoading: true });
      selectedJobReq = await fetchJobInfo({
        jobFetchURL: Config.baseURL + 'jobrequest/job_details?orderId=' + item.orderId + "&employeeId=" + providerId + "&userId=" + item.id + "&userType=Employee"
      });
    }
    await dispatchSelectedJobRequest(selectedJobReq);
    this.setState({ isLoading: false })
    if (selectedJobReq.status == 'Pending' || selectedJobReq.status == 'Accepted')
      navigation.navigate('ProAcceptRejectJob', {
        currentPos: index,
        orderId: item.orderId,
      });
    else
      navigation.navigate('ProChat', {
        currentPos: index,
        receiverId: item.id,
        receiverName: item.name,
        receiverImage: item.image,
        orderId: item.orderId,
        serviceName: item.serviceName,
        pageTitle: 'ProAllMessage',
        imageAvailable: item.imageAvailable
      });
  }

  getMoreRecentChatsLocal = async () => {
    const { messagesInfo: { latestChatsMeta: { page, limit } } } = this.props;
    this.setState({ isLoading: true });
    await getMoreRecentChats({
      id: this.props?.userInfo?.providerDetails?.providerId,
      page: Number(page) + 1,
      limit,
      dataSource: this.props?.messagesInfo?.latestChats,
      onSuccess: (data, metaData) => {
        this.props.updateLatestChats({ data, metaData });
        this.setState({ isLoading: false });
      },
      onError: ((e) => {
        SimpleToast.show(e);
        this.setState({ isLoading: false });
      })
    });
  }

  renderRecentMessageItem = (item, index) => {
    const {
      jobsInfo: { jobRequestsProviders }
    } = this.props;
    const currentPos = jobRequestsProviders.findIndex(el => el.user_id === item.id);
    const selectedJobReq = jobRequestsProviders[currentPos];
    return (
      <TouchableOpacity
        key={index}
        style={styles.itemMainContainer}
        onPress={() => this.gotToChat({ selectedJobReq, item, index: currentPos })}>
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
    const { messagesInfo: { latestChatsMeta: { totalPages, page } } } = this.props;
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
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.isLoading}
              onRefresh={this.getMoreRecentChatsLocal}
            />}
          contentContainerStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            alwaysBounceVertical: true,
          }}>
          {totalPages / page > 1 ? <View style={{ display: 'flex', flex: 1, padding: spacing.small, alignItems: 'center' }}>
            <Text style={{ fontSize: font_size.small, color: darkGray, textAlign: 'center' }}>Pull down to load more</Text>
          </View> : <></>}
          <View style={styles.listView}>
            {this.state.dataSource.length !== 0 && this.state.dataSource.map(this.renderRecentMessageItem)}
          </View>
        </ScrollView>

        {this.state.dataSource.length == 0 && !this.state.isLoading && (
          <View style={styles.noDataStyle}>
            <Text style={{ color: 'black', fontSize: 20 }}>
              You have no messages!
            </Text>
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
