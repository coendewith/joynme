import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import CameraPlusIcon from "../assets/icons/camera-plus.svg";
import ContactsIcon from "../assets/icons/contacts.svg"; 
import addFriendIcon from "../assets/icons/add-friend-png.png"; // Import the image
import ConnectFriendIcon from "../assets/icons/add-friend.svg"; // Import the image
import Avatar from "./Avatar";

import { useNavigation } from '@react-navigation/native';
import { useProfile } from '../contexts/profile';

export default function Header({ partial = false, darkMode = false }) {
  const navigation = useNavigation();
  const { handle } = useProfile();

  const lightGradient = ['rgba(255, 255, 255, 1)', 'transparent'];
  const darkGradient = ['rgba(0, 0, 0, 1)', 'transparent'];
  
  return (
    <LinearGradient 
      colors={darkMode ? darkGradient : lightGradient}
      locations={[0, 1.04]}
      style={styles.container}
    >
      <View style={styles.layoutContainer}>
        {/* Left Icons */}
        {!partial && (
          <View style={styles.leftIcons}>
            <TouchableOpacity onPress={() => navigation.push('Camera')} style={styles.iconButton}>
              <CameraPlusIcon 
                width={30} // Resize the SVG
                height={30} // Set the height of the SVG
              
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.push('ConnectFriend')} style={styles.iconButton}>
            <ConnectFriendIcon 
                  width={27} // Resize the SVG
                  height={27} // Set the height of the SVG
                  fill="#212529" // Set the color
                />
              
              
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.push('FriendList')} style={styles.iconButton}>
              <ContactsIcon 
              width={30} // Resize the SVG
              height={30} // Set the height of the SVG
              fill="#212529" // Set the color
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Center Title */}
        <Text style={[styles.title, { color: darkMode ? "#fff" : "#000" }]}>
          JoynMe
        </Text>

        {/* Right Icon */}
        
        {!partial && (
          
          <TouchableOpacity onPress={() => navigation.push('Initial')} style={styles.rightIcon}>
            <Avatar name={handle.substring(1)} />
          </TouchableOpacity>
        )}
      </View>
      <StatusBar translucent backgroundColor='transparent' style={darkMode ? "light" : "dark"} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60, // Adjusted from paddingVertical to paddingTop
    paddingBottom: 20, // Optional: add some bottom padding if needed
    backgroundColor: "transparent",
    position: "absolute",
    width: "100%",
    zIndex: 2
  },
  layoutContainer: {
    position: 'relative',
    height: 60, // Define a fixed height for the header
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  leftIcons: {
    position: 'absolute',
    left: 20, // Distance from the left edge
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginRight: 15, // Space between the left icons
  },
  icon: {
    width: 24, 
    height: 24, 
    tintColor: "#212529", // Use tintColor for the Image component
  },
  ConnectFriendIcon: {
    width: 24, 
    height: 24, 
    tintColor: "#212529", // Use tintColor for the Image component
  },
  title: {
    position: 'absolute',
    left: '40%',
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 24,
    textAlign: 'center',
  },
  rightIcon: {
    position: 'absolute',
    right: 20, // Distance from the right edge
    // Optionally add more styling if needed
  }
});
