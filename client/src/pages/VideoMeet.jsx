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


  // --- NEW: pending candidates queue (useRef so it survives re-renders) ---
  const pendingCandidatesRef = useRef({})

  // Helper: safely add local tracks to a RTCPeerConnection (use replaceTrack if possible)
  const addOrReplaceLocalTracks = (pc) => {
    if (!window.localStream) return;
    const localTracks = window.localStream.getTracks();
    const senders = pc.getSenders ? pc.getSenders() : [];
    localTracks.forEach(track => {
      // try replaceTrack for existing sender of same kind
      const sender = senders.find(s => s.track && s.track.kind === track.kind);
      if (sender && sender.replaceTrack) {
        sender.replaceTrack(track);
      } else {
        try {
          pc.addTrack(track, window.localStream);
        } catch (e) {
          console.warn('addTrack failed', e);
        }
      }
    });
  }

  const getPermissions = async () => {
    try {
      // check availability of devices
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setVideoAvailable(true);
      } catch (err) {
        setVideoAvailable(false);
      }

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioAvailable(true);
      } catch (err) {
        setAudioAvailable(false);
      }

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      // do not automatically request the final getUserMedia here
      // we'll request when the user clicks Join (getMedia) so socket connect happens after local stream ready
    } catch (error) {
      console.log(error);
    }
  };


  useEffect(() => {
    getPermissions();
  }, [])

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      // we only refresh local user media when user toggles devices while in session
      if (!askForUsername) {
        getUserMedia()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, video])


  let getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream && window.localStream.getTracks) {
        window.localStream.getTracks().forEach(track => track.stop())
      }
    } catch (e) { console.log(e) }

    window.localStream = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream

    // add or replace tracks on existing connections, then renegotiate (create offer) if needed
    for (let id in connections) {
      if (id === socketIdRef.current) continue

      try {
        addOrReplaceLocalTracks(connections[id])
      } catch (e) {
        console.log('add/replace local tracks error', e)
      }

      // create offer only if this client is initiator for that peer (handled later in user-joined)
      // but if connection is in stable state, trigger a renegotiation from this side to let remote get new tracks
      try {
        if (connections[id].signalingState === 'stable') {
          connections[id].createOffer().then((description) => {
            connections[id].setLocalDescription(description)
              .then(() => {
                socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
              })
              .catch(e => console.log(e))
          }).catch(e => console.log(e))
        }
      } catch (e) {
        console.log(e)
      }
    }

    stream.getTracks().forEach(track => track.onended = () => {
      setVideo(false);
      setAudio(false);

      try {
        let tracks = localVideoRef.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) { console.log(e) }

      // fallback to no-track silent/black stream to keep connection alive (optional)
      let blackSilence = (...args) => new MediaStream([black(...args), silence()])
      window.localStream = blackSilence()
      if (localVideoRef.current) localVideoRef.current.srcObject = window.localStream

      // notify peers by renegotiation
      for (let id in connections) {
        try {
          addOrReplaceLocalTracks(connections[id])
          if (connections[id].signalingState === 'stable') {
            connections[id].createOffer().then((description) => {
              connections[id].setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                })
                .catch(e => console.log(e))
            })
          }
        } catch (e) { console.log(e) }
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
        .catch((e) => console.log(e))
    } else {
      try {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          let tracks = localVideoRef.current.srcObject.getTracks()
          tracks.forEach(track => track.stop())
        }
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



  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message)

    if (fromId === socketIdRef.current) return;

    // ensure connection object exists
    if (!connections[fromId]) {
      // create a connection placeholder so candidates can be queued and processed
      connections[fromId] = new RTCPeerConnection(peerConfigConnections);

      // set handlers on this connection (match create logic below)
      connections[fromId].onicecandidate = (event) => {
        if (event.candidate !== null) {
          socketRef.current.emit("signal", fromId, JSON.stringify({ 'ice': event.candidate }))
        }
      }
      // modern ontrack handler
      connections[fromId].ontrack = (event) => {
        const [remoteStream] = event.streams;
        let videoExits = videoRef.current.find(video => video.socketId === fromId);

        if (videoExits) {
          setVideos(videos => {
            const updatedVideos = videos.map(video =>
              video.socketId === fromId ? { ...video, stream: remoteStream } : video
            )
            videoRef.current = updatedVideos
            return updatedVideos
          })
        } else {
          let newVideo = {
            socketId: fromId,
            stream: remoteStream,
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
    }

    // handle sdp
    if (signal.sdp) {
      connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {

        // Process any queued ICE candidates now that remote description is set
        if (pendingCandidatesRef.current[fromId] && pendingCandidatesRef.current[fromId].length) {
          pendingCandidatesRef.current[fromId].forEach(candidate => {
            connections[fromId].addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.log(e));
          });
          delete pendingCandidatesRef.current[fromId];
        }

        if (signal.sdp.type === 'offer') {
          // create answer
          connections[fromId].createAnswer().then((description) => {
            connections[fromId].setLocalDescription(description).then(() => {
              socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
            }).catch(e => console.log(e))
          }).catch(e => console.log(e))
        }
      }).catch(e => console.log(e))
    }

    // handle ice candidates: if remote description isn't set yet, queue them
    if (signal.ice) {
      try {
        const remoteDesc = connections[fromId].remoteDescription;
        if (remoteDesc && remoteDesc.type) {
          connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
        } else {
          if (!pendingCandidatesRef.current[fromId]) pendingCandidatesRef.current[fromId] = []
          pendingCandidatesRef.current[fromId].push(signal.ice)
        }
      } catch (e) {
        console.log('addIceCandidate error', e)
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
        // when server notifies of users in room, create connections for each peer
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) return;

          // create pc only once
          if (!connections[socketListId]) {
            connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

            connections[socketListId].onicecandidate = (event) => {
              if (event.candidate !== null) {
                socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }))
              }
            }

            // modern handler
            connections[socketListId].ontrack = (event) => {
              const [remoteStream] = event.streams;
              let videoExits = videoRef.current.find(video => video.socketId === socketListId);

              if (videoExits) {
                setVideos(videos => {
                  const updatedVideos = videos.map(video =>
                    video.socketId === socketListId ? { ...video, stream: remoteStream } : video
                  )
                  videoRef.current = updatedVideos
                  return updatedVideos
                })
              } else {
                let newVideo = {
                  socketId: socketListId,
                  stream: remoteStream,
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

            // if we already have the local stream, add tracks now
            if (window.localStream) {
              addOrReplaceLocalTracks(connections[socketListId])
            }
          }
        })

        // Offer creation policy:
        // if 'id' equals our socket id, it means this event was triggered by *this* client joining.
        // In that case, this client should initiate offers to existing peers (to avoid both sides offering).
        // This matches many signaling approaches: the joining client initiates.
        if (id === socketIdRef.current) {
          for (let peerId in connections) {
            if (peerId === socketIdRef.current) continue
            try {
              // only create offer when connection is stable
              if (connections[peerId].signalingState === 'stable') {
                connections[peerId].createOffer().then((description) => {
                  connections[peerId].setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit("signal", peerId, JSON.stringify({ "sdp": connections[peerId].localDescription }))
                    })
                    .catch(e => console.log(e))
                }).catch(e => console.log(e))
              } else {
                // if not stable, skip offer to avoid collision; peer will negotiate later
                console.log('Skipping createOffer because signalingState is not stable for', peerId, connections[peerId].signalingState)
              }
            } catch (e) {
              console.log(e)
            }
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

  // --- IMPORTANT: ensure local media is ready BEFORE connecting socket ---
  let getMedia = async () => {
    // set desired flags
    setVideo(videoAvailable);
    setAudio(audioAvailable);

    try {
      // if we already have a working local stream, keep it
      if (!window.localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable && video, audio: audioAvailable && audio });
        getUserMediaSuccess(stream)
      }
    } catch (e) {
      console.warn('Could not get user media before socket connect', e)
      // continue to connect anyway (we still queue candidates and handle tracks later)
    }

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
      addOrReplaceLocalTracks(connections[id])
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
          .catch((e) => console.log(e))
      }
    }
  }

  let handleMessage = () => {
    if (socketRef.current) socketRef.current.emit("chat-message" , message , username)
    setMessage("")
  }

  let handleEndCall = () => {
    try {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop())
      }
      // close and cleanup peer connections
      for (let id in connections) {
        try {
          connections[id].close && connections[id].close()
        } catch (e) { }
      }
      connections = {}
      routeTo("/home")
    } catch (error) {
      
    }
  }

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

