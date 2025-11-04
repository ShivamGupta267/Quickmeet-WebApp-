import React, { useContext, useState, useEffect } from 'react'
import {
  Badge,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  CallEnd,
} from '@mui/icons-material';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat'
import { useRef } from 'react'
import styled from 'styled-components';
import io from "socket.io-client"
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/authContext';
import withAuth from '../utils/withAuth';


const serverURL = import.meta.env.VITE_API_URL

let connections = {}

const peerConfigConnections = {
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" }
  ]
}

const VideoMeet = () => {

  let routeTo = useNavigate()

  let socketRef = useRef()
  let socketIdRef = useRef()

  let localVideoRef = useRef()

  let [videoAvailable, setVideoAvailable] = useState(true)
  let [audioAvailable, setAudioAvailable] = useState(true)


  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);

  let [screen, setScreen] = useState()

  let [showModal, setModal] = useState(false)

  let [screenAvailable, setScreenAvailable] = useState()

  let [messages, setMessages] = useState([])

  let [message, setMessage] = useState("")

  let [newMessages, setNewMessage] = useState(3)

  let [username, setUsername] = useState('')

  let [askForUsername, setAskForUsername] = useState(true);

  const videoRef = useRef([])

  let [videos, setVideos] = useState([])



  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log('Video permission granted');
      } else {
        setVideoAvailable(false);
        console.log('Video permission denied');
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log('Audio permission granted');
      } else {
        setAudioAvailable(false);
        console.log('Audio permission denied');
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };



  useEffect(() => {
    getPermissions();
  }, [])

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia()
    }
  }, [audio, video])


  let getUserMediaSuccess = (stream) => {
    try {
      // Before: window.localStream.getTracks().forEach(track => track.stop())
      if (window.localStream && window.localStream.getTracks) {
        window.localStream.getTracks().forEach(track => track.stop())
      }
    } catch (e) { console.log(e) }

    window.localStream = stream
    localVideoRef.current.srcObject = stream

    for (let id in connections) {
      if (id === socketIdRef.current) continue

      connections[id].addStream(window.localStream)

      connections[id].createOffer().then((description) => {
        console.log(description)
        connections[id].setLocalDescription(description)
          .then(() => {
            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
          })
          .catch(e => console.log(e))
      })
    }

    stream.getTracks().forEach(track => track.onended = () => {
      setVideo(false);
      setAudio(false);

      try {
        let tracks = localVideoRef.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) { console.log(e) }

      let blackSilence = (...args) => new MediaStream([black(...args), silence()])
      window.localStream = blackSilence()
      localVideoref.current.srcObject = window.localStream

      for (let id in connections) {
        connections[id].addStream(window.localStream)

        connections[id].createOffer().then((description) => {
          connections[id].setLocalDescription(description)
            .then(() => {
              socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
            })
            .catch(e => console.log(e))
        })
      }
    })
  }


  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({
        video: video,
        audio: audio
      })
        .then(getUserMediaSuccess)
        .then((stream) => {

        })
        .catch((e) => console.log(e))
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) {
        console.log(e)
      }
    }
  }



  useEffect(() => {
    if (localVideoRef.current && window.localStream) {
      localVideoRef.current.srcObject = window.localStream;
    }
  }, [askForUsername]);

  let pendingCandidates = {};


  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message)

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === 'offer') {
            connections[fromId].createAnswer().then((description) => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
              }).catch(e => console.log(e))
            }).catch(e => console.log(e))
          }
        }).catch(e => console.log(e))
      }

      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
      }
    }
  }

   const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessage((prevNewMessages) => prevNewMessages + 1);
        }
    };

  let connectToSocketServer = () => {

    socketRef.current = io.connect(serverURL, { secure: false })

    socketRef.current.on('signal', gotMessageFromServer)

    socketRef.current.on("connect", () => {

      socketRef.current.emit("join-call", window.location.href)
      socketIdRef.current = socketRef.current.id
      socketRef.current.on("chat-message", addMessage)
      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id))
      })
      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {

          connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate !== null) {
              socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }))
            }
          }

          connections[socketListId].onaddstream = (event) => {
            let videoExits = videoRef.current.find(video => video.socketId === socketListId);

            if (videoExits) {
              setVideos(videos => {
                const updatedVideos = videos.map(video =>
                  video.socketId === socketListId ? { ...video, stream: event.stream } : video
                )
                videoRef.current = updatedVideos
                return updatedVideos
              })
            } else {
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoPlay: true,
                playsinline: true
              }

              setVideos(videos => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          }

          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream)
          } else {
            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            connections[socketListId].addStream(window.localStream)
          }

        })

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue
            try {
              connections[id2].addStream(window.localStream)
            } catch (e) {
              console.log(e)
            }
            connections[id2].createOffer().then((description) => {
              connections[id2].setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }))
                })
                .catch(e => console.log(e))
            })

          }
        }
      }
      )

    })
  }

  let silence = () => {
    let ctx = new AudioContext()
    let oscillator = ctx.createOscillator();

    let dst = oscillator.connect(ctx.createMediaStreamDestination())

    oscillator.start()
    ctx.resume()

    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
  }

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas", { width, height }))
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream()

    return Object.assign(stream.getVideoTracks()[0], { enabled: false })
  }

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer()
  }

  let handleVideo = () => {
    setVideo(!video);
    console.log(video)
  }

  let handleAudio = () => {
    setAudio(!audio)
    console.log(audio)
  }

  let handleScreen = () => {
    setScreen(!screen);
  }

  let getDisplayMediaSuccess = (stream) => {

    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) {
      console.log(e)
    }
    window.localStream = stream
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue
      connections[id].addStream(window.localStream)
      connections[id].createOffer()
        .then((description) => {
          connections[id].setLocalDescription(description)
            .then(() => {
              socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
            }).catch(e => console.log(e))
        })
    }

    stream.getTracks().forEach(track => track.onended = () => {
      setScreen(false)

      try {
        let tracks = localVideoRef.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) { console.log(e) }

      let blackSilence = (...args) => new MediaStream([black(...args), silence()])
      window.localStream = blackSilence()
      localVideoRef.current.srcObject = window.localStream

      getUserMedia();
    })

  }

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        }).then(getDisplayMediaSuccess)
          .then((strean) => { })
          .catch((e) => console.log(e))
      }
    }
  }

  let handleMessage = () => {
    socketRef.current.emit("chat-message" , message , username)
    setMessage("")
  }

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop())
      routeTo("/home")
    } catch (error) {
      
    }
  }

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen])


  let connect = () => {
    
    if(username){
      setAskForUsername(false);
      getMedia();
    } else {
      alert("enter a valid username")
    }
    
  }

  return (
    <div>
      {askForUsername === true ? (
        <LobbyDiv>
          <h2> Enter Into Lobby </h2>
          <br />
          <AlignDiv>
              <TextField
            id='outlined-basic'
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            variant='outlined'
            required
          />

          <Button variant='contained' onClick={connect}>
            Join
          </Button>
          </AlignDiv>
          

          <div>
            <video ref={localVideoRef} autoPlay muted />
          </div>
        </LobbyDiv>
      ) : (
        <>
          <OuterDiv>
            <video className='self-stream' ref={localVideoRef} autoPlay muted />

            {
              showModal ? <ChatDiv>
                <div className="chat-container">
                  <h1>chat</h1>
                  <div className="chatting-display">
                    { messages.length > 0 ?  messages.map((item, index) => {
                      return(
                        <div key={index}>
                          <p><b>{item.sender}</b></p>
                          <p>{item.data}</p>
                        </div>
                      )
                    })  :
                    <h2>
                      No Messages Yet
                    </h2>
                     }

                  </div>
                  <div className='chat-area'>
                     <TextField id='outlined-basic' value={message}  onChange={e => setMessage(e.target.value)} label="Enter Chat" variant='outlined' />
                     <Button variant='contained' onClick={handleMessage}> Send </Button>
                  </div>
                </div>
              </ChatDiv> : <></>
            }

            <MainDiv $numVideos={videos.length}>
              {videos.map((video) => (
                <div className='others-stream' key={video.socketId}>
                  <video
                    className='others-video'
                    data-socket={video.socketId}
                    ref={ref => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                      }
                    }}
                    autoPlay
                  />
                </div>
              ))}
            </MainDiv>


            <ControlBar elevation={8}>
              <StyledIconButton onClick={handleVideo}>
                {video === true ? <Videocam /> : <VideocamOff />}
              </StyledIconButton>

              <StyledIconButton onClick={handleAudio}>
                {audio === true ? <Mic /> : <MicOff />}
              </StyledIconButton>

              <StyledIconButton onClick={handleEndCall} className="hangup">
                <CallEnd />
              </StyledIconButton>

              {screenAvailable === true ?
                <StyledIconButton onClick={handleScreen} style={{ color: "white" }}>
                  {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </StyledIconButton> : <></>}


              <StyledIconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                <Badge badgeContent={newMessages} max={999} color='primary'>
                  <ChatIcon />
                </Badge>

              </StyledIconButton>

            </ControlBar>
          </OuterDiv>
        </>
      )}
    </div>
  );




}

