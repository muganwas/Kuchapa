import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { white, themeRed, colorGreen, black, colorBg } from '../../Constants/colors';
import { font_size } from '../../Constants/metrics';

const screenWidth = Dimensions.get('screen').width;
const defaultWidth = screenWidth - 80;

const DialogComponent = ({
    isDialogVisible,
    transparent = true,
    animation = 'fade',
    changeDialogVisibility,
    width = defaultWidth,
    rightButtonAction,
    leftButtonAction,
    titleText,
    descText,
    leftButtonText = 'Cancel',
    rightButtonText = 'Ok',
    isLoading,
    styles = localStyles
}) => {
    return (
        <Modal transparent={transparent} visible={isDialogVisible} animationType={animation}
            onRequestClose={changeDialogVisibility}>
            <TouchableOpacity activeOpacity={0} disabled={true} style={styles.contentContainer}>
                <View style={[styles.modal, { width }]}>
                    <View style={styles.textView}>
                        <Text style={[styles.text, { fontSize: font_size.sub_header, color: white }]}>{titleText}</Text>
                        <Text style={[styles.text, { color: white, fontSize: 14, textAlign: 'center' }]}>{descText}</Text>
                    </View>
                    <View style={styles.buttonView}>
                        {leftButtonAction && <TouchableOpacity style={styles.touchableHighlight} onPress={leftButtonAction}
                            underlayColor={colorBg}>
                            <Text style={[styles.text, { color: colorGreen }]}>{leftButtonText}</Text>
                        </TouchableOpacity>}
                        {rightButtonAction && <TouchableOpacity style={styles.touchableHighlight} onPress={rightButtonAction}
                            underlayColor={colorBg}>
                            <Text style={[styles.text, { color: themeRed }]}>{rightButtonText}</Text>
                        </TouchableOpacity>}
                    </View>

                    {isLoading && (
                        <View style={styles.loaderStyle}>
                            <ActivityIndicator
                                style={{ height: 80 }}
                                color="#C00"
                                size="large" />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    )
}

const localStyles = StyleSheet.create({

    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modal: {
        height: 180,
        paddingTop: 10,
        alignSelf: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: themeRed,
        borderRadius: 10,
        shadowColor: black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    text: {
        margin: 5,
        fontSize: font_size.sub_header,
        fontWeight: 'bold',
    },
    touchableHighlight: {
        flex: 1,
        backgroundColor: colorBg,
        borderRadius: 10,
        shadowColor: black,
        margin: 5,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    textView: {
        flex: 1,
        alignItems: 'center',
    },
    buttonView: {
        width: '100%',
        flexDirection: 'row',
    },
    loaderStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    },
});

export default DialogComponent;