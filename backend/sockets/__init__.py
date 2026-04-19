"""WebSocket event handlers for the Chat Application."""


def register_socketio_events(socketio):
    """
    Register all Socket.IO event handlers.

    Args:
        socketio: Flask-SocketIO instance.
    """
    from .chat import register_chat_events
    from .webrtc import register_webrtc_events
    from .global_chat import register_global_chat_events

    register_chat_events(socketio)
    register_webrtc_events(socketio)
    register_global_chat_events(socketio)
