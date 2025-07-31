
/**
 * Reusable Modal component for displaying pop-up content.
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null; // Don't render if not open

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        {children} {/* Render content passed as children */}
      </div>
    </div>
  );
};

export default Modal;
