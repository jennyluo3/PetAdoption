
import { View, Text, FlatList, TextInput, Button, KeyboardAvoidingView } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { addDoc, collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { useUser } from "@clerk/clerk-expo";
import moment from "moment";

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    GetUserDetails();

    const unsubscribe = onSnapshot(
      collection(db, "Chat", params?.id, "Messages"),
      (snapshot) => {
        const messageData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by timestamp (newest last)
        const sorted = messageData.sort((a, b) =>
          moment(a.createdAt, "MM-DD-YYYY HH:mm:ss").isBefore(
            moment(b.createdAt, "MM-DD-YYYY HH:mm:ss")
          )
            ? 1
            : -1
        );

        setMessages(sorted);
      }
    );

    return () => unsubscribe();
  }, []);

  const GetUserDetails = async () => {
    const docRef = doc(db, "Chat", params?.id);
    const docSnap = await getDoc(docRef);

    const result = docSnap.data();
    const otherUser = result?.users.filter(
      (item) => item.email != user?.primaryEmailAddress?.emailAddress
    );

    navigation.setOptions({
      headerTitle: otherUser[0]?.name || "Chat",
    });
  };

  const onSend = async () => {
    if (!input.trim()) return;

    const newMessage = {
      text: input,
      createdAt: moment().format("MM-DD-YYYY HH:mm:ss"),
      from: user?.primaryEmailAddress?.emailAddress,
      name: user?.fullName,
      avatar: user?.imageUrl,
    };

    await addDoc(collection(db, "Chat", params.id, "Messages"), newMessage);
    setInput("");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, padding: 10 }} behavior="padding">
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf:
                item.from === user?.primaryEmailAddress?.emailAddress
                  ? "flex-end"
                  : "flex-start",
              backgroundColor:
                item.from === user?.primaryEmailAddress?.emailAddress
                  ? "#4e9bde"
                  : "#ccc",
              borderRadius: 10,
              padding: 8,
              marginVertical: 4,
              maxWidth: "70%",
            }}
          >
            <Text
              style={{
                color:
                  item.from === user?.primaryEmailAddress?.emailAddress
                    ? "#fff"
                    : "#000",
              }}
            >
              {item.text}
            </Text>
          </View>
        )}
      />
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 20,
            paddingHorizontal: 10,
          }}
        />
        <Button title="Send" onPress={onSend} />
      </View>
    </KeyboardAvoidingView>
  );
}


