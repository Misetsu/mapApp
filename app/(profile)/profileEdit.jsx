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
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/FontAwesome5";

const auth = FirebaseAuth();
const router = useRouter();

const myPage = () => {
  const [user, setUser] = useState(null);
  const [photoUri, setPhotoUri] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [userStatus, setUserStatus] = useState(0);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleBackPress = () => {
    router.back();
  };

  useEffect(() => {
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

  const handleSave = async () => {
    if (user) {
      await firestore().collection("users").doc(user.uid).update({
        displayName: displayName,
        email: displayEmail, // Emailの更新をFirestoreに反映
      });
      await auth.currentUser.updateProfile({ displayName: displayName });
      await auth.currentUser.updateEmail(displayEmail); // Emailの変更
      Alert.alert("Success", "Changes have been saved successfully.");
    }
  };

  const reauthenticateUser = async (currentPassword) => {
    const credential = FirebaseAuth.EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    try {
      await auth.currentUser.reauthenticateWithCredential(credential);
      return true;
    } catch (error) {
      Alert.alert("Error", "Current password is incorrect.");
      return false;
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    const isReauthenticated = await reauthenticateUser(currentPassword);

    if (isReauthenticated) {
      try {
        await auth.currentUser.updatePassword(newPassword);
        Alert.alert("Success", "Password has been changed successfully.");
        setShowPasswordForm(false);
      } catch (error) {
        Alert.alert("Error", "Failed to change password.");
      }
    }
  };

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

  return (
    <ScrollView>
      <TouchableOpacity onPress={handleBackPress} style={{ width: 50, height: 50, justifyContent: "center", alignItems: "center" }}>
        <Icon name="angle-left" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.pagetitle}>Profile Edit</Text>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={handlePickImage}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.displayName}>Username</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.textInput}
        />

        <Text style={styles.displayName}>Email</Text>
        <TextInput
          value={displayEmail}
          onChangeText={setDisplayEmail}
          style={styles.textInput}
        />

        {/* 変更を反映させるボタン */}
        <TouchableOpacity
          style={styles.submit}
          onPress={handleSave}
        >
          <Text style={styles.submitText}>Apply changes</Text>
        </TouchableOpacity>

        {/* パスワード変更ボタン */}
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => setShowPasswordForm(!showPasswordForm)}
        >
          <Text style={styles.changePasswordButtonText}>
            {showPasswordForm ? "Cancel" : "Change Password"}
          </Text>
        </TouchableOpacity>

        {/* パスワード変更フォーム */}
        {showPasswordForm && (
          <>
            <Text style={styles.displayName}>Current Password</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={styles.textInput}
              secureTextEntry={true}
            />

            <Text style={styles.displayName}>New Password</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.textInput}
              secureTextEntry={true}
            />

            <Text style={styles.displayName}>Confirm New Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.textInput}
              secureTextEntry={true}
            />

            <TouchableOpacity
              style={styles.submit}
              onPress={handleChangePassword}
            >
              <Text style={styles.submitText}>Submit Password Change</Text>
            </TouchableOpacity>
          </>
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
  displayName: {
    fontSize: 15,
    marginTop: 10,
    marginLeft: 10,
    textAlign: "left",
    alignItems: "flex-start",
    fontWeight: "300",
  },
  textInput: {
    margin: 10,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 2,
    marginVertical: 16,
    color: "black",
    fontWeight: "300",
  },
  changePasswordButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007BFF",
    height: 50,
    marginVertical: 10,
  },
  changePasswordButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
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
});

export default myPage;
