import { useState } from "react";
import { createPortal } from "react-dom";
import "../styles/modals/modifyHabit.css"
import { apiPost } from "../api/helpers/habits";

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddHabit({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");

  async function handleSave() {
    if (!name.trim()) return;
    await apiPost("/habits", {name: name.trim()});
    onCreated?.();
    onClose();
  }

  const modalRoot = document.getElementById("root");
  if (!modalRoot) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal container letters" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Adding New Habit</h2>
        <div className="modal-content">
          <div className="habit-content">
            <p className="modal-text letters">Habit Name: </p>
            <input type="text" className="input-hname letters" value={name} onChange={(e) => setName(e.target.value)}></input>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary letters" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary letters" onClick={handleSave}>Save</button> {/*Change here to api */}
        </div>
      </div>
    </div>,
    modalRoot
  );
}
