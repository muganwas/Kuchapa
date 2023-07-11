import { StyleSheet, Dimensions } from 'react-native';
import { colorBg, themeRed, black, white } from '../../Constants/colors';
const screenWidth = Dimensions.get('screen').width;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg,
  },
  header: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    backgroundColor: themeRed,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  mainContainer: {
    backgroundColor: 'white',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  text: {
    fontSize: 16,
    color: white,
    textAlign: 'center',
    justifyContent: 'center',
  },
  textView: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },

  onlineOfflineView: {
    flex: 1,
    flexDirection: 'row',
    textAlignVertical: 'center',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 10
  },
  onlineOfflineDisplay: {
    width: 20,
    height: 20,
    textAlign: 'center',
    shadowColor: themeRed,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 10,
    marginRight: 10,
    borderRadius: 20,
  },
  timerView: {
    flex: 1,
    height: 65,
    textAlignVertical: 'center',
    color: 'white',
    alignContent: 'center',
    justifyContent: 'center',
  },
  timerTextView: {
    width: 75,
    textAlignVertical: 'center',
    alignSelf: 'flex-end',
    padding: 10,
    borderRadius: 200,
    marginRight: 20,
  },
  timerText: {
    textAlignVertical: 'center',
    textAlign: 'center',
    alignSelf: 'center',
    fontWeight: 'bold',
    color: white,

  },
  bottomView: {
    width: screenWidth,
    flexDirection: 'column',
    backgroundColor: white,
    position: 'absolute',
    bottom: 0,
    shadowColor: black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: screenWidth - 60,
    paddingTop: 10,
    backgroundColor: black,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    borderColor: themeRed,
    borderWidth: 2,
    marginBottom: 10,
    textAlign: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    marginTop: 10,
  },
  loaderStyle: {
    width: screenWidth,
    flexDirection: "row",
    alignItems: 'center',
    height: 65,
    flexDirection: 'row',
    backgroundColor: white,
    position: 'absolute',
    bottom: 0,
    shadowColor: black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  textViewDirection: {
    flexDirection: 'row',
    width: screenWidth,
    height: 50,
    backgroundColor: white,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
});

export default styles;