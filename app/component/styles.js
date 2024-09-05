// styles.js
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
  spot: {
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 20 / 20,
    overflow: "hidden",
    backgroundColor: "#c71585",
  },
  container: {
    width: "100%",
    height: "100%",
  },
  map: {
    flex: 1,
  },
  debugContainer: {
    backgroundColor: "#fff",
    opacity: 0.8,
    position: "absolute",
    bottom: 10,
    left: 10,
    padding: 10,
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
  markerImage: {
    width: 50,
    height: 50,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  loignBtnContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 5,
    padding: 10,
  },
  mapfixed: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 5,
    padding: 10,
  },
});

export const customMapStyle = [
  {
    featureType: "poi.business", // ビジネス（ビル、店舗など）のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.business", // ビジネス（ビル、店舗など）のアイコンを非表示
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.attraction", // 観光スポットのラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.government", // 政府機関のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.medical", // 医療施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.park", // 公園のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.place_of_worship", // 宗教施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.school", // 学校のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.sports_complex", // スポーツ施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "road", // 道路の号線表示を非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality", // 町、村、区のラベルを非表示
    elementType: "labels.text.fill",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality", // 町、村、区のラベルのアウトラインを非表示
    elementType: "labels.text.stroke",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood", // 住所（丁目）のラベルを非表示
    elementType: "labels.text.fill",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood", // 住所（丁目）のラベルのアウトラインを非表示
    elementType: "labels.text.stroke",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },

  //ここから地図の色
  {
    featureType: "landscape.natural", // 自然地形の色
    elementType: "geometry",
    stylers: [
      {
        color: "#66bb66",
      },
    ],
  },
  {
    featureType: "landscape.man_made", //地面の色
    elementType: "geometry",
    stylers: [
      {
        color: "#e0ffe0",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#6699ff", // 水の色を青色に変更
      },
    ],
  },
  {
    featureType: "road", //  一般道の色
    elementType: "geometry",
    stylers: [
      {
        color: "#404040",
      },
    ],
  },
  {
    featureType: "road", // 一般道の枠線
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#fcfcfc",
        weight: 1,
      },
    ],
  },
  {
    featureType: "road.highway", // 高速道路の色
    elementType: "geometry",
    stylers: [
      {
        color: "#808080",
      },
    ],
  },
  {
    featureType: "road.highway", // 高速道路の枠線の色
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#fcfcfc",
        weight: 1,
      },
    ],
  },
  {
    featureType: "poi.park", // 公園の色
    elementType: "geometry",
    stylers: [
      {
        color: "#99dd66",
      },
    ],
  },
  {
    featureType: "transit.line", // 鉄道の色
    elementType: "geometry",
    stylers: [
      {
        color: "#33ccff",
      },
    ],
  },
  {
    featureType: "transit.line", // 鉄道の枠線の太さ
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#ffffff",
        weight: 1,
      },
    ],
  },
  {
    featureType: "poi.school", // 教育機関の色
    elementType: "geometry",
    stylers: [
      {
        color: "#ffeecc",
      },
    ],
  },
  {
    // 医療機関の背景色を指定（例: 薄いピンク色）
    featureType: "poi.medical",
    elementType: "geometry",
    stylers: [
      {
        color: "#ffdddd",
      },
    ],
  },
];
