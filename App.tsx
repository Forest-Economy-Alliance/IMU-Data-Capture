import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Button,
  Alert,
  ToastAndroid,
} from 'react-native';

import {FFmpegKit} from 'ffmpeg-kit-react-native';
import {RNCamera} from 'react-native-camera';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import Geolocation from 'react-native-geolocation-service'
import {Platform, PermissionsAndroid} from 'react-native';
import {
  accelerometer,
  gyroscope,
  magnetometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';

import {range, combineLatest} from 'rxjs';
import {map, filter, tap} from 'rxjs/operators';
const App = () => {
  const [sessionStart, setSessionStart] = useState(false);
  const [sessionStartTime,setSessionStartTime] = useState(null);
  const [startVideoTime, setStartVideoTime] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [isCameraOpen, setCameraOpen] = useState(false);
  setUpdateIntervalForType(SensorTypes.accelerometer, 100);
  setUpdateIntervalForType(SensorTypes.gyroscope, 100);
  setUpdateIntervalForType(SensorTypes.magnetometer, 100);
  const [bit, setBit] = useState(false);
  const allLogs = [];
  const checkAndroidPermissionCameraRoll = async () => {
    if (Platform.OS === 'android' && Platform.Version < 33) {
      const granted = await PermissionsAndroid.requestMultiple([
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_EXTERNAL_STORAGE',
      ]);
      if (
        granted['android.permission.WRITE_EXTERNAL_STORAGE'] !== 'granted' ||
        granted['android.permission.READ_EXTERNAL_STORAGE'] !== 'granted'
      ) {
        throw new Error('Required permission not granted');
      }
    }
  };
  useEffect(() => {
    checkAndroidPermissionCameraRoll();
  }, []);
  const subscriptionRef = useRef(null);
  const myLogs = useRef([]);
  const combinedStream = combineLatest(
    accelerometer,
    gyroscope,
    magnetometer,
  ).pipe(
    map(([accelerometerValue, gyroscopeValue, magnetometerValue]) => ({
      accelerometer: accelerometerValue,
      gyroscope: gyroscopeValue,
      magnetometer: magnetometerValue,
    })),
  );
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Geolocation Permission',
          message: 'Can we access your location?',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      console.log('granted', granted);
      if (granted === 'granted') {
        console.log('You can use Geolocation');
        return true;
      } else {
        console.log('You cannot use Geolocation');
        return false;
      }
    } catch (err) {
      return false;
    }
  };
  const getLocation = () => {
    const result = requestLocationPermission();
    result.then(res => {
      console.log('res is:', res);
      if (res) {
        Geolocation.getCurrentPosition(
          position => {
            var logs = myLogs.current;
            logs.push(JSON.stringify({"GPS Data" : position}))
            myLogs.current = logs
            console.log(position);
          },
          error => {
            // See error code charts below.
            console.log(error.code, error.message);
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 100},
        );
      }
    });
  };

  const IMUData = () => {
    subscriptionRef.current = combinedStream.subscribe(
      combinedValues => {
        var logs = myLogs.current 
        logs.push(JSON.stringify(combinedValues));
        myLogs.current = logs;
      },
      error => {
        console.error('Error:', error);
      },
      () => {
        console.log('Stream completed');
      },
    );
  };

  const newSessionStart = () => {
    setSessionStart(true);
    imuDataLoggingStart();
  };
  const imuDataLoggingStart = () => {
    var log = myLogs.current
    setSessionStartTime(Date.now());
    log.push(JSON.stringify({'Session Started': Date.now()}));
    log.push(JSON.stringify({'Sensor Availables': SensorTypes}));
    myLogs.current = log;
    gpsData.current = setInterval(()=>{     
         getLocation()
    },1000)

    IMUData();
  };
  const imuDataLoggingStop = async () => {
    var logs = myLogs.current;
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    logs.push(JSON.stringify({'Session Stopped': Date.now()}));
    console.log('Session total time in seconds =====',(Date.now()-sessionStartTime)/1000)
    logs.push(JSON.stringify({'Session total time in seconds =====' : (Date.now()-sessionStartTime)/1000}))
    setSessionStart(false);
    await downloadArray(myLogs.current, `${Date.now()}-Logs`);
    clearInterval(gpsData.current);
    gpsData.current=null;
    myLogs.current=logs;
  };
  const askStoragePermission = async () => {
    console.log('Asking permission');
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to save files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        console.log('Permission result:', granted);

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Storage permission denied');
          return;
        } else {
          console.log('Storage permission granted');
        }
      }
    } catch (err) {
      console.warn('Error requesting location permission:', err);
    }
  };

  const downloadArray = async (data, fileName) => {
    try {
      let textContent;

      if (Array.isArray(data)) {
        textContent = data.join('\n');
      } else if (typeof data === 'object') {
        textContent = JSON.stringify(data, null, 2);
      }
      const destinationPath = RNFS.DownloadDirectoryPath;
      const filePath = `${destinationPath}/${fileName}.txt`;
      await RNFS.writeFile(filePath, textContent, 'utf8');
      ToastAndroid.show('Logs saved successfully!', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const accelerometerSubscriptionRef = useRef(null);
  const magnetometerSubscriptionRef = useRef(null);
  const gyroscopeSubscriptionRef = useRef(null);
  const gpsData = useRef(null);
  const frameInterval = useRef(null);
  const startRecording = async camera => {
    if (camera) {
      const options = {quality: RNCamera.Constants.VideoQuality['720p']};
      const data = await camera.recordAsync(options);
      setVideoUri(data.uri);
      setIsRecording(false);
      saveVideo(data.uri);
    }
  };
  const stopRecording = async camera => {
    if (camera) {
      if (frameInterval.current) {
        clearTimeout(frameInterval.current);
        frameInterval.current = null;
      }
      camera.stopRecording();
      setIsRecording(false);
    }
  };

  const saveVideo = async video => {
    if (video) {
      const fileName = `video_${Date.now()}.mp4`;
      const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      const exists = await RNFS.exists(path);
      if (!exists) {
        await RNFS.moveFile(video, path);
        setVideoUri(null);
        ToastAndroid.show('Video saved successfully!', ToastAndroid.SHORT);
        console.log(path);
      } else {
        ToastAndroid.show('File already exists!', ToastAndroid.SHORT);
      }
    } else {
      ToastAndroid.show('Storage permission denied!', ToastAndroid.SHORT);
    }
  };

  const takePicture = async camera => {
    if (camera) {
      const options = {quality: 0.5, base64: true};
      const data = await camera.takePictureAsync(options);
      setPhoto(data.uri);
    }
  };

  const videoRecordEnd = () => {
    var log = myLogs.current
    log.push(
      JSON.stringify({
        'Video Recording Ended==============================================================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>':
          Date.now(),
      }),
    );
    log.push(
      JSON.stringify({
        'Total Video duration in seconds==========================':
          (Date.now() - startVideoTime) / 1000,
      }),
    );
    myLogs.current = log
  };
  const videoRecordStart = () => {
    var log = myLogs.current
    setStartVideoTime(Date.now());
    log.push(
      JSON.stringify({
        'Video Recording Started==============================================================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>':
          Date.now(),
      }),
    );
    myLogs.current = log;
  };
  const [timestamps, setTimestamps] = useState([]);
  const recordCamera = useRef(null);
  return (
    <View style={styles.container}>
      {isCameraOpen && sessionStart && (
        <RNCamera
          onRecordingStart={() => videoRecordStart()}
          onRecordingEnd={() => videoRecordEnd()}
          style={styles.preview}
          captureAudio={true}
          ref={recordCamera}>
          <View style={styles.controlsContainer}>
            {!isRecording ? (
              <>
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={() => {
                    setIsRecording(true);
                    startRecording(recordCamera.current);
                  }}>
                  <Text style={styles.recordButtonText}>RECORD</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={({backgroundColor: 'blue'}, styles.recordButton)}
                  onPress={() => {
                    setCameraOpen(false);
                  }}>
                  <Text style={styles.recordButtonText}>Turn Off Camera</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.stopRecordButton}
                onPress={() => stopRecording(recordCamera.current)}>
                <Text style={styles.stopRecordButtonText}>STOP</Text>
              </TouchableOpacity>
            )}
          </View>
        </RNCamera>
      )}
      {sessionStart && !isCameraOpen && (
        <View>
          <TouchableOpacity
            style={styles.stopRecordButton}
            onPress={() => setCameraOpen(true)}>
            <Text style={styles.stopRecordButtonText}>Turn on Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.session}
            onPress={() => imuDataLoggingStop()}>
            <Text style={styles.sessionText}>Close Session</Text>
          </TouchableOpacity>
        </View>
      )}
      {!sessionStart && !isCameraOpen && (
        <Button
          onPress={() => {
            newSessionStart();
          }}
          title="Start Session"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  preview: {
    flex: 0.8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
  },
  recordButton: {
    backgroundColor: '#f44336',
    padding: 10,
    marginHorizontal: 20,
    borderRadius: 5,
  },
  recordButtonText: {
    fontSize: 17,
    color: '#fff',
  },
  stopRecordButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    marginHorizontal: 20,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 5,
  },
  session: {
    marginTop: 10,
    backgroundColor: 'red',
    padding: 10,
    marginHorizontal: 20,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 5,
  },
  sessionText: {
    fontSize: 17,
    color: '#fff',
  },
  stopRecordButtonText: {
    fontSize: 17,
    color: '#fff',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playVideoButton: {
    backgroundColor: '#3498db',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  playVideoButtonText: {
    fontSize: 20,
    color: '#fff',
  },
});
export default App;
