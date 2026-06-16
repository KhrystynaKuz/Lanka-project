import { useChats } from '../../hooks/useChats';
import { useAuth } from '../../hooks/useAuth';

/**
 * Компонент списку чатів користувача.
 * Відображає всі доступні чати (прямі та групові) з можливістю вибору.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Function} props.onSelect - Функція, що викликається при виборі чату з передачею його ідентифікатора.
 * @returns {JSX.Element} Рендер списку чатів.
 */
export default function ChatList({ onSelect }) {
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id;
    const { chats, loading: chatsLoading } = useChats(userId);

    if (authLoading || chatsLoading) return <p className="p-4">Loading chats...</p>;

    return (
        <div className="w-80 border-r h-full overflow-y-auto p-4">
            <h2 className="text-xl font-semibold mb-4">Chats</h2>
            {chats.length === 0 && <p className="text-gray-500">No chats yet.</p>}
            {chats.map((chat) => (
                <div
                    key={chat.id}
                    onClick={() => onSelect(chat.id)}
                    className="p-3 rounded-lg hover:bg-gray-100 cursor-pointer mb-1"
                >
                    <p className="font-medium">
                        {chat.type === 'DIRECT' ? (chat.name || 'Direct Chat') : (chat.name || 'Group Chat')}
                    </p>
                </div>
            ))}
        </div>
    );
}