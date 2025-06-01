import React from 'react';
import { X } from 'lucide-react';
import { useNotificationsStore } from '../stores/useNotificationsStore';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const notifications = useNotificationsStore(state => state.notifications);
  const clearToast = useNotificationsStore(state => state.clearToast);

  if (!isOpen) return null;

  return (
    <div className="absolute top-12 right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 p-4 border border-gray-200 pointer-events-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Notifiche</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Chiudi notifiche"
        >
          <X size={20} />
        </button>
      </div>
      {notifications.length === 0 ? (
        <p className="text-gray-600 text-sm">Nessuna nuova notifica.</p>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {notifications.map(notification => (
            <li
              key={notification.id}
              className="p-3 bg-gray-50 rounded-md shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{notification.title}</p>
                  {notification.message && (
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  )}
                </div>
                <button
                  onClick={() => clearToast(notification.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  aria-label="Rimuovi notifica"
                >
                  <X size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationDropdown; 