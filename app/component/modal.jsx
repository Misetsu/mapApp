// MyModal.js
import React from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Button,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";

const MyModal = ({ visible, empty, postData, spotId, onClose }) => {
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
            {!empty ? (
              postData.map((post) => {
                return (
                  <View>
                    <Text>{post.username}</Text>
                    <Image
                      source={{ uri: post.photoUri }}
                      style={{ width: 300, height: 400 }}
                    />
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
              ></Pressable>
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
});

export default MyModal;
