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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage"; // Firebase Storageのインポート
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/FontAwesome5";

const auth = FirebaseAuth();
const router = useRouter();

const myPage = () => {
  // ユーザー、プロフィール画像URI、表示名、メールアドレス、ユーザーステータスなどの状態変数を定義
  const [user, setUser] = useState(null); // 現在のユーザー情報
  const [photoUri, setPhotoUri] = useState(""); // プロフィール画像のURI
  const [displayName, setDisplayName] = useState(""); // 表示名
  const [displayEmail, setDisplayEmail] = useState(""); // メールアドレス
  const [userStatus, setUserStatus] = useState(0); // ユーザーの公開ステータス
  const [showPasswordForm, setShowPasswordForm] = useState(false); // パスワード変更フォームの表示/非表示
  const [currentPassword, setCurrentPassword] = useState(""); // 現在のパスワード
  const [newPassword, setNewPassword] = useState(""); // 新しいパスワード
  const [confirmPassword, setConfirmPassword] = useState(""); // 確認用パスワード

  // 戻るボタンが押されたときに呼び出される関数
  const handleBackPress = () => {
    router.back(); // 前のページに戻る
  };

  // コンポーネントの初回レンダリング時にユーザー情報を取得するための副作用
  useEffect(() => {
    const fetchUserData = async () => {
      // Firebase Authから現在のユーザー情報を取得
      setUser(auth.currentUser);
      setDisplayEmail(auth.currentUser.email); // ユーザーのメールアドレスを状態にセット
      setDisplayName(auth.currentUser.displayName); // ユーザーの表示名を状態にセット
      setPhotoUri(auth.currentUser.photoURL); // プロフィール画像のURLを状態にセット

      // Firestoreからユーザーの追加情報を取得
      const queryUser = await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .get();

      // Firestoreから取得したユーザーデータを状態にセット
      const userData = queryUser.data();
      setUserStatus(userData.publicStatus); // 公開ステータスを状態にセット
    };

    fetchUserData(); // データ取得関数を実行
  }, []); // 空の依存配列で、コンポーネントのマウント時にのみ実行される

  // 画像をFirebase StorageにアップロードしてURLを取得する関数
  const uploadImageToFirebase = async (uri) => {
    if (!uri) return null;

    const userId = auth.currentUser.uid;
    const storageRef = storage().ref(`profileImages/${userId}`);

    const response = await fetch(uri); // ローカル画像URIからバイナリデータを取得
    const blob = await response.blob(); // バイナリデータをBlob形式に変換

    // Firebase Storageにアップロード
    await storageRef.put(blob);

    // アップロードされた画像のURLを取得
    const downloadURL = await storageRef.getDownloadURL();
    return downloadURL;
  };

  // ユーザーのプロファイル情報を保存するための関数
  const handleSave = async () => {
    if (user) {
      let photoURL = photoUri;

      // 画像が変更されている場合はFirebase Storageにアップロード
      if (photoUri && !photoUri.startsWith("https://")) {
        photoURL = await uploadImageToFirebase(photoUri);
      }

      // Firestoreのusersコレクションにユーザーの情報を更新
      await firestore().collection("users").doc(user.uid).update({
        displayName: displayName, // 表示名をFirestoreに更新
        email: displayEmail, // メールアドレスをFirestoreに更新
        photoURL: photoURL, // プロフィール画像URLをFirestoreに更新
      });

      // Firebase Authenticationのプロファイル情報を更新
      await auth.currentUser.updateProfile({
        displayName: displayName,
        photoURL: photoURL, // プロフィール画像URLをAuthに反映
      });
      await auth.currentUser.updateEmail(displayEmail); // メールアドレスをAuthに反映

      // 成功メッセージを表示
      Alert.alert("Success", "Changes have been saved successfully.");
    }
  };

  const reauthenticateUser = async (currentPassword) => {
    // 再認証のための資格情報を生成
    const credential = FirebaseAuth.EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );

    try {
      // ユーザーを再認証
      await auth.currentUser.reauthenticateWithCredential(credential);
      return true;
    } catch (error) {
      // 認証エラーの場合にアラートを表示
      Alert.alert("Error", "Current password is incorrect.");
      return false;
    }
  };

  // パスワードを変更するための関数
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      // 新しいパスワードと確認用パスワードが一致しない場合にエラーを表示
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    // 現在のパスワードで再認証を行う
    const isReauthenticated = await reauthenticateUser(currentPassword);

    if (isReauthenticated) {
      try {
        // パスワードを新しいものに変更
        await auth.currentUser.updatePassword(newPassword);
        Alert.alert("Success", "Password has been changed successfully.");
        setShowPasswordForm(false); // パスワードフォームを閉じる
      } catch (error) {
        // パスワード変更が失敗した場合のエラー処理
        Alert.alert("Error", "Failed to change password.");
      }
    }
  };

  // 画像ピッカーを使って画像を選択するための関数
  const handlePickImage = async () => {
    // 画像ピッカーを起動して、ユーザーに画像を選択させる
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // 画像メディアのみを許可
      allowsEditing: true, // ユーザーが画像を編集できる
      aspect: [1, 1], // 1:1のアスペクト比を強制
      quality: 1, // 画像の品質を指定
    });

    if (!result.canceled) {
      // キャンセルされなかった場合、選択された画像のURIをセット
      const { uri } = result.assets[0];
      setPhotoUri(uri);
    }
  };

  return (
    <ScrollView>
      {/* 戻るボタン */}
      <TouchableOpacity onPress={handleBackPress} style={{ width: 50, height: 50, justifyContent: "center", alignItems: "center" }}>
        <Icon name="angle-left" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.pagetitle}>Profile Edit</Text>
        <View style={styles.profileContainer}>
          {/* プロフィール画像をタップして画像を変更 */}
          <TouchableOpacity onPress={handlePickImage}>
            {photoUri ? (
              // 画像が選択されている場合、それを表示
              <Image source={{ uri: photoUri }} style={styles.profileImage} />
            ) : (
              // 画像が選択されていない場合、プレースホルダーを表示
              <View style={styles.profileImagePlaceholder} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.displayName}>Username</Text>
        {/* ユーザー名入力フィールド */}
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.inputField}
          placeholder="Username"
        />

        <Text style={styles.displayName}>Email</Text>
        {/* メールアドレス入力フィールド */}
        <TextInput
          value={displayEmail}
          onChangeText={setDisplayEmail}
          style={styles.inputField}
          placeholder="Email"
        />

        <View style={styles.buttonContainer}>
          {/* プロフィール情報を保存するボタン */}
          <TouchableOpacity onPress={handleSave} style={styles.button}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>

          {/* パスワード変更フォームを表示するボタン */}
          <TouchableOpacity
            onPress={() => setShowPasswordForm(true)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* パスワード変更フォーム */}
        <Modal visible={showPasswordForm} animationType="slide">
          <View style={styles.modalContainer}>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={styles.inputField}
              placeholder="Current Password"
              secureTextEntry
            />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.inputField}
              placeholder="New Password"
              secureTextEntry
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.inputField}
              placeholder="Confirm Password"
              secureTextEntry
            />

            <TouchableOpacity onPress={handleChangePassword} style={styles.button}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPasswordForm(false)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5", // 背景色をライトグレーに
  },
  pagetitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333", // テキストの色を濃いグレーに
  },
  profileContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30, // マージンを広めに
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70, // 完全な円形に
    borderWidth: 3,
    borderColor: "#5f898a", // ボーダーを追加
  },
  profileImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ccc", // プレースホルダーに少しダークなグレーを
    justifyContent: "center",
    alignItems: "center",
  },
  displayName: {
    fontSize: 18,
    fontWeight: "500", // 少し太めのフォント
    color: "#555", // 少し明るいグレー
    marginBottom: 10,
  },
  inputField: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff", // 入力フィールドの背景を白に
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    shadowColor: "#000", // 軽いシャドウを追加して浮き上がらせる
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Android用のシャドウ
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    backgroundColor: "#5f898a",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#5f898a", // ボタンにも軽いシャドウを追加
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // モーダルの背景に半透明を追加
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000", // モーダルのコンテンツにシャドウを追加
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});

export default myPage;
