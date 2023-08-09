import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { notificationsFetched } from '../../Redux/Actions/notificationActions';
import { DrawerActions } from '@react-navigation/native';
import DialogLogout from '../DialogLogout';
import { imageExists as imgExists } from '../../misc/helpers';
import { black, lightGray, themeRed, white } from '../../Constants/colors';

function CustomMenuLayout(props) {
  const notificationsInfo = useSelector(state => state.notificationsInfo);
  const { userDetails } = useSelector(state => state.userInfo);
  const dispatch = useDispatch();

  const [imageExists, updateImageExists] = useState(true);
  const [name] = useState(userDetails.username);
  const [isDialogLogoutVisible, updateIsDialogLogoutVisible] = useState(false);
  const [imageSource] = useState(userDetails.imageSource);

  useEffect(() => {
    getImageExists(userDetails);
  }, [userDetails]);

  const getImageExists = async (userDetails) => {
    const result = await imgExists(userDetails.imageSource);
    updateImageExists(result);
  }

  const changeDialogVisibility = bool => {
    props.navigation.dispatch(DrawerActions.closeDrawer());
    updateIsDialogLogoutVisible(bool);
  };

  return (
    <TouchableOpacity activeOpacity={1} style={styles.drawerTransparent}>
      <TouchableOpacity activeOpacity={1} style={styles.drawer}>
        <ScrollView>
          <View style={styles.header}>
            <Image
              source={
                imageExists
                  ? { uri: imageSource }
                  : require('../../images/generic_avatar.png')
              }
              style={styles.headerImage}
            />
            <Text
              style={{
                fontSize: 12,
                color: black,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 5,
              }}>
              Welcome
            </Text>
            <Text style={[styles.textHeader, { color: black }]}>
              {name}
            </Text>
          </View>
          <TouchableOpacity
            underlayColor={'rgba(0,0,0,0.2)'}
            style={styles.menuButton}
            onPress={() => {
              props.navigation.navigate('Dashboard');
              props.navigation.dispatch(DrawerActions.closeDrawer());
            }}>
            <View style={styles.row}>
              <Image
                source={require('../../icons/ic_home_64dp.png')}
                style={styles.menuImage}
              />
              <Text style={styles.textMenu}>Dashboard</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            underlayColor={'rgba(0,0,0,0.2)'}
            style={styles.menuButton}
            onPress={() => {
              props.navigation.navigate('MyProfile');
              props.navigation.dispatch(DrawerActions.closeDrawer());
            }}>
            <View style={styles.row}>
              <Image
                source={require('../../icons/ic_user_64dp.png')}
                style={styles.menuImage}
              />
              <Text style={styles.textMenu}>My Profile</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            underlayColor={'rgba(0,0,0,0.2)'}
            style={styles.menuButton}
            onPress={() => {
              props.navigation.navigate('Booking');
              props.navigation.dispatch(DrawerActions.closeDrawer());
            }}>
            <View style={styles.row}>
              <Image
                source={require('../../icons/booking_history.png')}
                style={styles.menuImage}
              />
              <Text style={styles.textMenu}>Bookings</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            underlayColor={'rgba(0,0,0,0.2)'}
            style={styles.menuButton}
            onPress={() => {
              dispatch(notificationsFetched({ type: 'generic', value: 0 }));
              props.navigation.navigate('Notifications');
              props.navigation.dispatch(DrawerActions.closeDrawer());
            }}>
            <View style={styles.row}>
              <Image
                source={require('../../icons/ic_notification.png')}
                style={styles.menuImage}
              />
              <Text style={styles.textMenu}>Notifications</Text>
              {notificationsInfo.generic > 0 ? (
                <Text style={styles.menuNotifications}>
                  {notificationsInfo.generic}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            underlayColor={'rgba(0,0,0,0.2)'}
            style={styles.menuButton}
            onPress={() => {
              dispatch(notificationsFetched({ type: 'messages', value: 0 }));
              props.navigation.navigate('AllMessage');
              props.navigation.dispatch(DrawerActions.closeDrawer());
            }}>
            <View style={styles.row}>
              <Image
                source={require('../../icons/message.png')}
                style={styles.menuImage}
              />
              <Text style={styles.textMenu}>Messages</Text>
              {notificationsInfo.messages > 0 ? (
                <Text style={styles.menuNotifications}>
                  {notificationsInfo.messages}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            underlayColor={'rgba(0,0,0,0.2)'}
            style={styles.menuButton}
            onPress={() => props.navigation.navigate('ContactUs', {
              userType: 'customer'
            })}>
            <View style={styles.row}>
              <Image
                source={require('../../icons/ic_contact_us_64dp.png')}
                style={styles.menuImage}
              />
              <Text style={styles.textMenu}>Contact Us</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            underlayColor={'rgba(0,0,0,0.2)'}
            style={styles.menuButton}
            onPress={() => changeDialogVisibility(true)}>
            <View style={styles.row}>
              <Image
                source={require('../../icons/ic_logout.png')}
                style={styles.menuImage}
              />
              <Text style={styles.textMenu}>Log out</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            underlayColor={'rgba(0,0,0,0.2)'}
            style={{ flex: 1, display: 'flex', height: 100 }}>
          </TouchableOpacity>
          <DialogLogout
            isDialogLogoutVisible={isDialogLogoutVisible}
            navigation={props.navigation}
            changeDialogVisibility={changeDialogVisibility}
          />
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  drawerTransparent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  drawer: {
    flex: 1,
    width: '100%',
    backgroundColor: lightGray,
  },
  header: {
    width: '100%',
    height: 150,
    backgroundColor: white,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: themeRed,
  },
  headerImage: {
    width: 80,
    height: 80,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuNotifications: {
    position: 'absolute',
    textAlignVertical: 'center',
    textAlign: 'center',
    borderRadius: 12,
    color: themeRed,
    right: 10,
    top: 15,
    height: 24,
    width: 24,
    backgroundColor: white,
  },
  textHeader: {
    fontSize: 18,
    color: '#111',
    fontWeight: 'bold',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  menuImage: {
    width: 20,
    height: 20,
    tintColor: white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  menuButton: {
    backgroundColor: themeRed,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  textMenu: {
    fontSize: 16,
    color: white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingLeft: 10,
  },
  line: {
    width: '90%',
    alignSelf: 'center',
    height: 1,
    backgroundColor: 'gray',
    margin: 15,
  },
});

// const mapStateToProps = state => {
//   return {
//     notificationsInfo: state.notificationsInfo,
//     userInfo: state.userInfo,
//   };
// };

// const mapDispatchToProps = dispatch => {
//   return {
//     fetchedNotifications: data => {
//       dispatch(notificationsFetched(data));
//     },
//   };
// };

export default CustomMenuLayout;
