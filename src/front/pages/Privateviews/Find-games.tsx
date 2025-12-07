import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../../findGames.css";
import logo from "../../assets/img/icons/icon-IA.png";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";

interface Message {
  sender: "user" | "bot";
  text: string;
}

export const FindGames: React.FC = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const { store } = useGlobalReducer();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hi! I'm PlayerLink AI. I'm here to recommend new games and answer any other game-related questions. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!store.user) {
      navigate("/");
    }
  }, [navigate, store.user]);

  useEffect(() => {
    const ref = chatScrollRef.current;
    if (ref) ref.scrollTop = ref.scrollHeight;
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    const userInfo = store.user?.profile
      ? (() => {
          const { name, age, games } = store.user.profile;
          const gamesStr = Array.isArray(games)
            ? games.map((item: { gameTitle?: string }) => item.gameTitle || "").join(", ")
            : "no games";
          return `Name: ${name}, Age: ${age}, Games: ${gamesStr}`;
        })()
      : "the user has no data";

    // Nuevo mensaje del usuario (todavía no está en el estado)
    const updatedMessages = [...messages, { sender: "user" as const, text }];

    // Mostramos inmediatamente en la UI
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const respuesta = await axios.post<{ reply: string }>(
        `${BACKEND_URL}/api/chat`,
        { messages: updatedMessages, userInfo },
        { headers: { "Content-Type": "application/json" } }
      );

      const reply = respuesta.data.reply || "Sorry, something went wrong with the AI.";
      setMessages((prev) => [...prev, { sender: "bot" as const, text: reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot" as const, text: "Server connection error." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-4 position-relative">
      <div className="row justify-content-center">
        <div className="chat-container">
          {/* Header */}
          <div className="bg-gradient-header text-center">
            <h1>PlayerLink&apos;s AI Chat</h1>
          </div>

          {/* Área de mensajes */}
          <div ref={chatScrollRef} className="chat-messages-area">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`d-flex mb-3 ${
                  msg.sender === "user" ? "justify-content-end" : "justify-content-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <img src={logo} alt="AI Logo" className="chat-bot-avatar me-2" />
                )}
                <div
                  className={`px-3 py-2 rounded-3 text-wrap message-bubble ${
                    msg.sender === "user"
                      ? "bg-gradient-user text-white shadow-user"
                      : "bg-gradient-bot text-white shadow-bot"
                  }`}
                  style={{ maxWidth: "75%" }}
                >
                  {msg.text}
                </div>
                {msg.sender === "user" && <div style={{ width: "40px" }}></div>}
              </div>
            ))}

            {isLoading && (
              <div className="d-flex mb-3 justify-content-start align-items-center">
                <img src={logo} alt="AI Logo" className="chat-bot-avatar me-2" />
                <div className="spinner"></div>
              </div>
            )}
          </div>

          {/* Área de input */}
          <form className="chat-input-area" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                className="form-control chat-input-control"
                placeholder="Type your question here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button
                className="btn botonenviar"
                type="submit"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? (
                  <>
                    <span
                      className="spinner me-2"
                      style={{ width: "16px", height: "16px", borderWidth: "2px" }}
                    ></span>
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
