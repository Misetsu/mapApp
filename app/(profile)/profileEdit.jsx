import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Modal,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import FirebaseAuth from "@react-native-firebase/auth";
import * as ImagePicker from "expo-image-picker";

const auth = FirebaseAuth();
const reference = storage();

export default function myPage() {
  const router = useRouter();
  const [user, setUser] = useState(null); // 現在のユーザー情報を保持
  const [photoUri, setPhotoUri] = useState(""); // プロフィール画像のURL
  const [displayName, setDisplayName] = useState(""); // ユーザーの表示名
  const [displayEmail, setDisplayEmail] = useState(""); // ユーザーの表示名
  const [googleProvider, setGoogleProvider] = useState(false);

  const handleBackPress = () => {
    if (router) {
      router.back();
    }
  };

  useEffect(() => {
    // ユーザーデータを取得するための非同期関数
    const fetchUserData = async () => {
      setUser(auth.currentUser);
      setDisplayEmail(auth.currentUser.email);
      setDisplayName(auth.currentUser.displayName);
      setPhotoUri(auth.currentUser.photoURL);
      if (auth.currentUser.providerData[0].providerId == "google.com") {
        setGoogleProvider(true);
      }
    };

    fetchUserData();
  }, []);

  // ユーザーの表示名を保存する関数
  const handleSave = async () => {
    if (photoUri !== auth.currentUser.photoURL) {
      await uploadPhoto(photoUri); // 画像をアップロードし、URLを取得
    }
    if (user) {
      await firestore().collection("users").doc(user.uid).update({
        displayName: displayName,
      });
      await auth.currentUser.updateProfile({ displayName: displayName });
      router.back();
    }
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
      setPhotoUri(uri);
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
  };

  const signout = async () => {
    await auth.signOut();
    router.replace({ pathname: "/" });
  };

  const handleChangePassword = async () => {
    if (googleProvider) {
    } else {
      auth
        .sendPasswordResetEmail(auth.currentUser.email)
        .then(() => {
          alert(
            "パスワードを変更するメールを登録されているメールアドレスに送信しました。"
          );
          signout();
        })
        .catch((error) => {
          alert(error);
        });
    }
  };

  return (
    <ScrollView style={styles.scrview}>
      <View style={styles.container}>
        <Text style={styles.pagetitle}>プロフィール編集</Text>
        <View style={styles.profileContainer}>
          {/* プロフィール画像がある場合に表示し、ない場合はプレースホルダーを表示。画像タップでライブラリを開く*/}
          <TouchableOpacity onPress={handlePickImage}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.noamllabel}>アイコンをタップして画像を変更</Text>

        {/* ユーザーネームを表示し、テキストボックスに入力でユーザーネーム変更*/}
        <Text style={styles.displayName}>ユーザー名</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={16}
          style={styles.textInput}
          editable={true}
        />
        <Text style={styles.noamllabel}>
          ユーザー名{"(名前)"}を入力してください
        </Text>
        {/* メールアドレスを表示し、テキストボックスに入力でメールアドレス変更*/}
        <Text style={styles.displayName}>メールアドレス</Text>
        <TextInput
          value={displayEmail}
          onChangeText={setDisplayEmail}
          style={styles.textInput}
          editable={false}
        />
        {/* <Text style={styles.noamllabel}>
          有効なメールアドレスを入力してください
        </Text> */}

        {googleProvider ? (
          <></>
        ) : (
          <TouchableOpacity onPress={handleChangePassword}>
            <Text style={styles.linklabel}>パスワードを変更</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.submit}
          onPress={() => {
            handleSave(); // まず handleSave を実行
          }}
        >
          <Text style={styles.submitText}>変更を保存</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.Back}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Image
            source={require("./../image/Left.png")}
            style={styles.actionButton}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrview: {
    backgroundColor: "#F2F5C8",
  },
  profileContainer: {
    alignItems: "center",
  },
  button: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#A3DE83",
    height: 50,
    margin: 10, // ボタン間にスペースを追加
  },
  buttonText: {
    fontSize: 18,
    color: "#000000",
    textAlign: "center",
    fontWeight: "300",
  },
  closeButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  pagetitle: {
    fontSize: 24,
    height: 30,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "300",
    color: "#000000",
  },
  noamllabel: {
    fontSize: 15,
    margin: 10,
    textAlign: "center",
    fontWeight: "600",
    color: "#239D60",
  },
  displayName: {
    fontSize: 15,
    marginTop: 10,
    marginLeft: 10,
    textAlign: "left",
    alignItems: "flex-start",
    fontWeight: "300",
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
  followList: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    margin: 10,
  },
  listProfileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  FFtext: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  FFcontainer: {
    flexDirection: "row", // 子要素を横並びに配置
    justifyContent: "space-between", // 子要素間にスペースを空ける
    alignItems: "center", // 垂直方向の中央に揃える
    width: "80%", // 横幅を80%に設定（任意）
    padding: 5, // 全体にパディング
  },
  FFnum: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 背景を半透明に
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
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
  actionButton: {
    width: 30,
    height: 30,
    padding: 5,
    margin: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  backButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    width: 70,
    height: 70,
    marginTop: 3, // ボタン間にスペースを追加
  },
  Back: {
    position: "absolute",
    top: 0,
    left: 0,
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
  linklabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
    textDecorationLine: "underline",
    color: "#1a0dab",
    fontWeight: "600",
  },
});
