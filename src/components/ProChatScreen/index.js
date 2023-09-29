import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  BackHandler,
  ImageBackground,
  RefreshControl,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { cloneDeep } from 'lodash';
import {
  dbMessagesFetched,
  fetchEmployeeMessages,
} from '../../Redux/Actions/messageActions';
import Config from '../Config';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {
  startFetchingMessages,
  messagesFetched,
  messagesError,
} from '../../Redux/Actions/messageActions';
import {
  attachFile,
  sendMessageTask,
  setOnlineStatusListener,
  deregisterOnlineStatusListener,
} from '../../controllers/chats';
import { lightGray, colorBg, white } from '../../Constants/colors';
import {
  MessagesView,
  MessagesHeader,
  MessagesFooter,
} from '../ProMessagesComponents';
import { fetchEmployeeUserChats } from '../../misc/helpers';

const screenWidth = Dimensions.get('window').width;
const socket = Config.socket;
const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;

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

class ProChatScreen extends Component {
  constructor(props) {
    super();
    const {
      messagesInfo: { fetchedDBMessages },
      jobsInfo: {
        selectedJobRequest,
      },
      route,
      userInfo: { providerDetails },
      generalInfo: { OnlineUsers },
    } = props;
    const { user_id } = selectedJobRequest;
    this.state = {
      showButton: false,
      senderId: providerDetails.providerId,
      senderName: providerDetails.name + ' ' + providerDetails.surname,
      senderImage: providerDetails.image,
      inputMessage: '',
      showButton: false,
      isLoading: !fetchedDBMessages,
      pageTitle: route.params.pageTitle,
      receiverId: selectedJobRequest.user_id,
      receiverName: selectedJobRequest.user_details.username,
      receiverImage: selectedJobRequest.user_details.image,
      orderId: selectedJobRequest.order_id,
      serviceName:
        selectedJobRequest.service_details.service_name,
      userImageAvailable: selectedJobRequest.imageAvailable,
      customer_FCM_id: selectedJobRequest.user_details.fcm_id,
      selectedStatus: '0',
      liveChatStatus: OnlineUsers[user_id] ? OnlineUsers[user_id].status : '0',
      online: false,
      filteredMessages: undefined,
      uploadingImage: false,
      metaData: {}
    };
  }

