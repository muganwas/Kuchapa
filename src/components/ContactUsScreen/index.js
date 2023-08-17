import React, { Component } from 'react';
import { View, StyleSheet, Image, Text, Platform, StatusBar, BackHandler } from 'react-native';
import Hamburger from '../Hamburger';
import ProHamburger from '../ProHamburger';
import { white, lightGray, themeRed, black } from '../../Constants/colors';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
    return (
        Platform.OS === 'ios' ?
            <View style={{
                width: "100%",
                height: STATUS_BAR_HEIGHT,
                backgroundColor: white
            }}>
                <StatusBar
                    barStyle="dark-content" />
            </View>
            :
            <StatusBar barStyle='dark-content' backgroundColor={white} />
    );
}

export default class ContactUsScreen extends Component {
    componentDidMount() {
        const { navigation } = this.props;
        BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick = () => {
        this.props.navigation.goBack();
        return true;
    }

    render() {
        const { route } = this.props;
        return (
            <View style={styles.container}>
                <StatusBarPlaceHolder />
                <View
                    style={[
                        styles.header,
                        { borderBottomWidth: 1, borderBottomColor: themeRed },
                    ]}>
                    {route.params.userType === 'customer' ?
                        <Hamburger text="Contact Us" /> :
                        <ProHamburger text="Contact Us" />
                    }
                </View>
                <View style={styles.mainContainer}>
                    <View style={{ flexDirection: 'row', padding: 10, }}>
                        <Image style={{ width: 20, height: 20 }}
                            source={require('../../icons/email.png')}></Image>
                        <Text style={{ marginLeft: 10 }}>kuchapamobileapp@gmail.com</Text>
                    </View>

                    <View style={{ flexDirection: 'row', padding: 10, }}>
                        <Image style={{ width: 20, height: 20 }}
                            source={require('../../icons/mobile.png')}></Image>
                        <Text style={{ marginLeft: 10 }}> +256789244866 </Text>
                    </View>

                    <View style={{ flexDirection: 'row', padding: 10, }}>
                        <Image style={{ width: 20, height: 20 }}
                            source={require('../../icons/maps_location.png')}></Image>
                        <Text style={{ marginLeft: 10 }}>Kuchapa location</Text>
                    </View>

                </View>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: lightGray,
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
    mainContainer: {
        backgroundColor: white,
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        borderRadius: 2,
    }
});