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
} from 'react-native';
import _ from 'lodash';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import { setSelectedJobRequest } from '../../Redux/Actions/jobsActions';
import { updateLatestChats } from '../../Redux/Actions/messageActions';
import Hamburger from '../Hamburger';
import {
  lightGray,
  colorPrimaryDark,
  darkGray,
  white,
  themeRed,
  black
} from '../../Constants/colors';
import { fetchJobInfo } from '../../controllers/jobs';
import { font_size, spacing } from '../../Constants/metrics';
import { getMoreRecentChats } from '../../controllers/chats';
import Config from '../Config';

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

class AllMessageScreen extends Component {
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

  goToChat = async ({ selectedJobReq, item, index }) => {
    const {
      dispatchSelectedJobRequest,
      userInfo: { userDetails: { userId } },
      navigation
    } = this.props;
    if (!selectedJobReq) {
      this.setState({ isLoading: true });
      selectedJobReq = await fetchJobInfo({
        jobFetchURL: Config.baseURL + 'jobrequest/job_details?orderId=' + item.orderId + "&employeeId=" + item.id + "&userId=" + userId + "&userType=Customer"
      });
    }
    await dispatchSelectedJobRequest(selectedJobReq);
    this.setState({ isLoading: false });
    if (selectedJobReq?.status.toLowerCase() === 'pending') {
      navigation.navigate('Chat', {
        providerId: item.id,
        fcmId: selectedJobReq?.employee_details?.fcm_id,
        currentPosition: index,
        providerName: item.name,
        providerSurname: '',
        providerImage: item.image,
        serviceName: item.serviceName,
        orderId: item.orderId,
        pageTitle: 'AllMessage',
        isJobAccepted: false,
      });
    } else {
      navigation.navigate('ChatAfterBookingDetails', {
        providerId: item.id,
        providerName: item.name,
        providerSurname: '',
        providerImage: item.image,
        orderId: item.orderId,
        serviceName: item.serviceName,
        imageAvailable: item.imageExists,
        pageTitle: 'AllMessage',
        fcmId: selectedJobReq?.employee_details?.fcm_id,
      });
    }
  }

  getMoreRecentChatsLocal = async () => {
    const { messagesInfo: { latestChatsMeta: { page, limit } } } = this.props;
    this.setState({ isLoading: true });
    await getMoreRecentChats({
      id: this.props?.userInfo?.userDetails?.userId,
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

  renderRecentMessageItem = (item, status, index) => {
    const {
      jobsInfo: { jobRequests },
    } = this.props;
    const currentPos = jobRequests.findIndex(jobInfo => jobInfo.employee_id === item.id);
    const selectedJobReq = jobRequests[currentPos];
    return (
      <TouchableOpacity
        key={index}
        style={styles.itemMainContainer}
        onPress={() => this.goToChat({ selectedJobReq, item, index: currentPos })}>
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
              color: black,
              textAlignVertical: 'center',
            }}>
            {item.name}
          </Text>
          <Text
            style={{
              width: screenWidth - 150,
              fontSize: 10,
              color: black,
              textAlignVertical: 'center',
              color: 'gray',
              marginTop: 3,
            }}
            numberOfLines={2}>
            {item.textMessage}
          </Text>
        </View>

        <View
          style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
          <Text style={{ alignSelf: 'flex-end', marginRight: 20, fontSize: 8 }}>
            {item.date}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  searchTask = textInput => {
    let text = textInput.toLowerCase();
    let tracks = this.props?.messagesInfo?.latestChats;
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
          ]}>
          <Hamburger fix={true} text="Your Messages" />
        </View>
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
          }}
        >
          {totalPages / page > 1 ? <View style={{ display: 'flex', flex: 1, padding: spacing.small, alignItems: 'center' }}>
            <Text style={{ fontSize: font_size.small, color: darkGray, textAlign: 'center' }}>Pull down to load more</Text>
          </View> : <></>}
          <View style={styles.listView}>
            {this.state.dataSource.length !== 0 && this.state.dataSource.map(this.renderRecentMessageItem)}
          </View>
        </ScrollView>

        {this.state.dataSource.length === 0 && !this.state.isLoading && (
          <View style={styles.noDataStyle}>
            <Text style={{ color: black, fontSize: 20 }}>
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
    userInfo: state.userInfo,
    jobsInfo: state.jobsInfo,
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
)(AllMessageScreen);

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
    marginVertical: 2,
    shadowRadius: 5,
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
    backgroundColor: colorPrimaryDark,
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
  header: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    backgroundColor: white,
    shadowColor: black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
});
