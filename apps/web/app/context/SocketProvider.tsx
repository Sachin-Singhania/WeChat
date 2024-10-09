"use client";

import { useSession } from 'next-auth/react';
import React, { createContext, use, useContext, useEffect, useState } from 'react';
import { newRoom, joiningroom, fetchrooms, roomMemberadded, fetchcontact,get_user_info } from '../lib/actions/newroom';

interface SocketContextProps {
  socket: WebSocket | null;
  sendMessage: (msg: string) => string | void;
  joinRoom: (room: string) => void;
  leaveroom: () => void;
  switchRoom: (room: string) => void;
  chatHistory: chatHistory[];
  currentRoom: string;
  USER_NAME: string;
  newroom: (roomName: string, profile: string, description: string) => Promise<void>;
  userId: string;
  Notifications: boolean;
  setNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  setrooms: joinedrooms[];
  currentRoomProfile: string;
  roomname: string;
  handlepvtroom:(roomId:string,userId:string,recv:string)=>void;
}

export interface joinedrooms {
  roomId: string;
  roomName: string;
  profile: string;
  roomType:string;
  messages: {
    content: string;
    timestamp: Date;
  }[];
  roomMembers:roomMembers[],
  displayName:string,
}
export interface roomMembers{
roomId: string;
        uid: string;
        user: {
            name: string;
        };
        isGroupAdmin: boolean;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface chatHistory {
  content: string;
  roomId: string;
  uid: string;
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  //@ts-ignore
  const userId = session?.user?.id || '';
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [chatHistory, setChatHistory] = useState<chatHistory[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [currentRoomProfile, setCurrentRoomProfile] = useState<string>('');
  const [roomname, setRoomname] = useState<string>('');
  const [Notifications, setNotifications] = useState<boolean>(true);
  const [setrooms, setSetrooms] = useState<joinedrooms[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [USER_NAME, setUSER_NAME] = useState('')
  useEffect(() => {
    if (!userId) {
      return;
    }
    const newSocket = new WebSocket('ws://localhost:8080');
    newSocket.onerror = () => {
      setIsConnected(false);
    };

    newSocket.onopen = () => {
      newSocket.send(JSON.stringify({ type: 'userId', userId }));
      setSocket(newSocket);
      setIsConnected(true);
    };
    
    const userInfo=async()=>{
      const response=await get_user_info(userId);
      if (response) {
        setUSER_NAME(response.name)
      }
    }
    // userInfo();
    return () => newSocket.close();
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    const handleOnMessage = (message: MessageEvent) => {
      const data = message.data;
      const newData = JSON.parse(data);
      const fetch= async () => {
        if (newData?.type=='NewContact') {
        const fetchone=await fetchcontact(newData.roomId);
        console.log(fetchone)
        setSetrooms((prev)=>[...prev,fetchone.Rooms]);
      }else{
        return;
      }
      }
      fetch();
      if (currentRoom !== newData.roomId) {
        alert(`You received a message in room ${newData.roomId}`);
      } else {
        setChatHistory((prev) => [...prev, newData]);
      }
    };

    socket.onmessage = handleOnMessage;

    return () => {
      socket.onmessage = null;
    };
  }, [currentRoom, socket]);

  useEffect(() => {
    if (!currentRoom) {
      return;
    }
    const switchRoom = async () => {
      try {
  //@ts-ignore
        const { roomId, Messages, profile, roomName } = await joiningroom(currentRoom);
        setCurrentRoom(roomId);
        setCurrentRoomProfile(profile);
        setRoomname(roomName);
        setChatHistory(Messages);
      } catch (error) {
        console.error("Something went wrong", error);
      }
    };
    switchRoom();
  }, [currentRoom]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetchrooms(userId);
        if (res) {
  //@ts-ignore
          setSetrooms(res?.Rooms);
          res?.Rooms.forEach(room => {
            socket?.send(JSON.stringify({ type: 'join', roomId: room.roomId, userId }));
          });
        }
      } catch (error) {
        console.error("Error fetching rooms", error);
      }
    };
    fetchRooms();
  }, [userId,socket,isConnected]);


  const sendMessage = (msg: string) => {
    if (!isConnected) {
      return "Server not working";
    }

    if (socket && currentRoom && userId) {
      socket.send(JSON.stringify({ type: 'message', roomId: currentRoom, data: msg, userId }));
      setChatHistory((prev) => [...prev, { content: msg, roomId: currentRoom, uid: userId }]);
    } else {
      console.log("No connection or room not selected");
    }
  };

  const joinRoom = async (room: string) => {
    try {
  //@ts-ignore
      const { roomId, Messages, roomName, profile } = await joiningroom(room);
    const addingmember=await roomMemberadded(roomId,userId);
      if (socket && userId && !setrooms.includes(roomId)) {
        socket.send(JSON.stringify({ type: 'join', roomId, userId }));
        if (Messages) {
          setChatHistory(Messages);
        }
        setCurrentRoom(roomId);
        setSetrooms((prev) => [...prev, { roomId, roomName, profile, messages: Messages }]);
      }
    } catch (error) {
      console.error("Error joining room", error);
    }
  };
  const handlepvtroom=(roomId:string,userId:string,recId:string)=>{
    socket?.send(JSON.stringify({type:'handlepvtroom',roomId,userId,recId}))
    socket?.send(JSON.stringify({type:'handlepvtroom', roomId, userId, recId }))

  }
  const leaveroom = () => {
    if (socket && currentRoom && userId) {
      socket.send(JSON.stringify({ type: 'leave', roomId: currentRoom, userId }));
      setSetrooms((prev) => prev.filter((room) => room.roomId !== currentRoom));
      setCurrentRoom('');
      setChatHistory([]);
    }
  };

  const switchRoom = (room: string) => {
    if (room !== currentRoom) {
      setCurrentRoom(room);
    }
  };

  const newroom = async (roomName: string, profile: string, description: string) => {
    try {
      if (roomName !== "") {
        const roomType = { roomName, ownerId: userId, profile, description };
        const response = await newRoom(roomType);
        //@ts-ignore
        const room = response.Room.roomId;
        console.log(room)
        const addingmember=await roomMemberadded(room,userId);
        console.log(addingmember)
        if (socket && userId) {
          console.log("If condition")
          socket.send(JSON.stringify({ type: 'join', roomId: room, userId }));
          console.log("If condition 2")
          setChatHistory([]);
          setCurrentRoom(room);
          console.log("If condition 3")
  //@ts-ignore
          if (setrooms.length>0) {
            setSetrooms((prev) => [...prev, { roomId: room, roomName: response.Room.roomName, profile: response.Room.profile, messages: [] }]);
          }
        }
      }
    } catch (error) {
      console.error("Error creating new room", error);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        sendMessage,
        joinRoom,
        leaveroom,
        switchRoom,
        chatHistory,
        currentRoom,
        newroom,
        userId,
        Notifications,
        setNotifications,
        setrooms,
        roomname,
        currentRoomProfile,
        handlepvtroom,USER_NAME
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
