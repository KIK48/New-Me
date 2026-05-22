import { createPortal } from "react-dom";
import type { Habit } from "../api/helpers/types/types";
import "../styles/modals/modifyHabit.css"

type Props = {
  h: Habit;
  onClose: () => void;
};

export default function HabbitMod({ h, onClose }: Props) {
  const modalRoot = document.getElementById("root");
  if (!modalRoot) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal container letters" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit Habit</h2>
        <div className="modal-content">
          <div className="habit-content">
            <p className="modal-text letters">{h.name}:</p>
            <input type="text" className="input-hname letters"></input>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary letters" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary letters" onClick={onClose}>Save</button>
        </div>
      </div>
    </div>,
    modalRoot
  );
}
