// FriendList.js
import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import FriendListItem from '../components/FriendListItem';
import { usePosts } from '../contexts/posts';

export default function FriendList() {
  const { posts } = usePosts();

  // Filter posts to include only friend connections
  const friendConnections = posts.filter(post => post.isFriendPost);

  // If no friends, display a message
  if (friendConnections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You have no friends yet. Start connecting!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={friendConnections}
        keyExtractor={(item) => item.id.toString()} // Ensure id is a string
        renderItem={({ item }) => (
          <FriendListItem 
            name={item.friendNames.join(' and ')} 
            profileImage={item.user.profile} 
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 100, // Adjust based on header height
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#868E96',
    textAlign: 'center',
    fontFamily: 'Manrope_500Medium',
  },
});
