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

type WelcomeUser = { profile: { nick_name?: string | null; name?: string | null } | null } | null;

function displayNameFromUser(user: WelcomeUser): string {
  return user?.profile?.nick_name?.trim() || user?.profile?.name?.trim() || "";
}

function welcomeClassicForUser(user: WelcomeUser): string {
  const who = displayNameFromUser(user);
  return who !== ""
    ? `Hi ${who}! I'm PlayerLink AI. I'm here to recommend new games and answer any other game-related questions. How can I help you today?`
    : `Hi! I'm PlayerLink AI. I'm here to recommend new games and answer any other game-related questions. How can I help you today?`;
}

function welcomeShortForUser(user: WelcomeUser): string {
  const who = displayNameFromUser(user);
  const tail =
    "I'm PlayerLink AI — ask for game ideas, profile suggestions, or quick gaming tips. What do you need?";
  return who !== "" ? `Hi ${who}! ${tail}` : `Hi! ${tail}`;
}

const CLASSIC_SNIPPET = "recommend new games";
const SHORT_SNIPPET = "ask for game ideas, profile suggestions";

/** Qué saludo se mostró la última vez en este navegador (`classic` | `short` | ausente = primera vez). */
const WELCOME_LAST_KEY = "playerlink-ai-welcome-last";

/**
 * Una sola burbuja de bienvenida por apertura del chat.
 * Alterna: 1ª visita → clásico con nombre; al volver a entrar en la ruta → corto; luego otra vez clásico…
 */
function soleWelcomeForVisit(user: WelcomeUser): Message[] {
  if (typeof window === "undefined") {
    return [{ sender: "bot", text: welcomeClassicForUser(user) }];
  }
  const last = localStorage.getItem(WELCOME_LAST_KEY);
  let msg: Message;
  if (last === "short") {
    msg = { sender: "bot", text: welcomeClassicForUser(user) };
    localStorage.setItem(WELCOME_LAST_KEY, "classic");
  } else if (last === "classic") {
    msg = { sender: "bot", text: welcomeShortForUser(user) };
    localStorage.setItem(WELCOME_LAST_KEY, "short");
  } else {
    msg = { sender: "bot", text: welcomeClassicForUser(user) };
    localStorage.setItem(WELCOME_LAST_KEY, "classic");
  }
  return [msg];
}

export const FindGames: React.FC = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const { store } = useGlobalReducer();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(() => soleWelcomeForVisit(store.user));
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!store.user) {
      navigate("/");
    }
  }, [navigate, store.user]);

  /** Si el perfil llega después del primer paint y solo está un saludo, actualiza el texto con el nombre. */
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1) return prev;
      const first = prev[0];
      if (!first || first.sender !== "bot") return prev;
      if (first.text.includes(CLASSIC_SNIPPET)) {
        const next = { sender: "bot" as const, text: welcomeClassicForUser(store.user) };
        return first.text === next.text ? prev : [next];
      }
      if (first.text.includes(SHORT_SNIPPET)) {
        const next = { sender: "bot" as const, text: welcomeShortForUser(store.user) };
        return first.text === next.text ? prev : [next];
      }
      return prev;
    });
  }, [store.user, store.user?.profile?.nick_name, store.user?.profile?.name]);

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
                className="btn botonenviar ms-3"
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
