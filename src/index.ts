import { WebSocketServer, WebSocket } from "ws";
import { publishclient, subscribeClient } from "./redis";
const wss = new WebSocketServer({ port: 8081 });

const subscriptions: {
  [key: string]: {
    ws: WebSocket;
    rooms: string[];
  };
} = {};

// setInterval(() => {
//   console.log("subscriptions", subscriptions);
// }, 5000);

wss.on("connection", function connection(usersocket) {
  const id = RandonID();

  subscriptions[id] = {
    ws: usersocket,
    rooms: [],
  };

  usersocket.on("message", function message(data) {
    const parsedMessage = JSON.parse(data as unknown as string);
    if (parsedMessage.type === "SUBSCRIBE") {
      subscriptions[id].rooms.push(parsedMessage.room);
      console.log("subscribing on pun sub on room", parsedMessage.room);
      if (OneUserScribedTo(parsedMessage.room)) {
        subscribeClient.subscribe(parsedMessage.room, (message) => {
          const parsedMessage = JSON.parse(message);
          Object.keys(subscriptions).forEach((userid) => {
            const { ws, rooms } = subscriptions[userid];
            if (rooms.includes(parsedMessage.roomId)) {
              ws.send(parsedMessage.message);
            }
          });
        });
      }
    }

    if (parsedMessage.type === "UNSUBSCRIBE") {
      subscriptions[id].rooms = subscriptions[id].rooms.filter((x) => {
        x !== parsedMessage.room;
      });
      if (lastPersonLeftRoom(parsedMessage.room)) {
        console.log("unsubscribing on pun sub on room", parsedMessage.room);
        subscribeClient.unsubscribe(parsedMessage.room);
      }
    }

    if (parsedMessage.type === "sendMessage") {
      const message = parsedMessage.message;
      const roomId = parsedMessage.roomId;

      publishclient.publish(
        roomId,
        JSON.stringify({
          type: "message",
          message: message,
          roomId: roomId,
        })
      );

      //   Object.keys(subscriptions).forEach((userid) => {
      //     const { ws, rooms } = subscriptions[userid];
      //     if (rooms.includes(roomId)) {
      //       ws.send(message);
      //     }
      //   });
    }
  });
});

console.log("websocket server is lisening on port 8081");

function RandonID() {
  return Math.random();
}

function OneUserScribedTo(roomId: string) {
  let interestedpeople = 0;
  Object.keys(subscriptions).forEach((userid) => {
    const { rooms } = subscriptions[userid];
    if (rooms.includes(roomId)) {
      interestedpeople++;
    }
  });

  if (interestedpeople > 0) {
    return true;
  }
  return false;
}

function lastPersonLeftRoom(roomId: string) {
  let interestedpeople = 0;
  Object.keys(subscriptions).forEach((userid) => {
    const { rooms } = subscriptions[userid];
    if (rooms.includes(roomId)) {
      interestedpeople++;
    }
  });

  if (interestedpeople === 0) {
    return true;
  }
  return false;
}
