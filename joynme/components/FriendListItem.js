// components/FriendListItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Avatar from './Avatar'; // Ensure Avatar handles circular images

export default function FriendListItem({ name, profileImage }) {
  return (
    <TouchableOpacity style={styles.container}>
      <Avatar url={profileImage || 'https://via.placeholder.com/150'} size={50} />
      <Text style={styles.name}>{name || 'Unnamed Friend'}</Text>
    </TouchableOpacity>
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
    marginLeft: 15,
    fontSize: 16,
    color: '#212529',
    fontFamily: 'Manrope_500Medium',
  },
});
