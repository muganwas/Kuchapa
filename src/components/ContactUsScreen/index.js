import React, { Component } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, Platform, StatusBar, BackHandler } from 'react-native';
import { black, colorPrimary, white, themeRed, lightGray } from '../../Constants/colors';

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
        navigation.addListener('willFocus', async () => {
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    handleBackButtonClick = () => {
        this.props.navigation.goBack();
        return true;
    }

    render() {
        return (
            <View style={styles.container}>
                <StatusBarPlaceHolder />
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