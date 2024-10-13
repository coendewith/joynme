import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons for icons
import Avatar from './Avatar'; // Ensure Avatar handles circular images

export default function FriendListItem({ name, profileImage }) {
  const [menuVisible, setMenuVisible] = useState(false);

  const handlePingFriend = () => {
    Alert.alert('Ping Sent', `You have pinged ${name} for a meetup!`);
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleDeleteFriend = () => {
    Alert.alert('Delete Friend', `Are you sure you want to delete ${name}?`);
    setMenuVisible(false); // Close the menu
  };

  const handleSeePhotosTogether = () => {
    Alert.alert('See Photos', `Viewing shared photos with ${name}`);
    setMenuVisible(false); // Close the menu
  };

  return (
    <View style={styles.container}>
      <Avatar url={profileImage || 'https://via.placeholder.com/150'} size={50} />
      <Text style={styles.name}>{name || 'Unnamed Friend'}</Text>

      {/* Three Dots Button */}
      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
        <Ionicons name="ellipsis-vertical" size={24} color="black" />
      </TouchableOpacity>

      {/* Ping Button */}
      <TouchableOpacity style={styles.pingButton} onPress={handlePingFriend}>
        <Ionicons name="send" size={24} color="black" />
      </TouchableOpacity>

      {/* Action Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteFriend}>
              <Text style={styles.menuText}>Delete Friend</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleSeePhotosTogether}>
              <Text style={styles.menuText}>See Photos Together</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  name: {
    flex: 1, // Allow the name to take as much space as possible
    marginLeft: 15,
    fontSize: 16,
    color: '#212529',
    fontFamily: 'Manrope_500Medium',
  },
  menuButton: {
    marginLeft: 10,
  },
  pingButton: {
    marginLeft: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});
