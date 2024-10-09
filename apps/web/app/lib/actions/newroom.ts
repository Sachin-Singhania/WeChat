"use server"
import db from "@repo/db/client";
import { getServerSession } from "next-auth"
import { authOptions } from "../auth"
interface newRoom{
    roomName: string,
    ownerId:string,
    description:string,
    profile:string
}
export async function newRoom(room:newRoom) {
    const session= getServerSession(authOptions);
    if(!session){
        return "Internal Server Error" ;
    }
    try {
        const response = await db.room.create({
            data:{
                roomName:room.roomName,
                roomType:"Group",
                ownerId:room.ownerId,
                description:room.description || null,
                profile:room.profile ||null
            }
        })
        return {
            message: "Success",
            Room:response
        }
    } catch (error) {
        return {
            status_code: 500,
            message:"Internal Server Error"
        }
    }
};
export async function pvtchatroom(userid:string,anotherid:string) {
    const session= getServerSession(authOptions);
    if(!session){
        return "Internal Server Error" ;
    }
    try {
        const users = await db.user.findMany({
            where: {
                OR: [
                    { uid: userid },
                    { uid: anotherid }
                ]
            }
        });
        const roomname = `${users[0].name}-${users[1].name}`;
        const response=await db.room.create({
            data:{
                roomName:roomname,roomType:"DM",ownerId:userid,roomMembers: {
                    create: [
                        { uid: userid },   
                        { uid: anotherid } 
                    ]         
                }
            }
        })
        return response;
    } catch (error) {
        console.log(error)
    }
}
export async function joiningroom(roomId:string) {
    const session= getServerSession(authOptions);
    if(!session){
        return "Internal Server Error" ;
    }
    try {
        const response = await db.room.findUnique({
            where:{
                roomId:roomId
            },select:{
                messages:{
                    select:{
                        content:true,roomId:true,uid:true
                    }
                },
                roomId:true,profile:true,roomName:true
            }
        })
        if (!response) {
            return new Error("No such roomId or error");
        }
        console.log(response.messages);
        return {
            message: "Room Found",
            roomId:response.roomId,
            profile:response.profile,
            roomName:response.roomName,
            Messages:response.messages
        }
    } catch (error) {
        return {
            status_code: 500,
            message:"Internal Server Error"
        }
    }
};
export async function roomMemberadded(roomId:string,userId:string) {
    const session= getServerSession(authOptions);
    if(!session){
        return "Internal Server Error" ;
    }
    try {
        const response=await db.roomMember.create({
            data:{
                uid:userId,roomId
            }
        })
        if (!response) {
            return new Error("No such roomId or error");
        }
        return response;
    } catch (error) {
        return {
            status_code: 500,
            message:"Internal Server Error"
        }
    }
};
export async function fetchrooms(userId:string) {
    const session= getServerSession(authOptions);
    if(!session){
        return "Internal Server Error" ;
    }
    try {
          const response= await db.room.findMany({
            where: {
              roomMembers: {
                some: {
                  uid: userId
                }
              }
            },select: {
                roomName: true,roomId:true,profile:true,roomType:true,
                messages: {
                  orderBy: {
                    timestamp: 'desc'
                  },
                  take: 1,
                  select: {
                    content: true,
                    timestamp: true,
                  }
                },roomMembers:{
                    select:{
                        uid:true,isGroupAdmin:true,roomId:true,
                        user:{
                            select:{
                                name:true
                            }
                        }
                    }
                }
              },orderBy:{
                createdAt:'desc'
              }
          });
        if (!response) {
            return new Error("No such roomId or error");
        }
        const roomsWithDisplayNames = response.map(room => {
            let displayName = room.roomName;

            // For DM rooms, calculate the correct displayName
            if (room.roomType === 'DM') {
                const user1Id = room.roomMembers[0]?.uid;
                const user2Id = room.roomMembers[1]?.uid;
                const user1name = room.roomMembers[0]?.user.name;
                const user2name = room.roomMembers[1]?.user.name;

                if (user1Id && user2Id) {
                    const userNames: { [key: string]: string | undefined } = {
                        [user1Id]: user1name,
                        [user2Id]: user2name,
                    };

                    // Set the displayName based on the logged-in user
                    displayName = (userId === user1Id) ? userNames[user2Id] : userNames[user1Id];
                }
            }

            // Return the room with the modified displayName
            return {
                ...room,
                displayName: displayName || room.roomName, // Default to roomName if displayName isn't set
            };
        });
        return {
            Rooms: roomsWithDisplayNames
        };
    } catch (error) {
        return {
            status_code: 500,
            message:"Internal Server Error"
        }
    }
};
export async function fetchcontact(roomId:string) {
    const session= getServerSession(authOptions);
    if(!session){
        return "Internal Server Error" ;
    }
    try {
          const response= await db.room.findFirst({
            where: {
                roomId:roomId
            },select: {
                roomName: true,roomId:true,profile:true,
                messages: {
                  orderBy: {
                    timestamp: 'desc'
                  },
                  take: 1,
                  select: {
                    content: true,
                    timestamp: true,
                  }
                }
              }
          });
        if (!response) {
            return new Error("No such roomId or error");
        }
        return {
            Rooms:response
        }
    } catch (error) {
        return {
            status_code: 500,
            message:"Internal Server Error"
        }
    }
};
export async function Search(name:string | undefined,userId:string) {
    const session= getServerSession(authOptions);
    if(!session){
        return "Internal Server Error" ;
    }
    try {
        if (name=='') {
            return;
        }
        const users= await db.user.findMany({
            where:{
                name:{
                    contains:name,
                    mode:'insensitive'
                }
            }
        })
        return users;
    } catch (error) {
         return {
            status_code: 404,
            message:"Not Found"
        }
    }
}
export async function get_user_info(userId:string) {
    const session= getServerSession(authOptions);
    if(!session){
        return "Internal Server Error" ;
    }
    try {
        const response=await db.user.findFirst({
            where:{
                uid:userId
            },select:{
                name:true
            }
        })
        return response;
    } catch (error) {
        return {
            message:"Something went wrong while fetching info",
            status:'404'
        }
    }
}