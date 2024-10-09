"use client"
import Image from "next/image";
import video from "./../../assests/video-camera.png";
import call from "./../../assests/call.png";
import more from "./../../assests/more.png";
import sendIcon from "./../../assests/send.png";
import emojiIcon from "./../../assests/send.png";
import noprofile from "./../../assests/noprofile.png";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { SocketProvider, useSocket } from "../../context/SocketProvider";
import Link from "next/link";
import { pvtchatroom, Search } from "../../lib/actions/newroom";

const Page = () => {
    const { Notifications } = useSocket();
    return (
        <>
            <div className="flex justify-evenly w-full h-screen bg-gray-100">
                <div className="w-1/5 bg-gray-100"><Rooms /></div>
                <div className="w-3/5 flex flex-col"><Chats /></div>
                {Notifications ?
                    <div className="w-1/5 overflow-y-auto bg-gray-100"><Noti /></div> :
                    <div className="w-1/5 overflow-y-auto bg-gray-100"><Group /></div>
                }
            </div>
        </>
    );
};
// const useDebouncing = (name: string, delay: number) => {
//     const { userId } = useSocket()
//     const [debouncedValue, setDebouncedValue] = useState([]);
//     useEffect(() => {
//         const timer = setTimeout(async () => {
//             const res = await Search(name, userId);
//             setDebouncedValue(res);
//         }, delay);
//         return () => {
//             clearTimeout(timer);
//         }
//     }, [name, delay])
//     return debouncedValue;
// }

