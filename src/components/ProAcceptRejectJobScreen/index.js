import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  ScrollView,
  Dimensions,
  BackHandler,
  ImageBackground,
  RefreshControl,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { withNavigation } from '@react-navigation/compat';
import Toast from 'react-native-simple-toast';
import {
  dbMessagesFetched,
  fetchEmployeeMessages,
} from '../../Redux/Actions/messageActions';
import { cloneDeep } from 'lodash';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {
  startFetchingJobProvider,
  fetchProviderJobInfoError,
  fetchedJobProviderInfo,
  setSelectedJobRequest,
  fetchedDataWorkSource,
} from '../../Redux/Actions/jobsActions';
import {
  MessagesView,
  MessagesHeader,
  MessagesFooter,
} from '../ProMessagesComponents';
import { fetchEmployeeUserChats } from '../../misc/helpers';
import {
  attachFile,
  sendMessageTask,
  setOnlineStatusListener,
  deregisterOnlineStatusListener,
} from '../../controllers/chats';
import { acceptJobTask, rejectJobTask } from '../../controllers/jobs';
import Config from '../Config';
import { font_size } from '../../Constants/metrics';
import {
  lightGray,
  colorBg,
  white,
  themeRed,
  colorGreen,
  darkGray,
  black,
} from '../../Constants/colors';

const socket = Config.socket;
const screenWidth = Dimensions.get('window').width;
const ios = Platform.OS === 'ios';

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

