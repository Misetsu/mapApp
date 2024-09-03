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

const MyModal = ({
  visible,
  imageUri,
  textData,
  spotImageList,
  spotId,
  onClose,
}) => {
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
            {imageUri ? (
              spotImageList.map((imageUri) => (
                <React.Fragment key={imageUri}>
                  <Text>{textData.userId}</Text>
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: 300, height: 400 }}
                  />
                </React.Fragment>
              ))
            ) : (
              <Text>投稿がありません</Text>
            )}
          </ScrollView>
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
