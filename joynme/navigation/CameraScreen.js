import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions, TouchableOpacity, Image, Text, Button } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { usePosts } from '../contexts/posts';
import { useProfile } from '../contexts/profile';
import { useNavigation } from '@react-navigation/native';

import Send from '../assets/icons/send.svg';
import Rotate from '../assets/icons/rotate.svg';

export default function CameraScreen() {
  const [status, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back'); 
  const [pictures, setPictures] = useState({
    front: null,
    back: null,
  });
  const cameraRef = useRef(null); 
  const { width } = useWindowDimensions();
  const { posts, setPosts } = usePosts();
  const height = Math.round((width * 16) / 9);
  const navigation = useNavigation();
  const profile = useProfile();
  const [cameraReady, setCameraReady] = useState(false);
  

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

  function otherSide() {
    return facing === 'back' ? 'front' : 'back';
  }

  function swapCamera() {
    setFacing(otherSide());
  }

  function submitPicture() {
    if (pictures.front && pictures.back) {
      const post = {
        id: Date.now(),
        user: {
          handle: profile.handle,
          profile: profile.profile,
        },
        likes: 0,
        dislikes: 0,
        location: {
          city: profile.location.city,
          state: profile.location.state,
        },
        image: {
          front: pictures.front.uri,
          back: pictures.back.uri,
        },
      };

      setPosts([post, ...posts]);
      navigation.navigate('Main');
    }
  }

  function hasBothPictures() {
    return pictures.front !== null && pictures.back !== null;
  }

  async function takePicture() {
    if (cameraRef.current && cameraReady) {
      try {
        const picture = await cameraRef.current.takePictureAsync();
        setPictures(prev => ({ ...prev, [facing]: picture }));
        swapCamera();
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          onCameraReady={() => setCameraReady(true)}
          ref={cameraRef}
          ratio="16:9"
          style={{ width: '100%', height }}
          facing={facing}
          flash="off" // You can make this dynamic if needed
        >
          {pictures[otherSide()] && (
            <Image
              source={{ uri: pictures[otherSide()]?.uri }}
              style={[styles.imagePreview, { width: 0.36 * width, height: 0.36 * height }]}
            />
          )}
        </CameraView>
      </View>
      <View style={styles.toolsContainer}>
        <TouchableOpacity onPress={swapCamera} style={[styles.secondaryButton, { marginRight: 20 }]}>
          <Rotate color="white" width={35} height={35} />
        </TouchableOpacity>
        <TouchableOpacity onPress={takePicture} style={styles.captureButton} />
        <TouchableOpacity
          disabled={!hasBothPictures()}
          onPress={submitPicture}
          style={[
            styles.secondaryButton,
            { marginLeft: 20, opacity: hasBothPictures() ? 1 : 0.5 },
          ]}
        >
          <Send color={hasBothPictures() ? 'white' : '#868e96'} width={35} height={35} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    color: '#fff',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 4,
    borderRadius: 34,
    overflow: 'hidden',
    marginTop: 150, // Add this line to move the camera down
    // Alternatively, use paddingTop if you prefer
    // paddingTop: 50,
  },
  imagePreview: {
    position: 'absolute',
    left: 20,
    top: 40,
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'black',
  },
  toolsContainer: {
    flex: 1,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#FA5252',
    borderRadius: 35,
    width: 70,
    height: 70,
    borderWidth: 5,
    borderColor: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#343a40',
    borderRadius: 16,
    padding: 8,
  },
});