const LobbyDiv = styled.div`
  height: 100vh;
  
  width: 100%;

  align-items: center;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #e6f0ff, #ffffff);

  h2{
    text-align: center;
    font-size: 2rem;
    margin-top: 20px;
  }
  
`
const AlignDiv = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  
  button{
    margin-left: 12px;
  }
  
`

const OuterDiv = styled.div`
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #01012c, #020121);
  overflow: hidden;
  position: relative;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .self-stream {
    position: absolute;
    bottom: 5vh;
    left: 1%;
    width: 25%;
    height: 26vh;
    border-radius: 20px;
    z-index: 10;
    object-fit: cover;
    background: black;
    border: 2px solid white;
  }

  @media (max-width: 768px) {
    .self-stream{
      width: 40%;
      height: 35vh;
      object-fit: contain;
      left: 2%;
    }
  }
`;

const ChatDiv = styled.div`
  background-color: aliceblue;
  position: absolute;
  width: 20%;
  height: 80vh;
  right: 0;
  margin-right: 20px;
  border-radius: 20px;

  > .chat-container{
    width: 100%;
    height: 100%;
    z-index: 10;

    > .chat-area{
      position: absolute;
      bottom: 0;
      margin-left: 10px;
      margin-bottom: 5px;
      z-index: 20;
    }
  }

  @media (max-width: 768px) {
    width: 75%;
    z-index: 11;
  }
