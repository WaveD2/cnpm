import { useState, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, CheckCircle, X } from 'lucide-react';
import { FaCircle } from 'react-icons/fa';
import { Link } from 'react-scroll';
import apiClient from './axios';

const NotificationBell = ({ userId }) => {
  console.log('NotificationBell component mounted with userId:', userId);

  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const pusher = new Pusher('d1641eea53e864ddefb2', {
      cluster: 'ap1',
      forceTLS: true,
    });

    const channel = pusher.subscribe(`user-${userId}`);

    channel.bind('new-notification', (data) => {
      console.log('new-notification', data);
      const {message = {}}= data
      
      setNotifications((prev) => [message, ...prev]);
      setUnreadCount((prev) => prev + (data.isRead ? 0 : 1));
    });

    channel.bind('notification-updated', (data) => {
      console.log('notification-updated', data);
      const {message}= data
      if(!message) return
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === data.id ? { ...notif, isRead: data.isRead } : notif
        )
      );
      setUnreadCount((prev) => (data.isRead ? prev - 1 : prev));
    });

    channel.bind('all-notifications-read', () => {
      console.log('all-notifications-read');
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    });

    channel.bind('notification-deleted', (data) => {
      console.log('notification-deleted', data);
      const {message}= data
      if(!message) return
      setNotifications((prev) => prev.filter((notif) => notif._id !== message.id));
      setUnreadCount((prev) => prev - (prev > 0 ? 1 : 0));
    });

    const fetchNotifications = async () => {
      try {
      const response = await apiClient.get(`/api/notif-service?page=1&limit=10`);
        setNotifications(response.data.notifs || []);
        setUnreadCount(
          response.data.notifs ? response.data.notifs.filter((notif) => !notif.isRead).length : 0
        );
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userId]);

  const handleMarkAsRead = async (notifId) => {
    try {
      const response = await apiClient.patch(`/api/notif-service/${notifId}/read`);
      console.log('Notification marked as read:', response.data);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await apiClient.patch(`/api/notif-service/read-all`);
      console.log('All notifications marked as read:', response.data);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (notifId) => {
    try {
      const response = await apiClient.delete(`/api/notif-service/${notifId}`);

      console.log('Notification deleted:', response.data);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  console.log('Notifications:', notifications);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Thông báo</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Đánh dấu đọc tất cả
                </button>
                <button onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Không có thông báo</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <motion.li
                    key={notif._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 flex items-start space-x-3 ${
                      notif.isRead ? 'bg-gray-50' : 'bg-blue-50'
                    } hover:bg-gray-100 transition-colors`}
                  >
                    <FaCircle
                      className={`h-2 w-2 mt-2 ${
                        notif.isRead ? 'text-gray-300' : 'text-blue-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          notif.isRead ? 'text-gray-600' : 'font-semibold text-gray-800'
                        }`}
                      >
                        <div dangerouslySetInnerHTML={{ __html: notif.content }} />
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                      <div className="mt-2 flex space-x-2">
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif._id)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Đánh dấu đã đọc
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif._id)}
                          className="text-xs text-red-600 hover:text-red-800 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
            <div className="p-4 border-t">
              <Link
                to="notifications"
                smooth={true}
                duration={500}
                className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Xem tất cả
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;