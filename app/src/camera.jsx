import { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Text,
  Image,
  
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import {
  useCameraPermission,
  useCameraDevice,
  Camera,
  PhotoFile,
} from "react-native-vision-camera";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome5 } from "@expo/vector-icons";
import { Button } from "react-native-web";

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isActive, setIsActive] = useState(false);
  const [image, setImage] = useState(""); // 修正: 初期値を設定
  const [photo, setPhoto] = useState(''); // 修正: 型アノテーションを削除

  useFocusEffect(
    useCallback(() => {
      console.log("on duty");
      setIsActive(true);
      return () => {
        console.log("navigating away");
        setIsActive(false);
      };
    }, [])
  );

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const onTakePicturePressed = async () => {
    try {
      if (cameraRef.current == null) {
        console.log("null");
        return;
      }
      var photos = await cameraRef.current.takePhoto();
      console.log(`file:/${photos.path}`);
      setPhoto(photos.path);
      console.log(`mmmmmmmm${photo}`)
    } catch (error) {
      console.log(error.message);
    }
  };

  const uploadPhoto = async () => {
    if (!photo) {
      return;
    }
    const result = await fetch(`file://${photo}`); // 修正: photo.path を使用
    const data = await result.blob();
    console.log(data);
  };

  async function pickImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.uri);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        photo={true}
        isActive={isActive && !photo}
      />
      

      {photo && (
        <>
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} />
          <FontAwesome5
            onPress={() => setPhoto(undefined)}
            name="arrow-left"
            size={25}
            color="red"
            style={{ position: "absolute", top: 50, left: 30 }}
          
          />
          
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: 50,
              backgroundColor: "rgba(0,0,0,0.40)",
            }}
          >
            <Pressable
            onPress={uploadPhoto}
            style={{
              position: "absolute",
              alignSelf: "center",
              bottom: 50,
              width: 75,
              height: 75,
              backgroundColor: "red",
              borderRadius: 75,
            }}
          ></Pressable>
            {/*
            <Button title="Upload" onPress={uploadPhoto} />
            */}
          </View>
        </>
      )}

      {!photo && (
        <>
          <Pressable
            onPress={onTakePicturePressed}
            style={{
              position: "absolute",
              alignSelf: "center",
              bottom: 50,
              width: 75,
              height: 75,
              backgroundColor: "white",
              borderRadius: 75,
            }}
          >
          </Pressable>
          <Pressable
            onPress={pickImage}
            style={{
              position: "absolute",
              alignSelf: "center",
              bottom: 50,
              left: 40,
              width: 45,
              height: 45,
              backgroundColor: "black",
              borderRadius: 25,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
           
          </Pressable>
        </>
      )}
      <View>
            <Text>{photo}</Text>
            </View>
    </View>
  );
}