class ProAcceptRejectJobScreen extends Component {
  constructor() {
    super();
    this.state = {
      online: false,
      receiverName: '',
      receiverImage: '',
      imageAvailable: false,
      isLoading: true,
      receiverId: '',
      filteredMessages: undefined,
      receiverFcmId: '',
      senderId: '',
      showButton: false,
      uploadingImage: false,
      metaData: {}
    };
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    const {
      navigation,
      generalInfo: { OnlineUsers },
      jobsInfo: {
        selectedJobRequest: { user_id },
      }
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
      },
    } = this.props;
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick
    );
    deregisterOnlineStatusListener(user_id);
    this._unsubscribe();
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
      dbMessagesFetched(newMessages);
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
      dbMessagesFetched(newMessages);
    });
  }

  init = async (refetchMessages = true) => {
    const {
      userInfo: { providerDetails },
      jobsInfo: {
        selectedJobRequest
      },
      messagesInfo: { fetchedDBMessages },
      generalInfo: { OnlineUsers },
      route
    } = this.props;
    if (!socket.connected) {
      socket.connect();
    }
    const { user_id } = selectedJobRequest;
    const currRequestPos = route.params.currentPos || 0;
    this.setState({
      senderId: providerDetails?.providerId,
      senderImage: providerDetails?.image,
      senderName: providerDetails?.name,
      senderSurname: providerDetails?.surname,
      inputMessage: '',
      showButton: false,
      isAcceptJob: selectedJobRequest.status === 'Accepted',
      isRejectJob: false,
      isLoading: !fetchedDBMessages,
      isErrorToast: false,
      receiverId: selectedJobRequest.user_id,
      receiverName: selectedJobRequest.name,
      receiverImage: selectedJobRequest.image,
      receiverMobile: selectedJobRequest.mobile,
      receiverDob: selectedJobRequest.dob,
      receiverAddress: selectedJobRequest.address,
      receiverLat: selectedJobRequest.lat,
      receiverLang: selectedJobRequest.lang,
      receiverFcmId: selectedJobRequest.fcm_id,
      orderId: selectedJobRequest.order_id,
      serviceName: selectedJobRequest.service_name,
      mainId: selectedJobRequest.id,
      deliveryAddress: selectedJobRequest.delivery_address,
      deliveryLat: selectedJobRequest.delivery_lat,
      deliveryLang: selectedJobRequest.delivery_lang,
      chatStatus: selectedJobRequest.chat_status,
      status: selectedJobRequest.status,
      imageAvailable:
        selectedJobRequest.imageAvailable || false,
      currRequestPos,
      selectedStatus: '0',
      liveChatStatus: OnlineUsers[user_id] ? OnlineUsers[user_id].status : '0',
      online: false,
    });
    refetchMessages && await this.fetchUserChatsLocal(1, 10);
  };

  async componentDidUpdate() {
    const {
      generalInfo: { OnlineUsers },
      jobsInfo: {
        selectedJobRequest: { user_id },
      },
      messagesInfo: { fetchedDBMessages }
    } = this.props;
    const { liveChatStatus, selectedStatus, isLoading, receiverId } = this.state;
    if (isLoading && fetchedDBMessages)
      this.setState({ isLoading: false });

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

  handleBackButtonClick = () => {
    const { pageTitle } = this.state;
    const { navigation } = this.props;
    if (pageTitle === 'ProMapDirection')
      navigation.navigate('ProMapDirection');
    else if (pageTitle === 'ProHome')
      navigation.navigate('ProDashboard');
    else if (pageTitle === 'ProAllMessage')
      navigation.goBack();
    else navigation.goBack();
    return true;
  };

  renderSeparator = () => {
    return <View style={{ height: 5, width: '100%' }} />;
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
      fcm_id: this.state.receiverFcmId,
      serviceName: this.state.serviceName,
      orderId: this.state.orderId,
      altMessage,
      fetchMessages: this.props.fetchEmployeeMessages,
      dbMessagesFetched: this.props.dbMessagesFetched,
      messagesInfo: this.props.messagesInfo,
      toggleIsLoading: this.changeWaitingDialogVisibility,
      clearInput: () =>
        this.setState({
          inputMessage: '',
          showButton: false,
        }),
    });

  acceptJobTaskProvider = async () =>
    await acceptJobTask({
      receiverId: this.state.receiverId,
      orderId: this.state.orderId,
      fcm_id: this.state.receiverFcmId,
      currRequestPos: this.state.currRequestPos,
      mainId: this.state.mainId,
      providerDetails: this.props?.userInfo?.providerDetails,
      dataWorkSource: this.props?.jobsInfo?.dataWorkSource,
      fetchedDataWorkSource: this.props.fetchedDataWorkSource,
      fetchedPendingJobInfo: this.props.fetchedPendingJobInfo,
      jobRequestsProviders: this.props?.jobsInfo?.jobRequestsProviders,
      toggleIsLoading: this.changeWaitingDialogVisibility,
      onSuccess: () =>
        this.setState({
          isLoading: false,
          isAcceptJob: true,
        }),
      onError: () =>
        this.setState({
          isLoading: false,
          isErrorToast: true,
          isAcceptJob: false,
        }),
    });

  rejectJobTaskProvider = async () =>
    await rejectJobTask({
      receiverId: this.state.receiverId,
      orderId: this.state.orderId,
      fcm_id: this.state.receiverFcmId,
      currRequestPos: this.state.currRequestPos,
      mainId: this.state.mainId,
      providerDetails: this.props?.userInfo?.providerDetails,
      dataWorkSource: this.props?.jobsInfo?.dataWorkSource,
      fetchedDataWorkSource: this.props.fetchedDataWorkSource,
      fetchedPendingJobInfo: this.props.fetchedPendingJobInfo,
      jobRequestsProviders: this.props?.jobsInfo?.jobRequestsProviders,
      navigation: this.props.navigation,
      toggleIsLoading: this.changeWaitingDialogVisibility,
      onSuccess: () =>
        this.setState({
          isLoading: false,
          isRejectJob: true,
        }),
      onError: () =>
        this.setState({
          isLoading: false,
          isErrorToast: true,
          isRejectJob: false,
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

  changeWaitingDialogVisibility = bool => {
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));
  };

  render() {
    const {
      online,
      senderId,
      receiverId,
      imageAvailable,
      receiverImage,
      receiverName,
      uploadingImage,
      filteredMessages,
      isLoading,
      metaData
    } = this.state;
    const {
      messagesInfo,
      navigation: { navigate },
    } = this.props;
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={ios ? 'padding' : null}>
        <StatusBarPlaceHolder />
        <MessagesHeader
          online={online}
          imageAvailable={imageAvailable}
          receiverImage={receiverImage}
          receiverName={receiverName}
          handleBackButtonClick={this.handleBackButtonClick}
        />
        <ImageBackground
          style={{ flex: 1 }}
          source={require('../../icons/bg_chat.png')}>
          <ScrollView
            style={{ marginBottom: 50 }}
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
                filteredMessages={filteredMessages}
                receiverId={receiverId}
                meta={metaData}
                uploadingImage={uploadingImage}
                messagesInfo={messagesInfo}
              />
            </View>
          </ScrollView>
          <View style={styles.footerContainer}>
            {!this.state.isAcceptJob && !this.state.isRejectJob && (
              <View
                style={{
                  flex: 1,
                  width: screenWidth,
                  justifyContent: 'center',
                  backgroundColor: themeRed,
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    marginTop: 10,
                    marginBottom: 10,
                  }}>
                  <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={this.acceptJobTaskProvider}>
                    <Text
                      style={[
                        styles.text,
                        { color: colorGreen, fontWeight: 'bold' },
                      ]}>
                      Accept job
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={this.rejectJobTaskProvider}>
                    <Text
                      style={[
                        styles.text,
                        { color: themeRed, fontWeight: 'bold' },
                      ]}>
                      Reject job
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <MessagesFooter
              inputMesage={this.state.inputMessage}
              textChangeAction={inputMesage => this.showHideButton(inputMesage)}
              attachFileTask={this.attachFileProvider}
              sendMessageTask={this.sendMessageTaskProvider}
              showButton={this.state.showButton}
            />
            {this.state.isAcceptJob && (
              <View
                style={{
                  flexDirection: 'column',
                  width: screenWidth,
                  height: 50,
                  backgroundColor: white,
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
                    navigate('ProMapDirection', {
                      pageTitle: 'ProAcceptRejectJob',
                    })
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
                    Direction
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
  buttonContainer: {
    flex: 1,
    paddingTop: 10,
    flexDirection: 'row',
    backgroundColor: colorBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    justifyContent: 'center',
    marginLeft: 10,
    marginRight: 10,
  },
  sendButtonImg: {
    width: 50,
    height: 30,
    tintColor: darkGray,
    resizeMode: 'contain',
  },
  sendButton: {
    height: 50,
    flexDirection: 'row',
    backgroundColor: lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 10,
    borderRadius: 25,
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    flex: 1,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 4,
    backgroundColor: lightGray,
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 10,
    fontSize: font_size.sub_header,
    marginHorizontal: 5,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 2,
    marginVertical: 5,
  },
  footerContainer: {
    width: screenWidth,
    minHeight: 50,
    flexDirection: 'column',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
  },
  textViewDirection: {
    flexDirection: 'row',
    width: screenWidth,
    height: 50,
    shadowColor: black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: white,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
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
    fetchedPendingJobInfo: info => {
      dispatch(fetchedJobProviderInfo(info));
    },
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    },
    dbMessagesFetched: messages => {
      dispatch(dbMessagesFetched(messages));
    },
    fetchedDataWorkSource: dws => {
      dispatch(fetchedDataWorkSource(dws));
    },
    fetchEmployeeMessages: (receiverId, callBack) => {
      dispatch(fetchEmployeeMessages({ receiverId, callBack }));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigation(ProAcceptRejectJobScreen));
