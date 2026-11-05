import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import BoardView from "./Board";

document.body.classList.add("board-mode");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BoardView />
  </StrictMode>,
);
