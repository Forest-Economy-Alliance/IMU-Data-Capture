
# IMU-Data-Capture

IMU-Data-Capture is a React Native Android application designed to capture real-time Inertial Measurement Unit (IMU) sensor data. This guide will help you set up the application quickly.




## Prerequisites

Before you start, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14 or above)
- [npm](https://www.npmjs.com/) (Node Package Manager)
- [React Native CLI](https://reactnative.dev/docs/environment-setup)
- [Android Studio](https://developer.android.com/studio) (for Android development)

## Quick Setup

Follow these steps to set up and run the IMU-Data-Capture app:

### 1. Clone the Repository

```sh
git clone https://github.com/Forest-Economy-Alliance/IMU-Data-Capture.git
cd IMU-Data-Capture

```
### 2. Install Dependencies
   ```sh 
   npm install
   ```

### 3. Set Up Android Development Environment
Make sure you have the Android development environment set up on your machine. Follow the React Native CLI Quickstart guide for detailed instructions.

### 4.Connect an Android Device or Start an Emulator
Connect your Android device via USB or start an Android emulator. Make sure the device is in developer mode and USB debugging is enabled.

### 5. Run the Application
```sh
npx react-native run-android
```
### 6. Usage
 **1. Select Data Collection Mode**: Choose between periodic data collection or continuous data collection.                                                                                                                                             
   **2.Start Data Collection**: Tap the 'Start Logging' button to begin collecting IMU sensor data.                                                                                                                                                    
   **3.End Session**: Tap the 'Stop Logging' button to end the data collection session.                                                                                                                                                               
   **4.Access Log Files**: The log files will be saved in the local file manager of your device. You can export these files for further analysis.


### Download APK
If you prefer to directly install the app without setting up the development environment, you can download the APK file from the [Releases](https://github.com/Forest-Economy-Alliance/IMU-Data-Capture/releases) section of this repository.
