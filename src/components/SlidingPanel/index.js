import { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Image, Dimensions, LayoutAnimation } from "react-native";
import {
    black, white,
} from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
//const screenHeight = Dimensions.get('window').height;

export default function SlidingPanel({
    containerStyle,
    headerLayoutHeight,
    headerLayout,
    slidingPanelLayout
}) {
    const [panelStatus, setPanelStatus] = useState('closed');

    const togglePanel = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        if (panelStatus === 'closed') return setPanelStatus('open');
        return setPanelStatus('closed');
    }
    return (<View style={containerStyle || styles.container}>
        {!headerLayout && <TouchableOpacity
            style={styles.panelToggle}
            onPress={togglePanel}>
            <Image
                style={{
                    width: 20,
                    height: 20,
                    tintColor: black,
                    alignSelf: 'center',
                }}
                source={require('../../icons/up_arrow.gif')}
            />
        </TouchableOpacity>}
        <View style={[styles.headerContainer, { height: headerLayoutHeight }]}>
            {headerLayout(togglePanel, panelStatus)}
        </View>
        {panelStatus === 'open' && <View style={styles.bodyContainer}>
            {slidingPanelLayout()}
        </View>}
    </View>)
}

export const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        bottom: 0,
        zIndex: 100,
        elevation: 100,
        width: screenWidth,
        backgroundColor: white
    },
    panelToggle: {
        height: 35, justifyContent: 'center'
    },
    headerContainer: {
    },
    bodyContainer: {
        height: 70
    }
});
