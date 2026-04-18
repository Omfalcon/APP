"""
Chat event handlers for Socket.IO.

This module handles real-time chat message routing, user presence,
and connection management.
"""

import logging
from datetime import datetime, timezone
from flask import request
from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token
from models import Message

logger = logging.getLogger(__name__)

# Store active connections: {username: sid}
active_users = {}


def format_timestamp(dt):
    """
    Convert datetime object to ISO format string with UTC timezone.
    
    Args:
        dt: datetime object
        
    Returns:
        ISO format string with UTC timezone
    """
    if dt is None:
        return datetime.now(timezone.utc).isoformat()
    
    # Ensure timezone awareness
    if dt.tzinfo is None:
        # Assume UTC if no timezone info
        dt = dt.replace(tzinfo=timezone.utc)
    
    return dt.isoformat()


def register_chat_events(socketio):
    """
    Register chat-related Socket.IO event handlers.

    Args:
        socketio: Flask-SocketIO instance.
    """

    @socketio.on("connect")
    def handle_connect():
        """Handle client connection."""
        try:
            # Get token from query parameters
            token = request.args.get("token")
            if not token:
                logger.warning("Connection attempt without token")
                disconnect()
                return False

            # Decode token to get username
            decoded = decode_token(token)
            username = decoded.get("sub")

            if not username:
                logger.warning("Invalid token - no username")
                disconnect()
                return False

            # Store connection
            active_users[username] = request.sid
            logger.info(f"User '{username}' connected with SID: {request.sid}")

            # Emit user joined event to all clients
            emit(
                "user_joined",
                {
                    "username": username,
                    "message": f"{username} has joined the chat",
                },
                broadcast=True,
            )

            # Emit active users list
            emit(
                "active_users",
                {"users": list(active_users.keys())},
                broadcast=True,
            )

        except Exception as e:
            logger.error(f"Connection error: {str(e)}")
            disconnect()
            return False

    @socketio.on("disconnect")
    def handle_disconnect():
        """Handle client disconnection."""
        try:
            # Find and remove disconnected user
            disconnected_user = None
            for username, sid in list(active_users.items()):
                if sid == request.sid:
                    disconnected_user = username
                    del active_users[username]
                    break

            if disconnected_user:
                logger.info(f"User '{disconnected_user}' disconnected")
                emit(
                    "user_left",
                    {
                        "username": disconnected_user,
                        "message": f"{disconnected_user} has left the chat",
                    },
                    broadcast=True,
                )
                emit(
                    "active_users",
                    {"users": list(active_users.keys())},
                    broadcast=True,
                )
        except Exception as e:
            logger.error(f"Disconnection error: {str(e)}")

    @socketio.on("send_message")
    def handle_send_message(data):
        """
        Handle incoming chat message.

        Expected data:
            {
                "sender": "string",
                "receiver": "string",
                "content": "string"
            }
        """
        try:
            sender = data.get("sender", "").strip()
            receiver = data.get("receiver", "").strip()
            content = data.get("content", "").strip()

            if not sender or not receiver or not content:
                emit("error", {"message": "Invalid message data"})
                return

            # Save message to database
            message_doc = Message.save_message(sender, receiver, content)

            message_data = {
                "sender": sender,
                "receiver": receiver,
                "content": content,
                "timestamp": format_timestamp(message_doc["timestamp"]),
                "message_id": str(message_doc["_id"]),
            }

            # Send message to receiver if connected
            if receiver in active_users:
                socketio.emit(
                    "receive_message",
                    message_data,
                    room=active_users[receiver],
                )
                logger.info(f"Message sent from {sender} to {receiver}")
            else:
                logger.info(f"Receiver {receiver} offline. Message saved to DB.")

            # Confirm to sender
            emit("message_sent", {"status": "success", "data": message_data})

        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            emit("error", {"message": "Failed to send message"})

    @socketio.on("get_chat_history")
    def handle_get_chat_history(data):
        """
        Get chat history between two users.

        Expected data:
            {
                "user1": "string",
                "user2": "string",
                "limit": "int" (optional, default 100)
            }
        """
        try:
            user1 = data.get("user1", "").strip()
            user2 = data.get("user2", "").strip()
            limit = int(data.get("limit", 100))

            if not user1 or not user2:
                emit("error", {"message": "user1 and user2 are required"})
                return

            # Fetch message history
            messages = Message.get_messages_between(user1, user2, limit)

            history = [
                {
                    "sender": msg.get("sender"),
                    "receiver": msg.get("receiver"),
                    "content": msg.get("content"),
                    "timestamp": format_timestamp(msg.get("timestamp")),
                    "message_id": str(msg.get("_id")),
                    "is_read": msg.get("is_read", False),
                }
                for msg in messages
            ]

            emit("chat_history", {"messages": history})
            logger.info(f"Chat history retrieved for {user1} - {user2}")

        except Exception as e:
            logger.error(f"Error retrieving chat history: {str(e)}")
            emit("error", {"message": "Failed to retrieve chat history"})

    @socketio.on("typing")
    def handle_typing(data):
        """
        Handle typing indicator.

        Expected data:
            {
                "from_user": "string",
                "to_user": "string"
            }
        """
        try:
            from_user = data.get("from_user", "").strip()
            to_user = data.get("to_user", "").strip()

            if to_user in active_users:
                emit(
                    "user_typing",
                    {"from_user": from_user},
                    room=active_users[to_user],
                )
        except Exception as e:
            logger.error(f"Error handling typing indicator: {str(e)}")

    @socketio.on("stop_typing")
    def handle_stop_typing(data):
        """
        Handle stop typing indicator.

        Expected data:
            {
                "from_user": "string",
                "to_user": "string"
            }
        """
        try:
            from_user = data.get("from_user", "").strip()
            to_user = data.get("to_user", "").strip()

            if to_user in active_users:
                emit(
                    "user_stopped_typing",
                    {"from_user": from_user},
                    room=active_users[to_user],
                )
        except Exception as e:
            logger.error(f"Error handling stop typing: {str(e)}")