  async componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', () =>
      this.handleBackButtonClick(),
    );
    const {
      navigation,
      generalInfo: { OnlineUsers },
      jobsInfo: {
        selectedJobRequest: { user_id },
      },
    } = this.props;
    this._unsubscribe = navigation.addListener('focus', this.init);
    setOnlineStatusListener({
      OnlineUsers,
      userId: user_id,
      setStatus: (selectedStatus, online) =>
        this.setState({
          selectedStatus,
          online,
        }),
    });
  }

  componentWillUnmount() {
    const {
      jobsInfo: {
        selectedJobRequest: { user_id },
      }
    } = this.props;
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    this._unsubscribe();
    deregisterOnlineStatusListener(user_id);
  }

  init = async (refetchMessages = true) => {
    const {
      messagesInfo: { fetchedDBMessages },
      route,
      jobsInfo: {
        selectedJobRequest
      },
      generalInfo: { OnlineUsers },
      userInfo: { providerDetails },
    } = this.props;
    if (!socket.connected) {
      socket.connect();
    }
    const { user_id } = selectedJobRequest;
    this.setState({
      showButton: false,
      senderId: providerDetails.providerId,
      senderName: providerDetails.name + ' ' + providerDetails.surname,
      senderImage: providerDetails.image,
      inputMessage: '',
      showButton: false,
      isLoading: !fetchedDBMessages,
      //From ProDashboardScreen && ProMapDirection
      pageTitle: route.params.pageTitle,
      receiverId: selectedJobRequest.user_id,
      receiverName: selectedJobRequest.user_details.username,
      receiverImage: selectedJobRequest.user_details.image,
      orderId: selectedJobRequest.order_id,
      serviceName:
        selectedJobRequest.service_details.service_name,
      userImageAvailable: selectedJobRequest.imageAvailable,
      customer_FCM_id: selectedJobRequest.user_details.fcm_id,
      liveChatStatus: OnlineUsers[user_id] ? OnlineUsers[user_id].status : '0',
    });
    refetchMessages && await this.fetchUserChatsLocal(1, 10);
  };

  async componentDidUpdate() {
    const {
      messagesInfo: { fetchedDBMessages },
      jobsInfo: {
        selectedJobRequest: { user_id },
      },
      generalInfo: { OnlineUsers },
    } = this.props;
    const { liveChatStatus, selectedStatus, isLoading, receiverId } = this.state;
    if (fetchedDBMessages && isLoading) this.setState({ isLoading: false });
    if (!isLoading && !receiverId) await this.init(false);
    if (
      OnlineUsers[user_id] &&
      liveChatStatus !== OnlineUsers[user_id].status
    ) {
      this.setState({
        online: OnlineUsers[user_id].status === '1' && selectedStatus === '1',
        liveChatStatus: OnlineUsers[user_id].status,
      });
    }
  }

  fetchUserChatsLocal = async (page, limit) => {
    const {
      dbMessagesFetched,
      userInfo: { providerDetails },
      jobsInfo: {
        selectedJobRequest: { user_id },
      },
      messagesInfo,
    } = this.props;
    await fetchEmployeeUserChats({ primary: providerDetails.providerId, page, secondary: user_id, limit }, (chatData, metaData) => {
      const newMessages = cloneDeep(messagesInfo.messages);
      newMessages[user_id] = chatData;
      this.setState({ metaData, isLoading: false });
      dbMessagesFetched({ data: newMessages, metaData });
    });
  }

  updateUserChatsLocal = async (page, limit) => {
    const {
      dbMessagesFetched,
      userInfo: { providerDetails },
      jobsInfo: {
        selectedJobRequest: { user_id },
      },
      messagesInfo,
    } = this.props;
    await fetchEmployeeUserChats({ primary: providerDetails.providerId, secondary: user_id, page, limit }, (chatData, metaData) => {
      const newMessages = cloneDeep(messagesInfo.messages);
      newMessages[user_id] = [...chatData, ...newMessages[user_id]];
      this.setState({ metaData, isLoading: false });
      dbMessagesFetched({ data: newMessages, metaData });
    });
  }

  handleBackButtonClick = () => {
    const { pageTitle } = this.state;
    const { navigation } = this.props;
    if (pageTitle === 'ProMapDirection')
      navigation.navigate('ProMapDirection');
    else if (pageTitle === 'ProHome')
      navigation.navigate('ProHome', { from: 'ProChat' });
    else if (pageTitle === 'ProAllMessage')
      navigation.goBack();
    else this.props.navigation.goBack();
    return true;
  };

  showHideButton = input => {
    this.setState({
      inputMessage: input,
    });
    if (input === '') {
      this.setState({
        showButton: false,
      });
    } else {
      this.setState({
        showButton: true,
      });
    }
  };

  attachFileProvider = async () =>
    await attachFile({
      senderId: this.state.senderId,
      receiverId: this.state.receiverId,
      dbMessagesFetched: this.props.dbMessagesFetched,
      messagesInfo: this.props.messagesInfo,
      sendMessageTask: this.sendMessageTaskProvider,
      clearInput: () =>
        this.setState({
          inputMessage: '',
          showButton: false,
        }),
      toggleUploadingImage: bool =>
        this.setState(prevState => ({
          uploadingImage:
            typeof bool === 'boolean' ? bool : !prevState.uploadingImage,
        })),
    });

  sendMessageTaskProvider = async (type = 'text', altMessage) =>
    await sendMessageTask({
      type,
      userType: 'employee',
      userId: this.props?.userInfo?.providerDetails?.providerId,
      inputMessage: this.state.inputMessage,
      senderId: this.state.senderId,
      senderName: this.state.senderName,
      senderImage: this.state.senderImage,
      receiverId: this.state.receiverId,
      receiverName: this.state.receiverName,
      receiverImage: this.state.receiverImage,
      fcm_id: this.state.customer_FCM_id,
      serviceName: this.state.serviceName,
      orderId: this.state.orderId,
      altMessage,
      fetchMessages: this.props.fetchEmployeeMessages,
      dbMessagesFetched: this.props.dbMessagesFetched,
      messagesInfo: this.props.messagesInfo,
      toggleIsLoading: bool =>
        this.setState(prevState => ({
          isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
        })),
      clearInput: () =>
        this.setState({
          inputMessage: '',
          showButton: false,
        }),
    });

  showToast = (message, duration) => {
    if (
      typeof duration === 'number' ||
      duration === Toast.LONG ||
      duration === Toast.SHORT
    )
      Toast.show(message, duration);
    else Toast.show(message);
  };

  loadMoreMessages = async () => {
    const { metaData: { page, pages, limit } } = this.state;
    if (pages > 1) {
      this.setState({ isLoading: true });
      await this.updateUserChatsLocal((Number(page)) + 1, limit);
    }
  }

  renderSeparator = () => {
    return <View style={{ height: 5, width: '100%' }} />;
  };

  render() {
    const {
      showButton,
      online,
      senderId,
      receiverId,
      receiverName,
      uploadingImage,
      filteredMessages,
      receiverImage,
      isLoading,
      userImageAvailable,
      metaData,
    } = this.state;
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={ios ? 'padding' : null}>
        <StatusBarPlaceHolder />
        <MessagesHeader
          online={online}
          receiverImage={receiverImage}
          receiverName={receiverName}
          imageAvailable={userImageAvailable}
          handleBackButtonClick={this.handleBackButtonClick}
        />
        <ImageBackground
          style={styles.subContainer}
          source={require('../../icons/bg_chat.png')}>
          <ScrollView
            ref={ref => (this.scrollView = ref)}
            contentContainerStyle={{
              justifyContent: 'center',
              alignItems: 'center',
              alwaysBounceVertical: true,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={this.loadMoreMessages}
              />}
            onContentSizeChange={(contentWidth, contentHeight) => {
              this.scrollView.scrollToEnd({ animated: true });
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <View style={{ flexDirection: 'column', marginBottom: 45 }}>
              <MessagesView
                senderId={senderId}
                receiverId={receiverId}
                filteredMessages={filteredMessages}
                meta={metaData}
                uploadingImage={uploadingImage}
                messagesInfo={this.props.messagesInfo}
              />
            </View>
          </ScrollView>
          <View style={styles.footerContainer}>
            <MessagesFooter
              inputMesage={this.state.inputMessage}
              textChangeAction={inputMesage => this.showHideButton(inputMesage)}
              attachFileTask={this.attachFileProvider}
              sendMessageTask={this.sendMessageTaskProvider}
              showButton={showButton}
            />
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg,
  },
  subContainer: {
    backgroundColor: colorBg,
    flex: 1,
  },
  listView: {
    flex: 1,
    padding: 5,
  },
  footerContainer: {
    width: screenWidth,
    minHeight: 50,
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'absolute', //Footer
    marginBottom: 0,
    bottom: 0, //Footer
  },
  itemLeftChatContainer: {
    maxWidth: screenWidth / 2 + 30,
    flexDirection: 'row',
    backgroundColor: lightGray,
    padding: 10,
    borderRadius: 5,
    alignContent: 'center',
  },
  itemChatImageView: {
    width: 20,
    height: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRightChatContainer: {
    maxWidth: screenWidth / 2,
    flexDirection: 'row',
    backgroundColor: '#1E90FF',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    jobsInfo: state.jobsInfo,
    messagesInfo: state.messagesInfo,
    generalInfo: state.generalInfo,
    userInfo: state.userInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchMessages: () => {
      dispatch(startFetchingMessages());
    },
    fetchedMessages: data => {
      dispatch(messagesFetched(data));
    },
    fetchingMessagesError: error => {
      dispatch(messagesError(error));
    },
    fetchNotifications: data => {
      dispatch(startFetchingNotification(data));
    },
    fetchedNotifications: data => {
      dispatch(notificationsFetched(data));
    },
    fetchingNotificationsError: error => {
      dispatch(notificationError(error));
    },
    dbMessagesFetched: messages => {
      dispatch(dbMessagesFetched(messages));
    },
    fetchEmployeeMessages: (receiverId, callBack) => {
      dispatch(fetchEmployeeMessages({ receiverId, callBack }));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProChatScreen);
