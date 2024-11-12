const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendFollowNotification = functions.firestore
    .document("follow/{uid}")
    .onUpdate((change, context) => {
      const beforeFollowerIds = change.before.data().followerId || [];
      const afterFollowerIds = change.after.data().followerId || [];
      const newFollowers =
      afterFollowerIds.filter((id) => !beforeFollowerIds.includes(id));
      return Promise.all(
          newFollowers.map((followerId) => {
            return sendFollowNotification(followerId, context.params.uid);
          }),
      );
    });

const sendFollowNotification = (followerId, uid) => {
  return admin.firestore()
      .collection("users")
      .doc(followerId)
      .get()
      .then((userDoc) => {
        if (!userDoc.exists) {
          return null;
        }
        const userData = userDoc.data();
        const followerName = userData.name || "匿名のユーザー";
        const message = {
          notification: {
            title: `${followerName}さんがあなたをフォローしました！`,
            body: `${followerName}さんがあなたのフォロワーになりました。`,
          },
          token: userData.fcmToken,
        };

        return admin.messaging().send(message);
      })
      .catch((error) => {
        console.error("通知の送信に失敗しました:", error);
      });
};
