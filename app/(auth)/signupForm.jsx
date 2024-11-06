import React, { useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";
import { Link, useRouter } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const auth = FirebaseAuth();

export default function SignupScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPasswordVal, setUserPasswordVal] = useState("");
  const [userName, setUserName] = useState("");

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  const navigateLogin = () => {
    router.push("/loginForm");
  };

  const signUpWithEmail = async () => {
    try {
      await auth.createUserWithEmailAndPassword(userEmail, userPassword);

      const credential = await auth.signInWithEmailAndPassword(
        userEmail,
        userPassword
      );

      const update = {
        displayName: userName,
      };

      await auth.currentUser.updateProfile(update);

      firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .set({
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName,
          email: auth.currentUser.email,
          lastPostAt: "0", // TODO
          publicStatus: 0, // TODO
          spotCreate: 0,
          spotPoint: 0,
          photoURL:
            "https://firebasestorage.googleapis.com/v0/b/mapapp-96457.appspot.com/o/profile%2Fphoto17256005513463?alt=media&token=847894f6-3cb5-46c5-833e-91e30bc3ede8",
        })
        .then()
        .catch((error) => console.log(error));

      firestore().collection("star").doc(auth.currentUser.uid).set({});

      router.replace({ pathname: "/" });
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.pagetitle}>SIGN UP</Text>

        <Text style={styles.displayName}>Email</Text>
        <TextInput
          style={styles.textInput}
          value={userEmail}
          onChangeText={setUserEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Email"
        />
        <Text style={styles.displayName}>Username</Text>
        <TextInput
          style={styles.textInput}
          value={userName}
          onChangeText={setUserName}
          placeholder="Username"
        />
        <Text style={styles.displayName}>Password</Text>
        <TextInput
          style={styles.textInput}
          value={userPassword}
          onChangeText={setUserPassword}
          secureTextEntry
          placeholder="Password"
        />
        <Text style={styles.displayName}>Confirm Password</Text>
        <TextInput
          style={styles.textInput}
          value={userPasswordVal}
          onChangeText={setUserPasswordVal}
          secureTextEntry
          placeholder="Confirm Password"
        />

        <TouchableOpacity style={styles.submit} onPress={signUpWithEmail}>
          <Text style={styles.submitText}>Sign Up</Text>
        </TouchableOpacity>

        <Text style={styles.noamllabel}>Have an account?</Text>

        <TouchableOpacity style={styles.button} onPress={navigateLogin}>
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>{"<"} Back</Text>
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
  pagetitle: {
    fontSize: 30,
    textAlign: "center",
    fontWeight: "300",
  },
  displayName: {
    fontSize: 15,
    marginTop: 20,
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
    borderBottomWidth: 2,
    marginVertical: 16,
    color: "black",
    fontWeight: "300",
  },
  noamllabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
    fontWeight: "300",
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
  submit: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "black",
    height: 50,
    marginTop: 10, // ボタン間にスペースを追加
  },
  submitText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f2f2f2",
    textAlign: "center",
  },
  button: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F2F2",
    height: 50,
    marginTop: 10, // ボタン間にスペースを追加
  },
  buttonText: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    fontWeight: "300",
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
