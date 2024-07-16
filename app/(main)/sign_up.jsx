import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSignUp = async () => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Firestoreにユーザー情報を保存
      await firestore().collection('users').doc(user.uid).set({
        email: user.email,
        username: username,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('User registered successfully!');
    } catch (error) {
      console.error('Error signing up:', error);
      Alert.alert('Error signing up:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="Username"
      />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="Email"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
      />
      <Button
        title="SIGN UP"
        onPress={handleSignUp}
        style={styles.button}
      />
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
  button: {
    marginTop: 10,
  },
});

export default SignUp;
