// components/Avatar.js
import React from 'react';
import { Image, Text, View, StyleSheet, TouchableOpacity } from 'react-native';

export default function Avatar({ name, size = 30, url, onPress = () => {} }) {
  const getInitial = () => {
    if (name && typeof name === 'string' && name.length > 0) {
      return name.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <TouchableOpacity onPress={onPress}>
      {
        !url ? (
          <View style={[styles.container, { width: size, height: size }]}>
            <Text style={styles.text}>{getInitial()}</Text>
          </View>
        ) : (
          <Image
            style={[styles.image, { width: size, height: size }]}
            source={{ uri: url }}
          />
        )
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 99,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d0ebff",
    borderWidth: 1,
    borderColor: "#fff",
  },
  text: {
    color: "#1864ab",
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
  },
  image: {
    borderRadius: 99,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#fff",
    resizeMode: 'cover',
  }
});
