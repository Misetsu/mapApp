import React, { useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/FontAwesome5";
import CheckBox from "@react-native-community/checkbox";
import * as ImagePicker from "expo-image-picker";

const auth = FirebaseAuth();

export default function SignupScreenGoogle() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { uid, displayName, photoURL } = params;
  const [userName, setUserName] = useState(displayName);
  const [photouri, setPhotouri] = useState(photoURL);
  const [isChecked, setIsChecked] = useState(false);

  const handleBackPress = () => {
    auth.currentUser.delete;
    router.back();
  };

  const handleSignUp = async () => {
    await firestore()
      .collection("users")
      .doc(auth.currentUser.uid)
      .set({
        uid: auth.currentUser.uid,
        displayName: userName,
        email: auth.currentUser.email,
        lastPostAt: "0", // TODO
        publicStatus: 0, // TODO
        spotCreate: 0,
        spotPoint: 0,
        photoURL: photouri,
      })
      .then()
      .catch((error) => console.log(error));

    await firestore().collection("star").doc(auth.currentUser.uid).set({});

    router.replace({ pathname: "/" });
  };

  // 画像ピッカーを開いて画像を選択する関数
  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      const photoUri = await uploadPhoto(uri); // 画像をアップロードし、URLを取得
      setPhotouri(photoUri);
    }
  };

  // 画像をアップロードする関数
  const uploadPhoto = async (uri) => {
    const uploadUri = uri;
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const imagePath =
      "profile/photo" + new Date().getTime().toString() + randomNumber;
    await reference.ref(imagePath).putFile(uploadUri);

    const url = await reference.ref(imagePath).getDownloadURL();

    await firestore()
      .collection("users")
      .doc(auth.currentUser.uid)
      .update({ photoURL: url });

    const update = {
      photoURL: url,
    };
    await auth.currentUser.updateProfile(update);

    return url;
  };

  return (
    <ScrollView style={styles.scrview}>
      <View style={styles.container}>
        <Text style={styles.pagetitle}>アカウント作成</Text>

        <View style={styles.profileContainer}>
          {/* プロフィール画像がある場合に表示し、ない場合はプレースホルダーを表示。画像タップでライブラリを開く*/}
          <TouchableOpacity onPress={handlePickImage}>
            {photouri ? (
              <Image source={{ uri: photouri }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.displayName}>ユーザー名</Text>
        <TextInput
          style={styles.textInput}
          value={userName}
          onChangeText={setUserName}
          placeholder="ユーザー名"
        />
        <Text style={styles.noamllabel}>
          ユーザー名{"(名前)"}を入力してください
        </Text>

        <View style={styles.checkboxContainer}>
          <CheckBox
            value={isChecked}
            onValueChange={setIsChecked}
            tintColors={{ true: "#239D60", false: "#239D60" }} // チェックボックスの色
            style={styles.checkbox} // サイズ変更用のスタイル
          />
          <Text style={styles.noamllabel}>
            利用規約、プライバシーポリシー{"\n"}をすべて読み、同意します
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.submit, !isChecked && styles.disabledButton]}
          onPress={handleSignUp}
          disabled={!isChecked}
        >
          <Text style={styles.submitText}>アカウント作成</Text>
        </TouchableOpacity>

        <View style={styles.Back}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Icon name="angle-left" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  scrview: {
    flex: 1,
    backgroundColor: "#F2F5C8",
  },
  profileContainer: {
    alignItems: "center",
    width: "100%",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ccc",
  },
  pagetitle: {
    fontSize: 30,
    height: 70,
    marginTop: 0,
    textAlign: "center",
    fontWeight: "300",
    color: "#000000",
  },
  displayName: {
    fontSize: 15,
    marginTop: 10,
    marginLeft: 10,
    textAlign: "left",
    alignItems: "flex-start",
    fontWeight: "300",
  },
  textInput: {
    margin: 5,
    marginTop: 0,
    marginBottom: 0,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 3,
    borderColor: "#239D60",
    marginVertical: 16,
    color: "black",
    fontWeight: "300",
  },
  noamllabel: {
    fontSize: 15,
    margin: 10,
    textAlign: "center",
    fontWeight: "600",
    color: "#239D60",
  },
  submit: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#239D60",
    height: 50,
    margin: 10, // ボタン間にスペースを追加
  },
  submitText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f2f2f2",
    textAlign: "center",
  },
  backButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F5C8",
    width: 70,
    height: 70,
    marginTop: 5, // ボタン間にスペースを追加
  },
  Back: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // 中央揃え
    margin: 10,
  },
  checkbox: {
    width: 30, // サイズを少し大きく
    height: 30,
    padding: 10,
    marginRight: 10,
  },
  disabledButton: {
    backgroundColor: "gray",
  },
});
