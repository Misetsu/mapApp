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
} from "react-native";
import { Link } from "expo-router";

const MyModal = ({ visible, imageUri, textData, spotId, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text>{textData.userId}</Text>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: 300, height: 400 }}
            />
          ) : (
            <ActivityIndicator size="large" color="#0000ff" />
          )}
          <TouchableOpacity onPress={onClose}>
            <Text>{textData.postTxt}</Text>
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
                position: "absolute",
                // alignSelf: "center",
                bottom: 5,
                right: 20,
                width: 75,
                height: 45,
                backgroundColor: "blue",
              }}
            ></Pressable>
          </Link>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default MyModal;
