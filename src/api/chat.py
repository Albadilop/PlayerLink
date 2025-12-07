"""
Chat endpoint with OpenAI integration
"""
import os
import openai
from flask import Blueprint, jsonify, Response
from flask_jwt_extended import jwt_required
from api.rate_limiter import apply_rate_limit_if_available
from api.validators import validate_json, handle_errors
from typing import Tuple

chat_bp = Blueprint('chat', __name__)

# Obtén la clave de OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY is None:
    raise RuntimeError("La variable OPENAI_API_KEY no está definida en .env")

openai.api_key = OPENAI_API_KEY


@chat_bp.route("/chat", methods=["POST"])
@jwt_required()
@apply_rate_limit_if_available("30 per minute")
@validate_json(required_fields=["userInfo"])
@handle_errors
def chat(_data: dict) -> Tuple[Response, int] | Response:
    """
    Recibe JSON:
    - { "text": "...", "userInfo": "..." } → mensaje suelto
    - { "messages": [...], "userInfo": "..." } → historial completo

    Llama a OpenAI y devuelve el texto generado.
    """
    data = _data

    # Validate that either "messages" or "text" is present
    if "messages" not in data and "text" not in data:
        return jsonify({"error": "Faltan campos obligatorios: se requiere 'messages' o 'text'"}), 400

    user_info = data["userInfo"]

    # ✅ Si viene un único mensaje como texto:
    if "text" in data:
        history = [{"sender": "user", "text": data["text"]}]
    else:
        history = data["messages"]

    formatted_messages = [
        {
            "role": "system",
            "content": (
                f"Eres un asistente virtual experto en videojuegos. "
                f"Si te preguntan sobre otro tema, responde con educación que solo puedes hablar de videojuegos. "
                f"Trabajas para PlayerLink, una app para encontrar compañeros de juego. "
                f"La primera vez saludas con cercanía. "
                f"Información del usuario: {user_info}"
            )
        }
    ]

    # Construir conversación para OpenAI
    for msg in history:
        role = "user" if msg.get("sender") == "user" else "assistant"
        content = msg.get("text", "")
        formatted_messages.append({"role": role, "content": content})

    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=formatted_messages,
        temperature=0.7,
        max_tokens=512,
    )

    reply_text = response.choices[0].message.content.strip()
    return jsonify({"reply": reply_text})


