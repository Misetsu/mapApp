import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Modal, Image, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Link, useRouter } from "expo-router";
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import FirebaseAuth from '@react-native-firebase/auth';
import * as ImagePicker from 'expo-image-picker';

const myPage = () => {
  const [user, setUser] = useState(null); // 現在のユーザー情報を保持
  const [photoUri, setPhotoUri] = useState(''); // プロフィール画像のURL
  const [displayName, setDisplayName] = useState('KENTA'); // ユーザーの表示名
  const [displayEmail, setDisplayEmail] = useState('kobe@denshi.jp'); // ユーザーの表示名

  useEffect(() => {
    // ユーザーデータを取得するための非同期関数
    const fetchUserData = async () => {
      const currentUser = FirebaseAuth().currentUser;
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setDisplayName(userData.displayName || '');
          if (userData.photoUri) {
            // 画像のURLを取得
            const url = await storage().ref(userData.photoUri).getDownloadURL();
            setPhotoUri(url);
          }
        }
      }
    };

    fetchUserData();
  }, []);

  // ユーザーの表示名を保存する関数
  const handleSave = async () => {
    if (user) {
      await firestore().collection('users').doc(user.uid).update({
        displayName,
      });
      setIsEditing(false); // 編集モードを終了
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
    const filename = uri.split('/').pop(); // ファイル名を取得
    const uploadUri = uri;
    try {
      // Firebase Storageに画像をアップロード
      await storage().ref(`profilePhotos/${filename}`).putFile(uploadUri);
      const url = await storage().ref(`profilePhotos/${filename}`).getDownloadURL(); // アップロードした画像のURLを取得
      await firestore().collection('users').doc(user.uid).update({ photoUri: url }); // ユーザーのドキュメントにURLを保存
      return url;
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const [isFollowModalVisible, setIsFollowModalVisible] = useState(false); // フォローモーダルの表示状態を管理
  const [isFollowerModalVisible, setIsFollowerModalVisible] = useState(false); // フォロワーモーダルの表示状態を管理

  const handleFollowPress = () => {
    // Followテキストが押されたときにフォローモーダルを表示
    setIsFollowModalVisible(true);
  };

  const handleFollowerPress = () => {
    // Followerテキストが押されたときにフォロワーモーダルを表示
    setIsFollowerModalVisible(true);
  };

  const handleCloseFollowModal = () => {
    // フォローモーダルを閉じる
    setIsFollowModalVisible(false);
  };

  const handleCloseFollowerModal = () => {
    // フォロワーモーダルを閉じる
    setIsFollowerModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileContainer}>
        {/* フォロワーの検索へのボタン */}
        <View style={styles.searchbtn}>
          <Button title="SEARCH Follower" />
        </View>

        {/* プロフィール画像がある場合に表示し、ない場合はプレースホルダーを表示。画像タップでライブラリを開く*/}
        <TouchableOpacity onPress={handlePickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder} />
          )}
        </TouchableOpacity>
        {/* フォロー、フォロワーを表示 */}
         {/* フォロー、フォロワーを表示 */}
      <View style={styles.FFnum}>
        <TouchableOpacity onPress={handleFollowPress}>
          <Text style={styles.text}>Follow: 20</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleFollowerPress}>
          <Text style={styles.text}>Follower: 123,456,789</Text>
        </TouchableOpacity>
      </View>

      {/* フォローモーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFollowModalVisible}
        onRequestClose={handleCloseFollowModal} // Androidの戻るボタンで閉じるために必要
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text>Follow</Text>
            <Button title="閉じる" onPress={handleCloseFollowModal} />
          </View>
        </View>
      </Modal>

      {/* フォロワーモーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFollowerModalVisible}
        onRequestClose={handleCloseFollowerModal} // Androidの戻るボタンで閉じるために必要
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text>Follower</Text>
            <Button title="閉じる" onPress={handleCloseFollowerModal} />
          </View>
        </View>
      </Modal>
        {/* ユーザーネームを表示し、テキストボックスに入力でユーザーネーム変更*/}
        <Text style={styles.displayName}>USERNAME</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.textInput}
        />
        {/* メールアドレスを表示し、テキストボックスに入力でメールアドレス変更*/}
        <Text style={styles.displayName}>Email</Text>
        <TextInput
          value={displayEmail}
          onChangeText={setDisplayEmail}
          style={styles.textInput}
        />

        <Link href={{ pathname: "/" }} asChild>
          <Text style={styles.linklabel}>Change password?</Text>
        </Link>

        <Button title="Save" onPress={handleSave} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileContainer: {
    alignItems: 'center',
  },
  searchbtn: {
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    width: '90%',
    backgroundColor: '#fff',
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
    backgroundColor: '#ccc',
  },text: {
    fontSize:16,
    fontWeight:'600',
    },
  FFnum:{
    flexDirection: 'row',
    justifyContent: 'space-between', 
    width: '90%',
    marginTop: 15,
  }, 
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 背景を半透明に
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',},
  displayName: {
    fontSize: 15,
    marginTop: 20,
    textAlign: 'left',
    width: '90%',
  },
  textInput: {
    borderBottomWidth: 1,
    width: '90%',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 20,
  },
  linklabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
    textDecorationLine: "underline",
    color: "#1a0dab",
  }
});

export default myPage;
