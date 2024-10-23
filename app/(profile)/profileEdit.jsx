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
import { Link, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import FirebaseAuth from "@react-native-firebase/auth";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/FontAwesome5";

const auth = FirebaseAuth();
const router = useRouter();
const reference = storage();

const myPage = () => {
  const [user, setUser] = useState(null); // 現在のユーザー情報を保持
  const [photoUri, setPhotoUri] = useState(""); // プロフィール画像のURL
  const [displayName, setDisplayName] = useState(""); // ユーザーの表示名
  const [displayEmail, setDisplayEmail] = useState(""); // ユーザーの表示名
  const [userStatus, setUserStatus] = useState(0);
  const [editable, setEditable] = useState(true);

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  useEffect(() => {
    // ユーザーデータを取得するための非同期関数
    const fetchUserData = async () => {
      setUser(auth.currentUser);
      setDisplayEmail(auth.currentUser.email);
      setDisplayName(auth.currentUser.displayName);
      setPhotoUri(auth.currentUser.photoURL);
      const queryUser = await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .get();
      const userData = queryUser.data();
      setUserStatus(userData.publicStatus);
    };

    fetchUserData();
  }, []);

  // ユーザーの表示名を保存する関数
  const handleSave = async () => {
    if (user) {
      await firestore().collection("users").doc(user.uid).update({
        displayName: displayName,
      });
      await auth.currentUser.updateProfile({ displayName: displayName });
      setEditable(true); // 編集モードを終了
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
      const photoUri = await uploadPhoto(uri); // 画像をアップロードし、URLを取得
      setPhotoUri(photoUri);
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

  const signout = async () => {
    await auth.signOut();
    router.replace({ pathname: "/" });
  };

  const handleChangePassword = async () => {
    if (auth.currentUser.providerData[0].providerId == "google.com") {
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
    <ScrollView>
      <TouchableOpacity
        onPress={handleBackPress}
        style={{
          width: 50, // 横幅を設定
          height: 50, // 高さを設定
          justifyContent: "center", // 縦中央揃え
          alignItems: "center", // 横中央揃え
        }}
      >
        {/* 右側のアイコンやテキストをここに追加 */}
        <Icon name="angle-left" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.pagetitle}>Profile Edit</Text>
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

        {/* ユーザーネームを表示し、テキストボックスに入力でユーザーネーム変更*/}
        <Text style={styles.displayName}>Username</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.textInput}
          editable={true}
        />
        {/* メールアドレスを表示し、テキストボックスに入力でメールアドレス変更*/}
        <Text style={styles.displayName}>Email</Text>
        <TextInput
          value={displayEmail}
          onChangeText={setDisplayEmail}
          style={styles.textInput}
          editable={true}
        />

        <TouchableOpacity onPress={handleChangePassword}>
          <Text style={styles.linklabel}>Change password?</Text>
        </TouchableOpacity>

        {editable && (
          <TouchableOpacity
            style={styles.submit}
            onPress={() => {
              handleSave(); // まず handleSave を実行
              router.push({ pathname: "/myPage" }); // 次にページ遷移
            }}
          >
            <Text style={styles.submitText}>SAVE</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileContainer: {
    alignItems: "center",
  },
  button: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F2F2",
    height: 50,
    marginBottom: 10, // ボタン間にスペースを追加
  },
  closeButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  buttonText: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    fontWeight: "300",
  },
  pagetitle: {
    fontSize: 30,
    margin: 10,
    textAlign: "center",
    fontWeight: "300",
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
    margin: 10,
    marginTop: 0,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 2,
    marginVertical: 16,
    color: "black",
    fontWeight: "300",
  },
  submit: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    height: 50,
    marginBottom: 10,
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
  backButton: {
    justifyContent: "center",
    alignItems: "center",
    height: 50,
  },
  backButtonText: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    fontWeight: "300",
  },
});

export default myPage;
