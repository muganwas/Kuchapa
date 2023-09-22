import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  ImageBackground,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { cloneDeep } from 'lodash';
import {
  dbMessagesFetched,
  fetchClientMessages,
} from '../../Redux/Actions/messageActions';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import Config from '../Config';
import { font_size } from '../../Constants/metrics';
import { lightGray, colorBg, white } from '../../Constants/colors';
import {
  MessagesFooter,
  MessagesHeader,
  MessagesView,
} from '../MessagesComponents';
import {
  attachFile,
  sendMessageTask,
  setOnlineStatusListener,
  deregisterOnlineStatusListener,
} from '../../controllers/chats';
import { fetchEmployeeUserChats } from '../../misc/helpers';
import SimpleToast from 'react-native-simple-toast';

const screenWidth = Dimensions.get('window').width;
const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;
const socket = Config.socket;

const StatusBarPlaceHolder = () => {
  return ios ? (
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

class ChatAfterBookingDetailsScreen extends Component {
  constructor(props) {
    super();
    const {
      userInfo: { userDetails },
      jobsInfo: {
        selectedJobRequest: { employee_id },
      },
      messagesInfo: { messages },
    } = props;
    this.state = {
      senderId: userDetails.userId,
      senderImage: userDetails.image,
      senderName: userDetails.username,
      inputMessage: '',
      showButton: false,
      messages,
      isLoading: !props.messagesInfo.fetched,
      isUpLoading: false,
      receiverId: props.route.params.providerId,
      receiverName:
        props.route.params.providerName +
        ' ' +
        props.route.params.providerSurname,
      receiverImage: props.route.params.providerImage,
      imageAvailable: props.route.params.imageAvailable,
      serviceName: props.route.params.serviceName,
      orderId: props.route.params.orderId,
      titlePage: props.route.params.pageTitle,
      isJobAccepted: props.route.params.isJobAccepted,
      provider_FCM_id: props.route.params.fcmId,
      selectedStatus: '0',
      liveChatStatus: '0',
      uploadingImage: false,
      online: false,
      metaData: {}
    };
    this.leftButtonActon = null;
    this.rightButtonAction = null;
  }

  componentDidMount() {
    const {
      jobsInfo: {
        selectedJobRequest: { employee_id },
      },
      generalInfo: { OnlineUsers },
      navigation,
      fetchedNotifications
    } = this.props;
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    this._unsubscribe = navigation.addListener('focus', this.init);
    setOnlineStatusListener({
      OnlineUsers,
      userId: employee_id,
      setStatus: (selectedStatus, online) =>
        this.setState({
          selectedStatus,
          online,
        }),
    });
    fetchedNotifications({ type: 'messages', value: 0 });
  }

  componentWillUnmount() {
    const {
      jobsInfo: {
        selectedJobRequest: { employee_id },
      }
    } = this.props;
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    deregisterOnlineStatusListener(employee_id);
    this._unsubscribe();
  }

  init = async (refetchMessages = true) => {
    const {
      userInfo: { userDetails },
      messagesInfo: { fetched },
      route
    } = this.props;
    if (!socket.connected) {
      socket.connect();
    }
    this.setState({
      senderId: userDetails.userId,
      senderImage: userDetails.image,
      senderName: userDetails.username,
      inputMessage: '',
      showButton: false,
      isLoading: !fetched,
      isUpLoading: false,
      receiverId: route.params.providerId,
      receiverName:
        route.params.providerName +
        ' ' +
        route.params.providerSurname,
      receiverImage: route.params.providerImage,
      imageAvailable: route.params.imageAvailable,
      serviceName: route.params.serviceName,
      orderId: route.params.orderId,
      titlePage: route.params.pageTitle,
      isJobAccepted: route.params.isJobAccepted,
      provider_FCM_id: route.params.fcmId,
    });
    refetchMessages && this.fetchUserChatsLocal(1, 10);
  };

  fetchUserChatsLocal = async (page, limit) => {
    const {
      dbMessagesFetched,
      userInfo: { userDetails },
      jobsInfo: {
        selectedJobRequest: { employee_id },
      },
      messagesInfo,
    } = this.props;
    await fetchEmployeeUserChats({ primary: userDetails.userId, page, secondary: employee_id, limit }, (chatData, metaData) => {
      const newMessages = cloneDeep(messagesInfo.messages);
      newMessages[employee_id] = chatData;
      this.setState({ metaData, isLoading: false });
      dbMessagesFetched(newMessages);
    });
  }

  updateUserChatsLocal = async (page, limit) => {
    const {
      dbMessagesFetched,
      userInfo: { userDetails },
      jobsInfo: {
        selectedJobRequest: { employee_id },
      },
      messagesInfo,
    } = this.props;
    await fetchEmployeeUserChats({ primary: userDetails.userId, secondary: employee_id, page, limit }, (chatData, metaData) => {
      const newMessages = cloneDeep(messagesInfo.messages);
      newMessages[employee_id] = [...chatData, ...newMessages[employee_id]];
      this.setState({ metaData, isLoading: false });
      dbMessagesFetched(newMessages);
    });
  }

  async componentDidUpdate() {
    const {
      messagesInfo: { fetchedDBMessages },
      jobsInfo: {
        selectedJobRequest: { employee_id },
      },
      generalInfo: { OnlineUsers },
    } = this.props;
    const { liveChatStatus, selectedStatus, isLoading, receiverId } = this.state;
    const providerId = employee_id;
    if (fetchedDBMessages && isLoading) this.setState({ isLoading: false });
    if (!isLoading && !receiverId) await this.init(false);
    if (
      OnlineUsers[providerId] &&
      liveChatStatus !== OnlineUsers[providerId].status
    ) {
      this.setState({
        online:
          OnlineUsers[providerId].status === '1' && selectedStatus === '1',
        liveChatStatus: OnlineUsers[providerId].status,
      });
    }
  }

  handleBackButtonClick = () => {
    const { titlePage } = this.state;
    const { navigation } = this.props;
    if (titlePage === 'MapDirection')
      navigation.navigate('MapDirection', {
        titlePage: 'Chat',
      });
    else if (titlePage === 'Dashboard')
      navigation.navigate('Home');
    else if (titlePage === 'ProviderDetails')
      navigation.navigate('ProviderDetails');
    else if (titlePage === 'AllMessage') navigation.goBack();
    else navigation.goBack();
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

  attachFileCustomer = async () =>
    await attachFile({
      senderId: this.state.senderId,
      receiverId: this.state.receiverId,
      dbMessagesFetched: this.props.dbMessagesFetched,
      messagesInfo: this.props.messagesInfo,
      sendMessageTask: this.sendMessageTask,
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

  sendMessageTask = async (type = 'text', altMessage) =>
    await sendMessageTask({
      type,
      userType: 'client',
      userId: this.props?.userInfo?.userDetails?.userId,
      inputMessage: this.state.inputMessage,
      senderId: this.state.senderId,
      senderName: this.state.senderName,
      senderImage: this.state.senderImage,
      receiverId: this.state.receiverId,
      receiverName: this.state.receiverName,
      receiverImage: this.state.receiverImage,
      fcm_id: this.state.provider_FCM_id,
      serviceName: this.state.serviceName,
      orderId: this.state.orderId,
      altMessage,
      fetchMessages: this.props.fetchClientMessages,
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

  loadMoreMessages = async () => {
    const { metaData: { page, pages, limit } } = this.state;
    if (pages > 1) {
      this.setState({ isLoading: true });
      await this.updateUserChatsLocal((Number(page)) + 1, limit);
    }
  }

  showToast = (message, duration) => {
    if (
      typeof duration === 'number' ||
      duration === SimpleToast.LONG ||
      duration === SimpleToast.SHORT
    )
      SimpleToast.show(message, duration);
    else SimpleToast.show(message);
  };

  renderSeparator = () => {
    return <View style={{ height: 5, width: '100%' }} />;
  };

  render() {
    const { messagesInfo } = this.props;
    const {
      showButton,
      receiverImage,
      receiverId,
      senderId,
      receiverName,
      imageAvailable,
      online,
      isLoading,
      uploadingImage,
      metaData
    } = this.state;
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={ios ? 'padding' : null}>
        <StatusBarPlaceHolder />
        <ImageBackground
          style={styles.container}
          source={require('../../icons/bg_chat.png')}>
          <MessagesHeader
            receiverImage={receiverImage}
            imageAvailable={imageAvailable}
            receiverName={receiverName}
            online={online}
            handleBackButtonClick={this.handleBackButtonClick}
          />
          <ScrollView
            ref={ref => (this.scrollView = ref)}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={this.loadMoreMessages}
              />}
            contentContainerStyle={{
              justifyContent: 'center',
              alignItems: 'center',
              alwaysBounceVertical: true,
            }}
            onContentSizeChange={(contentWidth, contentHeight) => {
              this.scrollView.scrollToEnd({ animated: true });
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <MessagesView
              receiverId={receiverId}
              senderId={senderId}
              meta={metaData}
              uploadingImage={uploadingImage}
              messagesInfo={messagesInfo}
            />
          </ScrollView>
          <View style={styles.footerContainer}>
            <MessagesFooter
              sendMessageTask={this.sendMessageTask}
              attachFileTask={this.attachFileCustomer}
              showButton={showButton}
              textChangeAction={inputMesage => this.showHideButton(inputMesage)}
              inputMesage={this.state.inputMessage}
            />
            {this.state.isJobAccepted && (
              <View
                style={{
                  flexDirection: 'column',
                  width: screenWidth,
                  height: 50,
                  backgroundColor: 'white',
                  borderRadius: 2,
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}>
                <View
                  style={{
                    width: screenWidth,
                    height: 1,
                    backgroundColor: lightGray,
                  }}
                />
                <TouchableOpacity
                  style={styles.textViewDirection}
                  onPress={() =>
                    this.props.navigation.navigate('MapDirection')
                  }>
                  <Image
                    style={{ width: 20, height: 20, marginLeft: 20 }}
                    source={require('../../icons/mobile_gps.png')}
                  />
                  <Text
                    style={{
                      color: 'black',
                      fontWeight: 'bold',
                      fontSize: font_size.sub_header,
                      textAlign: 'center',
                      marginLeft: 10,
                    }}>
                    Tracking service provider
                  </Text>
                  <Image
                    style={{
                      width: 20,
                      height: 20,
                      marginLeft: 20,
                      position: 'absolute',
                      end: 0,
                      marginRight: 15,
                    }}
                    source={require('../../icons/right_arrow.png')}
                  />
                </TouchableOpacity>
              </View>
            )}
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
  listView: {
    flex: 1,
    padding: 5,
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
  footerContainer: {
    width: screenWidth,
    minHeight: 50,
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'absolute', //Footer
    bottom: 0, //Footer
  },
  textViewDirection: {
    flexDirection: 'row',
    width: screenWidth,
    height: 50,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  recievedContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  recievedMsg: {
    margin: 3,
    padding: 3,
    borderRadius: 3,
    color: '#000',
    textAlign: 'left',
    backgroundColor: '#16B5F3',
  },
  sentContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  sentMsg: {
    margin: 3,
    padding: 3,
    borderRadius: 3,
    textAlign: 'right',
    color: '#000',
    backgroundColor: '#ffffff',
  },
  messagesContainer: {
    height: '100%',
    minHeight: 100,
    padding: 10,
    height: 200,
  },
  messagesSubContainer: {
    display: 'flex',
    flex: 1,
    width: '100%',
    flexDirection: 'column',
  },
});

const mapStateToProps = state => {
  return {
    messagesInfo: state.messagesInfo,
    jobsInfo: state.jobsInfo,
    generalInfo: state.generalInfo,
    userInfo: state.userInfo,
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
    dbMessagesFetched: messages => {
      dispatch(dbMessagesFetched(messages));
    },
    fetchClientMessages: (senderId, callBack) => {
      dispatch(fetchClientMessages({ senderId, callBack }));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChatAfterBookingDetailsScreen);
