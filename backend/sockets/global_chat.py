"""
Global group chat event handlers for Socket.IO.

This module handles real-time group chat message routing,
room management, and broadcasting to all users.
"""

import logging
from datetime import datetime, timezone
from flask import request
from flask_socketio import emit, join_room, leave_room, rooms
from flask_jwt_extended import decode_token
from models.group_message import GroupMessage

logger = logging.getLogger(__name__)

# Global room name for the group chat
GLOBAL_ROOM = "global_chat"

# Track users in global room: {username: sid}
global_room_users = {}


def register_global_chat_events(socketio):
    """
    Register global chat-related Socket.IO event handlers.

    Args:
        socketio: Flask-SocketIO instance.
    """

    @socketio.on("join_global_room")
    def handle_join_global_room():
        """
        Handle user joining the global group chat room.
        
        This is called when a user's Socket.IO connection is established
        or when they open the global chat view.
        """
        try:
            # Get token from query parameters
            token = request.args.get("token")
            if not token:
                logger.warning("Join global room attempt without token")
                emit("error", {"message": "Authentication required"})
                return

            # Decode token to get username
            decoded = decode_token(token)
            username = decoded.get("sub")

            if not username:
                logger.warning("Invalid token - no username")
                emit("error", {"message": "Invalid authentication"})
                return

            # Join the user to the global room
            join_room(GLOBAL_ROOM)
            global_room_users[request.sid] = username

            logger.info(
                f"User '{username}' (SID: {request.sid}) joined global chat room"
            )

            # Notify all users in the room that someone joined
            emit(
                "global_user_joined",
                {
                    "username": username,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "active_users": list(global_room_users.values()),
                },
                room=GLOBAL_ROOM,
            )

        except Exception as e:
            logger.error(f"Error joining global room: {str(e)}")
            emit("error", {"message": "Failed to join global chat"})

    @socketio.on("send_global_message")
    def handle_send_global_message(data):
        """
        Handle incoming global chat message.

        Expected data:
            {
                "sender": "string",
                "content": "string"
            }

        Flow:
            1. Validate message data
            2. Save to MongoDB
            3. Broadcast to all users in global room
        """
        try:
            sender = data.get("sender", "").strip()
            content = data.get("content", "").strip()

            if not sender or not content:
                emit("error", {"message": "Invalid message data"})
                return

            # Save message to database
            message_doc = GroupMessage.save_message(sender, content)

            # Broadcast to all users in the global room
            emit(
                "receive_global_message",
                {
                    "message_id": str(message_doc["_id"]),
                    "sender": sender,
                    "content": content,
                    "timestamp": message_doc["timestamp"],
                },
                room=GLOBAL_ROOM,
            )

            logger.info(f"Global message from {sender}: {message_doc['_id']}")

        except Exception as e:
            logger.error(f"Error sending global message: {str(e)}")
            emit("error", {"message": "Failed to send message"})

    @socketio.on("leave_global_room")
    def handle_leave_global_room():
        """
        Handle user leaving the global group chat room.
        
        This is called when the user navigates away from the global chat view,
        but their Socket.IO connection may remain open for 1-on-1 chats.
        """
        try:
            username = global_room_users.get(request.sid)
            
            if username:
                del global_room_users[request.sid]
                leave_room(GLOBAL_ROOM)
                
                logger.info(
                    f"User '{username}' (SID: {request.sid}) left global chat room"
                )

                # Notify remaining users
                if global_room_users:  # Only emit if there are still users
                    emit(
                        "global_user_left",
                        {
                            "username": username,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "active_users": list(global_room_users.values()),
                        },
                        room=GLOBAL_ROOM,
                    )

        except Exception as e:
            logger.error(f"Error leaving global room: {str(e)}")

    @socketio.on("disconnect")
    def handle_global_chat_disconnect():
        """
        Handle user disconnection from Socket.IO.
        
        Clean up the user from the global room tracking.
        """
        try:
            username = global_room_users.get(request.sid)
            
            if username:
                del global_room_users[request.sid]
                logger.info(
                    f"User '{username}' (SID: {request.sid}) disconnected from global chat"
                )

                # Notify remaining users that someone has disconnected
                if global_room_users:
                    emit(
                        "global_user_left",
                        {
                            "username": username,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "active_users": list(global_room_users.values()),
                        },
                        room=GLOBAL_ROOM,
                    )

        except Exception as e:
            logger.error(f"Error in global chat disconnect handler: {str(e)}")