`


const MainDiv = styled.div`
  display: flex;
  flex-wrap: wrap; /* Allows items to wrap to the next line */
  gap: 10px; /* Sets space between videos */
  width: 90%;
  height: 90%;
  padding: 10px;
  box-sizing: border-box;
  
  /* Style the video containers directly */
  > .others-stream {
    flex-grow: 1; /* Allow items to grow to fill space */
    display: flex;
  }

  > .others-stream .others-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }


  ${({ $numVideos }) => { // <-- Use $numVideos here
    // 1 video: takes full space
    if ($numVideos === 1) { // <-- Use $numVideos here
      return `
        > .others-stream {
          flex-basis: 100%;
          height: 100%;
        }
      `;
    }
    // 2 videos: side-by-side
    if ($numVideos === 2) { // <-- Use $numVideos here
      return `
        > .others-stream {
          flex-basis: calc(50% - 5px);
          height: 100%;
        }
      `;
    }
    // 4 videos: 2x2 grid
    if ($numVideos === 4) { // <-- Use $numVideos here
      return `
        > .others-stream {
          flex-basis: calc(50% - 5px);
          height: calc(50% - 5px);
        }
      `;
    }
    // 3 videos: 1 on top, 2 below
    if ($numVideos === 3) { // <-- Use $numVideos here
      return `
        > .others-stream:first-child {
          flex-basis: 100%;
          height: calc(50% - 5px);
        }
        > .others-stream:not(:first-child) {
          flex-basis: calc(50% - 5px);
          height: calc(50% - 5px);
        }
      `;
    }
    // 5+ videos: flexible row
    return `
      > .others-stream {
        flex-basis: 350px;
        max-height: 50%;
      }
    `;
  }}
`;

const ControlBar = styled(Paper)`
  position: absolute;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1.5rem;
  display: flex;
  gap: 1rem;
  background-color: rgba(30, 30, 30, 0.7) !important;
  backdrop-filter: blur(10px);
  border-radius: 50px !important;
  z-index: 10;
`;

const StyledIconButton = styled(IconButton)`
  color: white !important;
  background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'} !important;

  &.hangup {
    background-color: #e74c3c !important;
    &:hover {
      background-color: #c0392b !important;
    }
  }
`;


export default withAuth(VideoMeet);