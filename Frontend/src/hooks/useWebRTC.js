import { useEffect, useRef, useState, useCallback } from 'react';
import { useEmit, useSocket } from './useSocket';
import { SOCKET_EVENTS, ICE_SERVERS } from '../utils/constants';

/**
 * Custom hook for WebRTC peer-to-peer communication
 * Manages RTCPeerConnection and RTCDataChannel lifecycle
 *
 * @param {string} localUsername - Current user's username
 * @param {string} remoteUsername - Remote user's username
 * @param {boolean} isInitiator - Whether this peer initiates the connection
 * @returns {Object} WebRTC state and methods
 */
export const useWebRTC = (localUsername, remoteUsername, isInitiator = false) => {
  const [connectionState, setConnectionState] = useState('idle'); // idle, connecting, connected, failed, closed
  const [dataChannelOpen, setDataChannelOpen] = useState(false);

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const messageCallbackRef = useRef(null);
  const emit = useEmit();

  // Initialize WebRTC connection
  const initializeConnection = useCallback(async () => {
    try {
      setConnectionState('connecting');

      const peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
      });

      peerConnectionRef.current = peerConnection;

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          emit(SOCKET_EVENTS.SIGNAL, {
            from_user: localUsername,
            to_user: remoteUsername,
            signal_type: 'ice-candidate',
            data: event.candidate,
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        setConnectionState(state);

        if (state === 'connected') {
          console.log('WebRTC connection established');
        } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
          closeConnection();
        }
      };

      // If initiator, create data channel
      if (isInitiator) {
        const dataChannel = peerConnection.createDataChannel('chat', {
          ordered: true,
        });
        setupDataChannel(dataChannel);
      } else {
        // If not initiator, wait for remote to open data channel
        peerConnection.ondatachannel = (event) => {
          setupDataChannel(event.channel);
        };
      }

      return peerConnection;
    } catch (error) {
      console.error('Error initializing WebRTC connection:', error);
      setConnectionState('failed');
      throw error;
    }
  }, [localUsername, remoteUsername, isInitiator, emit]);

  // Setup data channel
  const setupDataChannel = (dataChannel) => {
    dataChannelRef.current = dataChannel;

    dataChannel.onopen = () => {
      setDataChannelOpen(true);
      console.log('Data channel opened');
    };

    dataChannel.onclose = () => {
      setDataChannelOpen(false);
      console.log('Data channel closed');
    };

    dataChannel.onmessage = (event) => {
      if (messageCallbackRef.current) {
        messageCallbackRef.current(event.data);
      }
    };

    dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  };

  // Create and send offer
  const createOffer = useCallback(async () => {
    try {
      if (!peerConnectionRef.current) {
        await initializeConnection();
      }

      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      await peerConnectionRef.current.setLocalDescription(offer);

      emit(SOCKET_EVENTS.SIGNAL, {
        from_user: localUsername,
        to_user: remoteUsername,
        signal_type: 'offer',
        data: offer,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }, [localUsername, remoteUsername, initializeConnection, emit]);

  // Handle incoming offer
  const handleOffer = useCallback(
    async (offer) => {
      try {
        if (!peerConnectionRef.current) {
          await initializeConnection();
        }

        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        emit(SOCKET_EVENTS.SIGNAL, {
          from_user: localUsername,
          to_user: remoteUsername,
          signal_type: 'answer',
          data: answer,
        });
      } catch (error) {
        console.error('Error handling offer:', error);
        throw error;
      }
    },
    [localUsername, remoteUsername, initializeConnection, emit]
  );

  // Handle incoming answer
  const handleAnswer = useCallback(
    async (answer) => {
      try {
        if (peerConnectionRef.current?.signalingState === 'stable') {
          console.warn('Received answer in stable state, ignoring');
          return;
        }

        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (error) {
        console.error('Error handling answer:', error);
        throw error;
      }
    },
    []
  );

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(
    async (candidate) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    },
    []
  );

  // Send data through data channel
  const sendData = useCallback((data) => {
    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('Data channel is not open');
      return false;
    }
  }, []);

  // Register message callback
  const onMessage = useCallback((callback) => {
    messageCallbackRef.current = (data) => {
      try {
        const parsedData = JSON.parse(data);
        callback(parsedData);
      } catch {
        callback(data);
      }
    };
  }, []);

  // Close connection
  const closeConnection = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setDataChannelOpen(false);
    setConnectionState('closed');
  }, []);

  return {
    // State
    connectionState,
    dataChannelOpen,

    // Methods
    initializeConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    sendData,
    onMessage,
    closeConnection,

    // References
    peerConnection: peerConnectionRef.current,
    dataChannel: dataChannelRef.current,
  };
};