const Rooms = () => {
    const { setNotifications, setrooms, switchRoom, userId, handlepvtroom } = useSocket();
    const [value, setValue] = useState('');

    // Search Globally
    // const debouncedSearchResults = useDebouncing(value, 1000);
    // useEffect(() => {
    //     if (debouncedSearchResults && value) {
    //         const filteredRooms = debouncedSearchResults
    //             .filter((room) => room?.name.toLowerCase().includes(value.toLowerCase()))
    //             .slice(0, 8);
    //         setactive(filteredRooms);
    //     } else {
    //         setactive([]);
    //     }
    // }, [debouncedSearchResults, value]);

    // const handleSearch = (e) => {
    //     setValue(e.target.value);
    // };
    // const handleprivateroom = async (searchuserid: string) => {
    //     // delroom();
    //     const makenewroom = await pvtchatroom(userId, searchuserid);
    //     switchRoom(makenewroom?.roomId)
    //     handlepvtroom(makenewroom?.roomId, userId, searchuserid);

    // }
   const filtered=setrooms.filter(rooms=>
    rooms?.displayName?.toLowerCase().includes(value.toLowerCase())
   )

    return (
        <div className="flex flex-col h-screen">
            <div className="flex justify-between p-4">
                <div className="font-extrabold text-2xl">Chats</div>
                <div className="flex justify-center align-middle bg-custom-gradient text-white w-10 h-10 rounded-full text-center">
                    <button onClick={() => setNotifications(false)} className="text-4xl">+</button>
                </div>
            </div>
            <div className="flex gap-2 p-4 flex-wrap border-b text-gray-400">
                <button className="font-semibold">DIRECT</button>
                <button className="font-semibold">GROUPS</button>
                <button onClick={() => setNotifications(true)} className="font-semibold">NOTIFICATIONS</button>
            </div>
            <div className="relative flex align-middle pt-5 pr-3 pl-3 pb-3">
                <form className="w-full relative">
                    <div className="relative">
                        <input
                            type="search"
                            placeholder="Search..."
                            className="w-full h-10 rounded-xl p-3 shadow-md"
                            onChange={(e) => setValue(e.target.value)}
                            value={value}
                        />

                    </div>
                    {/* Search For Globally */}
                    {/* {active.length > 0 && (
                        <div className="absolute top-14 p-4 text-slate-800 bg-white w-full rounded-xl left-0 flex flex-col gap-2">
                            {active?.map((room, i) => (
                                <Link key={i} href="/home" onClick={() => handleprivateroom(room?.uid)}>
                                    <Searching
                                        pic={room?.pic}
                                        name={room?.name} />
                                </Link>
                            ))}
                        </div>
                    )} */}
                    {/* {active && active.length > 0 ? setrooms.map((room, i) => {
                        return (
                            <div className="top-14 p-4 text-slate-800 bg-white w-full rounded-xl left-0 flex flex-col gap-2">

                            <Link key={i} href="/home" onClick={() => switchRoom(room.roomId)}>
                                <Searching
                                    pic={room.profile}
                                    name={displayName} 
                                    />
                            </Link>
                            </div>
                        );
                        
                    }) : ''} */}

                </form>
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto">
                <div className="flex flex-col">
                    {filtered && filtered.length > 0 ? filtered.map((room, i) => {
                        return (
                            <Link key={i} href="/home" onClick={() => switchRoom(room.roomId)}>
                                <Profiles
                                    pic={room.profile}
                                    message={room?.messages[0]?.content ? room?.messages[0]?.content : "Hey Bro"}
                                    name={room.displayName} // Use displayName for DM logic
                                />
                            </Link>
                        );
                    }) : ''}
                </div>
            </div>
        </div>
    );
};
interface profile {
    name: string;
    message: string
    pic: string
}
interface search {
    name: string;
    pic: string
}
const Profiles = (profile: profile) => {
    return (
        <div className="p-3">
            <div className="flex rounded-xl p-2 flex-wrap bg-white shadow-md">
                <div className="w-1/5 flex justify-center items-center">
                    {/* <Image
                        src={'https://yo.com'}
                        width={2}
                        className={`object-cover w-12 h-12 rounded-full`}
                        alt="profile"
                    /> */}
                </div>
                <div className="w-3/5 flex flex-col justify-center pl-3">
                    <div className="font-bold">{profile.name}</div>
                    <div className="font-extralight text-sm overflow-hidden">{profile.message}</div>
                </div>
                <div className="w-1/5 flex flex-col justify-center items-center">
                    <div className="font-bold text-xs">3:43 PM</div>
                    <div className="flex justify-center items-center mt-1">
                        <div className="text-center w-6 h-6 rounded-full flex items-center justify-center bg-custom-gradient text-white">
                            1
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
const Searching = (profile: search) => {
    return (
        <div>
            <div className="flex rounded-xl p-2 flex-wrap bg-white shadow-md">
                <div className="w-1/5 flex justify-center items-center">
                    <Image
                        src={profile.pic ? profile.pic : noprofile}
                        className={`object-cover w-12 h-12 rounded-full`}
                        alt="profile"
                    />
                </div>
                <div className="w-3/5 flex flex-col justify-center pl-3">
                    <div className="font-bold">{profile.name}</div>
                </div>
            </div>
        </div>
    );
};
const ProfileChatBar = () => {
    const { setrooms, currentRoom } = useSocket();
    const room = setrooms.find(room => room.roomId === currentRoom);
    return (
        <>
            <div className="flex items-center ml-4">
                <div className="border-r border-black pr-4">
                    {/* <Image
                                src={room?.profile? room?.profile:noprofile}
                                className="object-cover w-12 h-12 rounded-full"
                                alt="profile"
                            /> */}
                </div>
                <div className="pl-4">
                    <div className="font-bold">{room?.displayName}</div>
                    <div className="text-sm text-gray-500">Online | Offline</div>
                </div>
            </div>
        </>
    )
}
const Chats = () => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { sendMessage, chatHistory, userId } = useSocket();
    const [message, setMessage] = useState<string>(""); const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const onEmojiClick = (emojiObject: { emoji: string; }) => {
        setMessage(prevMessage => prevMessage + emojiObject.emoji);
    };
    let refer = useRef(null);
    useEffect(() => {
        let handler = (e: MouseEvent) => {
            if (refer.current) {
                if (!e.composedPath().includes(refer.current) && refer.current) {
                    setShowEmojiPicker(false);
                }
            }
        }
        document.addEventListener("click", handler);
        return () => {
            document.removeEventListener("click", handler);
        };
    });
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSendMessage = () => {
        if (message.trim()) {
            sendMessage(message);
            setMessage('');
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="flex justify-between p-3 rounded-lg bg-white shadow-md mt-2">
                    <ProfileChatBar />
                    <div className="flex items-center space-x-4 mr-4">
                        <button>
                            <Image
                                src={call}
                                className="object-cover w-8 h-8 filter grayscale"
                                alt="phone"
                            />
                        </button>
                        <button>
                            <Image
                                src={video}
                                className="object-cover w-8 h-8"
                                alt="video"
                            />
                        </button>
                        <button>
                            <Image
                                src={more}
                                className="object-cover w-8 h-8"
                                alt="options"
                            />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col flex-1 overflow-hidden mt-4 bg-white">
                    <div className="flex-1 overflow-y-auto p-4 no-scrollbar" ref={chatContainerRef}>
                        <div className="flex flex-col gap-4">
                            {chatHistory?.map((msg, index) => (
                                <div key={index} className={`  rounded-lg p-3 max-w-xs break-words ${msg.uid == userId ? 'self-end text-white bg-custom-gradient' : 'self-start bg-gray-100 text-black'} `}>
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div id="EMOJI" className="p-4 bg-white shadow-md relative h-18">
                        {showEmojiPicker && (
                            <div className="absolute bottom-full mb-2" ref={refer}>
                                <EmojiPicker onEmojiClick={onEmojiClick} />
                            </div>
                        )}
                        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                            <button className="mr-2" onClick={() => setShowEmojiPicker(val => !val)}>
                                <Image
                                    src={emojiIcon}
                                    className="w-6 h-6"
                                    alt="emoji"
                                />
                            </button>
                            <input
                                type="text"
                                placeholder="Type a message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full bg-transparent outline-none"
                                onKeyDown={handleKeyDown}
                            />
                            <button onClick={handleSendMessage} className="ml-2 bg-custom-gradient p-2 rounded-full">
                                <Image
                                    src={sendIcon}
                                    className="w-4 h-4 filter invert"
                                    alt="send"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const Noti = () => {
    return (
        <>
            <div className="p-4">
                <div className="bg-white shadow-md rounded-xl p-4 mb-4">
                    <div className="font-bold mb-2">Notifications</div>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center p-2 border-b last:border-none">
                            <img
                                src="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg"
                                className="object-cover w-8 h-8 rounded-full mr-3"
                                alt="profile"
                            />
                            <div className="text-sm">
                                <span className="font-bold">Name </span>
                                mentioned you in a group.
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-white shadow-md rounded-xl p-4">
                    <div className="font-bold mb-2">Suggestions</div>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center p-2 border-b last:border-none">
                            <img
                                src="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg"
                                className="object-cover w-8 h-8 rounded-full mr-3"
                                alt="profile"
                            />
                            <div className="flex justify-between w-full flex-wrap">

                                <div className="text-sm flex-1">
                                    <span className="font-bold">Name {i + 1}</span>
                                </div>
                                <button className="bg-custom-gradient text-white px-4 py-1 rounded-full text-xs">
                                    Add
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
const Group = () => {
    const { joinRoom, newroom } = useSocket();
    const [groupName, setGroupName] = useState('');
    const [groupId, setgroupId] = useState('');
    const [description, setDescription] = useState('');
    const [profileImage, setProfileImage] = useState('');

    const handleCreateGroup = () => {
        newroom(groupName, profileImage, description);
    };
    const handlejoingroup = () => {
        joinRoom(groupId);
    };
    // @ts-ignore
    const handleProfileImageChange = (e) => {
        //     const file = e.target.files[0];
        //     if (file) {
        //         const reader:FileReader = new FileReader();
        //         reader.onloadend = () => {
        // // @ts-ignore
        //             setProfileImage(reader.result);
        //         };
        //         reader.readAsDataURL(file);
        //     }
    };

    return (
        <>
            <div className="p-4">
                <div className="bg-white shadow-md rounded-xl p-5 mb-5 ">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">New Group</h2>
                    <div className="mb-4">
                        <div className="flex items-center justify-center">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfileImageChange}
                                className="hidden"
                                id="profile-image-input"
                            />
                            <label htmlFor="profile-image-input" className="cursor-pointer">
                                {profileImage ? (
                                    <img
                                        src={'profileImage'}
                                        alt="Profile"
                                        className="w-16 h-16 object-cover rounded-full border"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-gray-500">Upload</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Group Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Description</label>
                        <textarea
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleCreateGroup}
                        className="w-full p-2 bg-custom-gradient text-white rounded-lg"
                    >
                        Create Group
                    </button>
                </div>
                <div className="bg-white shadow-md rounded-xl p-4">
                    <div className="font-bold mb-2">Join Group</div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Enter Group Id</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={groupId}
                            onChange={(e) => setgroupId(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handlejoingroup}
                        className="w-full p-2 bg-custom-gradient text-white rounded-lg"
                    >
                        Join Group
                    </button>
                </div>
            </div>
        </>
    );
};
const Homepage = () => (
    <SocketProvider>
        <Page />
    </SocketProvider>
);
export default Homepage;




