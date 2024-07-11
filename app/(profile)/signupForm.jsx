import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { setTextRange } from "typescript";

const SignupScreen = () => {
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="email"
      />
      <TextInput
        style={styles.input}
        value={password1}
        onChangeText={setPassword1}
        secureTextEntry
        placeholder="Password"
      />
      <TextInput
        style={styles.input}
        value={password2}
        onChangeText={setPassword2}
        secureTextEntry
        placeholder="Confirm Password"
      />
      <TextInput style={styles.input} placeholder="Username" />
      <Link href={{ pathname: "/" }} asChild>
        <Button title="SIGN UP" style={styles.button} />
      </Link>
      <Text style={styles.noamllabel}>Have an account?</Text>

      <Link href={{ pathname: "/loginForm" }} asChild>
        <Button title="LOGIN" style={styles.button} />
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    margin: 10,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 2,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  noamllabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
  },
  linklabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
    textDecorationLine: "underline",
    color: "#1a0dab",
  },
});

export default SignupScreen;
