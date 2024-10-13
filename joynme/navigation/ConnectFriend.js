// components/ConnectFriend.js
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Text, Button, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; // Import UUID




// Import any necessary icons (e.g., Send icon)
import Send from '../assets/icons/send.svg';

// Assuming you have a context or props to provide user profile and posts
// If not, you need to set it up accordingly
import { usePosts } from '../contexts/posts'; // Example context
import { useProfile } from '../contexts/profile'; // Example context

export default function ConnectFriend() {
  const [status, requestPermission] = useCameraPermissions();
  const [picture, setPicture] = useState(null);
  const cameraRef = useRef(null);
  const navigation = useNavigation();
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Replace with your backend's base URL
  // Ensure this URL is the current ngrok URL
  const BACKEND_URL = 'https://3868-82-168-232-93.ngrok-free.app'; // Update as needed

  // Access posts and setPosts from context or props
  const { posts, setPosts } = usePosts(); // Example context hook
  const { handle, profile, location } = useProfile(); // Destructure the profile context

  // // Async function to generate UUIDv4 using expo-crypto
  // async function generateUUID() {
  //   const randomBytes = await Crypto.getRandomBytesAsync(16);

  //   // Manipulate certain bits according to RFC 4122 to indicate version 4 UUID
  //   randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
  //   randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;

  //   const byteToHex = [];
  //   for (let i = 0; i < 256; i++) {
  //     byteToHex.push((i + 0x100).toString(16).substr(1));
  //   }

  //   let uuid = '';
  //   for (let i = 0; i < randomBytes.length; i++) {
  //     uuid += byteToHex[randomBytes[i]];
  //     if (i === 3 || i === 5 || i === 7 || i === 9) {
  //       uuid += '-';
  //     }
  //   }
  //   return uuid;
  // }

  
  useEffect(() => {
    console.log('Profile Data:', { handle, profile, location });
  }, [handle, profile, location]);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };



  useEffect(() => {
    (async () => {
      if (!status) {
        await requestPermission();
      }
    })();
  }, [status, requestPermission]);
  

  if (!status) {
    // Permissions are still loading
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#fff' }}>Loading...</Text>
      </View>
    );
  }

  if (!status.granted) {
    // Permissions not granted
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to access the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current && cameraReady) {
      try {
        const capturedPicture = await cameraRef.current.takePictureAsync({ base64: false });
        setPicture(capturedPicture);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Could not take picture. Please try again.');
      }
    }
  }

  async function handleSubmit() {
    if (!picture) {
      Alert.alert('No Picture', 'Please take a picture before submitting.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('image', {
      uri: picture.uri,
      name: 'friend_connection.jpg', // More descriptive name
      type: 'image/jpeg',
    });

    try {
      const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        const { recognized_ids } = response.data;
        Alert.alert('Success', 'Friend verified successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Main') },
        ]);
        // Handle recognized_ids as needed
        submitPicture(recognized_ids);
      }
    } catch (error) {
      console.error('Error verifying friend:', error);
      if (error.response) {
        const { error: errMsg, detected_faces } = error.response.data;
        if (errMsg) {
          Alert.alert('Verification Failed', errMsg);
        } else {
          Alert.alert('Verification Failed', 'Could not verify the friend in the picture.');
        }
      } else {
        Alert.alert('Error', 'An error occurred while verifying the friend.');
      }
    } finally {
      setLoading(false);
    }
  }

  function submitPicture(recognized_ids) {
    if (picture) { 
      // Convert recognized_ids to friend names (capitalize first letter)
      const friendNames = recognized_ids.map(id => capitalizeFirstLetter(id));

      // Create a string for the message
      const friendNamesText = friendNames.join(' and ');
      

      const newPost = {
        id: Date.now(), // Simple unique ID logic
        user: {
          handle: handle || '@placeholder', // Fallback handle
          profile: profile || 'https://via.placeholder.com/150', // Fallback profile image
        },
        likes: 0,
        dislikes: 0,
        location: {
          city: location?.city || 'Unknown City', // Safe access with fallback
          state: location?.state || 'Unknown State', // Safe access with fallback
        },
        image: {
          back: picture.uri, // Use 'back' to store the connection image
          front: null, // Set front to null since it's a friend post
        },
        isFriendPost: true, // Indicate that this is a friend connection post
        friendNames: friendNames, // Add friendNames array
      };
      setPosts([newPost, ...posts]);
      navigation.navigate('Main');
    } else {
      Alert.alert('Error', 'No picture available to submit.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView
          onCameraReady={() => setCameraReady(true)}
          ref={cameraRef}
          ratio="16:9"
          style={styles.camera}
          facing="front" // Use only front-facing camera
          flash="off" // Flash is off; adjust as needed
        />

        {/* Image Preview Overlay */}
        {picture && (
          <Image
            source={{ uri: picture.uri }}
            style={styles.imagePreview}
          />
        )}
      </View>

      <View style={styles.toolsContainer}>
        {/* Red Capture Button */}
        <TouchableOpacity onPress={takePicture} style={styles.captureButton} />

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={[
            styles.submitButton,
            { opacity: picture && !loading ? 1 : 0.5 }, // Disable button if no picture or loading
          ]}
          disabled={!picture || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20, // General padding for the container
    position: 'relative', // Establishes a positioning context for absolute children
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#000', // Changed to black for better visibility
    fontSize: 16,
  },
  cameraWrapper: {
    flex: 4,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative', // To contain the absolutely positioned imagePreview
    marginVertical: -30, // Adjust margin as needed
    marginTop:100,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  imagePreview: {
    position: 'absolute', // Positions the image on top of the camera view
    top: 410, // Adjust as needed
    right: 0, // Adjust as needed
    bottom:0,
    left:10,
    width: 110, // Adjust size as needed
    height: 165, // Adjust size as needed
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: 'transparent'
    // transform: [{ rotate: '90deg' }],
  },
  toolsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10, // Space above the tools
  },
  captureButton: {
    backgroundColor: '#FA5252',
    borderRadius: 35,
    width: 70,
    height: 70,
    borderWidth: 5,
    borderColor: '#000',
    marginRight: 20,
  },
  submitButton: {
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  submitButtonText: {
    fontFamily: 'Manrope_700Bold', // Ensure this font is loaded
    fontSize: 18,
    textAlign: 'center',
    color: '#fff',
  },
});
