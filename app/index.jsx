import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, Dimensions, StyleSheet, TouchableOpacity, Image } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker } from "react-native-maps";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

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
  const [initialRegion, setInitialRegion] = useState(null);
  const [markerPositions, setMarkerPositions] = useState([]);

  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        setPosition(position.coords);
        if (!initialRegion) {
          setInitialRegion({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
        }
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, distanceFilter: 1 }
    );
    return () => Geolocation.clearWatch(watchId);
  }, [initialRegion]);

  const handlePost = async () => {
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
        imageUri: result.uri, // 画像のURIを保存
      };
      setMarkerPositions((prevMarkers) => [...prevMarkers, newMarker]);
    }
  };

  const handleMarkerPress = (marker) => {
    if (marker.imageUri) {
      alert(`このピンには画像があります。`);
    } else {
      alert(`このピンには画像がありません。`);
    }
  };

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {initialRegion && (
        <MapView
          key={`${initialRegion.latitude}-${initialRegion.longitude}`}
          style={StyleSheet.absoluteFillObject}
          region={{
            latitude: position.latitude,
            longitude: position.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
        >
          <Marker coordinate={position}>
            <View style={styles.radius}>
              <View style={styles.marker} />
            </View>
          </Marker>
          {markerPositions.map((marker, index) => (
            <Marker key={index} coordinate={marker} onPress={() => handleMarkerPress(marker)}>
              {marker.imageUri ? (
                <Image
                  source={{ uri: marker.imageUri }} // URIから画像を表示
                  style={styles.customMarkerImage}
                />
              ) : null}
            </Marker>
          ))}
        </MapView>
      )}
      <TouchableOpacity style={styles.postButton} onPress={handlePost}>
        <Text style={styles.postButtonText}>投稿</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  radius: {
    width: 50,
    height: 50,
    borderRadius: 50 / 2,
    overflow: "hidden",
    backgroundColor: "rgba(0, 112, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 112, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 20 / 2,
    overflow: "hidden",
    backgroundColor: "#007AFF",
  },
  customMarkerImage: {
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
