"""
WebRTC signaling event handlers for Socket.IO.

This module handles WebRTC signaling for peer-to-peer connections,
including offer/answer exchange and ICE candidate handling.
"""

import logging
from flask import request
from flask_socketio import emit, disconnect
from flask_jwt_extended import decode_token

logger = logging.getLogger(__name__)

# Store active WebRTC connections and their metadata
webrtc_connections = {}


def register_webrtc_events(socketio):
    """
    Register WebRTC signaling event handlers.

    Args:
        socketio: Flask-SocketIO instance.
    """

    @socketio.on("webrtc_signal")
    def handle_webrtc_signal(data):
        """
        Route WebRTC signaling messages between peers.

        Expected data structure depends on signal type:
        {
            "from_user": "string",
            "to_user": "string",
            "signal_type": "offer" | "answer" | "ice-candidate",
            "data": {...} // Signal-specific data
        }
        """
        try:
            from_user = data.get("from_user", "").strip()
            to_user = data.get("to_user", "").strip()
            signal_type = data.get("signal_type", "").strip()
            signal_data = data.get("data", {})

            if not from_user or not to_user or not signal_type:
                logger.warning("Invalid WebRTC signal data")
                emit("webrtc_error", {"message": "Invalid signal data"})
                return

            # Route signal based on type
            if signal_type == "offer":
                handle_offer(socketio, from_user, to_user, signal_data)
            elif signal_type == "answer":
                handle_answer(socketio, from_user, to_user, signal_data)
            elif signal_type == "ice-candidate":
                handle_ice_candidate(socketio, from_user, to_user, signal_data)
            else:
                logger.warning(f"Unknown signal type: {signal_type}")
                emit("webrtc_error", {"message": f"Unknown signal type: {signal_type}"})

        except Exception as e:
            logger.error(f"Error handling WebRTC signal: {str(e)}")
            emit("webrtc_error", {"message": "Failed to process signal"})

    @socketio.on("webrtc_call_request")
    def handle_call_request(data):
        """
        Handle WebRTC call initiation request.

        Expected data:
            {
                "from_user": "string",
                "to_user": "string"
            }
        """
        try:
            from_user = data.get("from_user", "").strip()
            to_user = data.get("to_user", "").strip()

            if not from_user or not to_user:
                emit("webrtc_error", {"message": "Invalid call request"})
                return

            # Store connection metadata
            connection_id = f"{from_user}_{to_user}_{request.sid}"
            webrtc_connections[connection_id] = {
                "from_user": from_user,
                "to_user": to_user,
                "sid": request.sid,
                "status": "initiating",
            }

            logger.info(f"Call request from {from_user} to {to_user}")

            # Notify receiver of incoming call
            emit(
                "webrtc_call_incoming",
                {
                    "from_user": from_user,
                    "connection_id": connection_id,
                },
                broadcast=True,
            )

        except Exception as e:
            logger.error(f"Error handling call request: {str(e)}")
            emit("webrtc_error", {"message": "Failed to process call request"})

    @socketio.on("webrtc_call_accept")
    def handle_call_accept(data):
        """
        Handle WebRTC call acceptance.

        Expected data:
            {
                "connection_id": "string",
                "from_user": "string"
            }
        """
        try:
            connection_id = data.get("connection_id", "").strip()

            if connection_id in webrtc_connections:
                webrtc_connections[connection_id]["status"] = "established"
                logger.info(f"Call accepted: {connection_id}")
                emit(
                    "webrtc_call_accepted",
                    {"connection_id": connection_id},
                    broadcast=True,
                )
            else:
                emit("webrtc_error", {"message": "Invalid connection ID"})

        except Exception as e:
            logger.error(f"Error handling call accept: {str(e)}")
            emit("webrtc_error", {"message": "Failed to accept call"})

    @socketio.on("webrtc_call_reject")
    def handle_call_reject(data):
        """
        Handle WebRTC call rejection.

        Expected data:
            {
                "connection_id": "string",
                "reason": "string" (optional)
            }
        """
        try:
            connection_id = data.get("connection_id", "").strip()
            reason = data.get("reason", "User rejected").strip()

            if connection_id in webrtc_connections:
                del webrtc_connections[connection_id]

            logger.info(f"Call rejected: {connection_id} - Reason: {reason}")
            emit(
                "webrtc_call_rejected",
                {"connection_id": connection_id, "reason": reason},
                broadcast=True,
            )

        except Exception as e:
            logger.error(f"Error handling call reject: {str(e)}")
            emit("webrtc_error", {"message": "Failed to reject call"})

    @socketio.on("webrtc_call_end")
    def handle_call_end(data):
        """
        Handle WebRTC call termination.

        Expected data:
            {
                "connection_id": "string"
            }
        """
        try:
            connection_id = data.get("connection_id", "").strip()

            if connection_id in webrtc_connections:
                del webrtc_connections[connection_id]

            logger.info(f"Call ended: {connection_id}")
            emit(
                "webrtc_call_ended",
                {"connection_id": connection_id},
                broadcast=True,
            )

        except Exception as e:
            logger.error(f"Error handling call end: {str(e)}")
            emit("webrtc_error", {"message": "Failed to end call"})


def handle_offer(socketio, from_user, to_user, offer_data):
    """
    Handle WebRTC offer signal.

    Routes the offer from initiator to receiver.

    Args:
        socketio: Flask-SocketIO instance.
        from_user (str): Username of offer initiator.
        to_user (str): Username of offer receiver.
        offer_data (dict): SDP offer data.
    """
    try:
        logger.info(f"WebRTC Offer from {from_user} to {to_user}")
        socketio.emit(
            "webrtc_offer",
            {
                "from_user": from_user,
                "data": offer_data,
            },
            broadcast=True,
        )
    except Exception as e:
        logger.error(f"Error handling offer: {str(e)}")


def handle_answer(socketio, from_user, to_user, answer_data):
    """
    Handle WebRTC answer signal.

    Routes the answer from receiver back to initiator.

    Args:
        socketio: Flask-SocketIO instance.
        from_user (str): Username of answer sender.
        to_user (str): Username of answer receiver.
        answer_data (dict): SDP answer data.
    """
    try:
        logger.info(f"WebRTC Answer from {from_user} to {to_user}")
        socketio.emit(
            "webrtc_answer",
            {
                "from_user": from_user,
                "data": answer_data,
            },
            broadcast=True,
        )
    except Exception as e:
        logger.error(f"Error handling answer: {str(e)}")


def handle_ice_candidate(socketio, from_user, to_user, candidate_data):
    """
    Handle WebRTC ICE candidate signal.

    Routes ICE candidates between peers for connection establishment.

    Args:
        socketio: Flask-SocketIO instance.
        from_user (str): Username sending the ICE candidate.
        to_user (str): Username receiving the ICE candidate.
        candidate_data (dict): ICE candidate data.
    """
    try:
        logger.info(f"ICE Candidate from {from_user} to {to_user}")
        socketio.emit(
            "webrtc_ice_candidate",
            {
                "from_user": from_user,
                "data": candidate_data,
            },
            broadcast=True,
        )
    except Exception as e:
        logger.error(f"Error handling ICE candidate: {str(e)}")
