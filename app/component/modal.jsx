// MyModal.js
import React from "react";
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { formatInTimeZone, utcToZonedTime } from "date-fns-tz";

const MyModal = ({ visible, empty, postData, spotId, loading, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView>
            {loading ? (
              <Text>読み込み中...</Text>
            ) : !empty ? (
              postData.map((post) => {
                return (
                  <View key={post.postId}>
                    <Link
                      href={{
                        pathname: "/profile",
                        params: {
                          uid: post.userId,
                        },
                      }}
                      asChild
                    >
                      <TouchableOpacity style={styles.userInfo}>
                        <Image
                          source={{ uri: post.userIcon }}
                          style={styles.userIcon}
                        />
                        <Text>{post.username}</Text>
                      </TouchableOpacity>
                    </Link>
                    <Image
                      source={{ uri: post.photoUri }}
                      style={{ width: 300, height: 400 }}
                    />
                    <Text>
                      {formatInTimeZone(
                        new Date(post.timestamp),
                        "Asia/Tokyo",
                        "yyyy/MM/dd HH:mm"
                      )}
                    </Text>
                    <Text>{post.postText}</Text>
                  </View>
                );
              })
            ) : (
              <Text>投稿がありません</Text>
            )}
          </ScrollView>
          <View style={styles.toolView}>
            <TouchableOpacity onPress={onClose}>
              <Text>Close</Text>
            </TouchableOpacity>
            <Link
              href={{
                pathname: "/camera",
                params: {
                  latitude: 0,
                  longitude: 0,
                  spotId: spotId,
                },
              }}
              asChild
            >
              <Pressable
                style={{
                  // position: "absolute",
                  // alignSelf: "flex-end",
                  // bottom: 0,
                  // right: 0,
                  width: 75,
                  height: 25,
                  backgroundColor: "blue",
                }}
              >
                <Text
                  style={{
                    alignSelf: "center",
                    color: "#FFFFFF",
                  }}
                >
                  投稿
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
  },
  modalView: {
    width: 350,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toolView: {
    marginTop: 10,
    display: "flex",
    flexDirection: "row",
    alignContent: "space-between",
  },
  userIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  userInfo: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
  },
});

export default MyModal;
