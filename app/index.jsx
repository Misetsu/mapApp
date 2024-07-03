import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, Dimensions, StyleSheet, TouchableOpacity, Image } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker } from "react-native-maps";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Firebaseの設定
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const TrackUserMapView = () => {
  const [position, setPosition] = useState({
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    altitude: 0,
    altitudeAccuracy: 0,
    heading: 0,
    speed: 0,
  });
  const [error, setError] = useState(null);
  const [markerPositions, setMarkerPositions] = useState([]);

  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        setPosition(position.coords);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, distanceFilter: 1 }
    );
    return () => Geolocation.clearWatch(watchId);
  }, []);

  const handlePost = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('写真ライブラリにアクセスするためには、許可が必要です。');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.cancelled) {
        const newMarker = {
          latitude: position.latitude,
          longitude: position.longitude,
          imageUri: result.uri,
        };
        setMarkerPositions((prevMarkers) => [...prevMarkers, newMarker]);

        // 画像をFirebase Storageにアップロード
        const response = await fetch(result.uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `images/${Date.now()}_${result.uri.split('/').pop()}`);
        await uploadBytes(storageRef, blob);

        // アップロードした画像のメタデータをFirebase Firestoreに保存
        const downloadURL = await getDownloadURL(storageRef);
        await addDoc(collection(db, 'images'), {
          latitude: position.latitude,
          longitude: position.longitude,
          storagePath: storageRef.fullPath,
          createdAt: new Date(),
        });
        console.log('画像がFirebase Storageにアップロードされ、Firestoreにメタデータが保存されました');
      }
    } catch (error) {
      console.error('画像のアップロード中にエラーが発生しました:', error);
    }
  };

  const fetchMarkers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'images'));
      const markers = [];
      querySnapshot.forEach(async (doc) => {
        const data = doc.data();
        const storageRef = ref(storage, data.storagePath);
        const downloadURL = await getDownloadURL(storageRef);
        markers.push({
          latitude: data.latitude,
          longitude: data.longitude,
          imageUri: downloadURL,
        });
      });
      setMarkerPositions(markers);
    } catch (error) {
      console.error('マーカーの取得中にエラーが発生しました:', error);
    }
  };

  useEffect(() => {
    fetchMarkers();
  }, []);

  const handleMarkerPress = (marker) => {
    if (marker.imageUri) {
      alert(`このピンには画像があります。`);
    } else {
      alert(`このピンには画像がありません。`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <MapView style={styles.map} region={{
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }}>
        {markerPositions.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            onPress={() => handleMarkerPress(marker)}
          >
            <Image
              source={{ uri: marker.imageUri }}
              style={styles.markerImage}
            />
          </Marker>
        ))}
      </MapView>
      <TouchableOpacity style={styles.postButton} onPress={handlePost}>
        <Text style={styles.postButtonText}>投稿</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  errorContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "red",
    padding: 10,
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
  },
  postButton: {
    position: "absolute",
    bottom: 50,
    left: width / 2 - 50,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    padding: 10,
    width: 100,
    alignItems: "center",
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default TrackUserMapView;
