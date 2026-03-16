import React, { useState, useRef, useEffect } from 'react';
import { MessageOutlined, CloseOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Card, Input } from 'antd';
import { getChatSuggestions, sendChatMessage } from '../services/aiService';

const FloatingChatbox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 350, y: window.innerHeight - 500 });
    const [isDragging, setIsDragging] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '✨ Xin chào! Tôi là trợ lý AI của hệ thống Quản lý Điểm Danh. Tôi có thể giúp gì cho bạn?',
        },
    ]);
    const dragRef = useRef({ startX: 0, startY: 0, hasDragged: false, initialX: 0, initialY: 0 });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const loadSuggestions = async () => {
        try {
            const response = await getChatSuggestions();
            setSuggestions(Array.isArray(response?.data) ? response.data : []);
        } catch {
            setSuggestions([]);
        }
    };

    const handleSend = async (rawText) => {
        const text = (rawText || '').trim();
        if (!text || isLoading) {
            return;
        }

        const userMessage = { role: 'user', content: text };
        const nextMessages = [...messages, userMessage];

        setInputValue('');
        setMessages(nextMessages);
        setIsLoading(true);

        try {
            const response = await sendChatMessage(nextMessages);
            const aiMessage = response?.data || {
                role: 'assistant',
                content: 'Xin lỗi, tôi không thể phản hồi lúc này. Vui lòng thử lại.',
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: error?.message || 'Có lỗi xảy ra khi kết nối AI. Vui lòng thử lại.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Prevent dragging from starting if clicking inside the interactive content area
    const handleMouseDown = (e) => {
        // Stop text selection when dragging starts
        document.body.style.userSelect = 'none';

        // Check if the click is on an interactive element like a button, input, or inside the scrollable message area
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.chat-messages') || e.target.closest('.ant-card-extra')) {
            return;
        }

        setIsDragging(true);
        // Calculate the difference between the mouse cursor and the component's top-left corner
        dragRef.current = {
            startX: e.clientX - position.x,
            startY: e.clientY - position.y,
            hasDragged: false,
            initialX: e.clientX,
            initialY: e.clientY
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        // Mark as dragged if mouse moved more than 5 pixels
        if (Math.abs(e.clientX - dragRef.current.initialX) > 5 || Math.abs(e.clientY - dragRef.current.initialY) > 5) {
            dragRef.current.hasDragged = true;
        }

        // Calculate new position based on current mouse coordinates and starting offset
        let newX = e.clientX - dragRef.current.startX;
        let newY = e.clientY - dragRef.current.startY;

        // Boundaries to prevent dragging off-screen
        const maxX = window.innerWidth - (isOpen ? 320 : 60); // 320 is card width, 60 is button width
        const maxY = window.innerHeight - (isOpen ? 450 : 60); // 450 is card height, 60 is button height

        // Update position clamping to window borders
        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        // Restore text selection
        document.body.style.userSelect = '';
    };

    const handleClick = () => {
        if (!dragRef.current.hasDragged) {
            setIsOpen(true);

            // Adjust position immediately to ensure the expanded card stays within the screen
            setPosition(prev => {
                const maxX = window.innerWidth - 320; // 320 is card width
                const maxY = window.innerHeight - 450; // 450 is card height
                return {
                    x: Math.min(prev.x, maxX),
                    y: Math.min(prev.y, maxY)
                };
            });
        }
    };

    // Attach window event listeners for smooth dragging outside the component
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        // Cleanup listeners
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, position.x, position.y]); // Include position dependencies

    // Handle window resize to keep box within view
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => {
                const maxX = window.innerWidth - (isOpen ? 320 : 60);
                const maxY = window.innerHeight - (isOpen ? 450 : 60);
                return {
                    x: Math.min(prev.x, maxX),
                    y: Math.min(prev.y, maxY)
                };
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen && suggestions.length === 0) {
            loadSuggestions();
        }
    }, [isOpen]);

    // When Chatbox is collapsed
    if (!isOpen) {
        return (
            <div
                style={{
                    position: 'fixed',
                    left: position.x,
                    top: position.y,
                    zIndex: 9999,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
            >
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        width: 60,
                        height: 60,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ff6b35',
                        borderRadius: '50%',
                        color: 'white',
                    }}
                    onClick={handleClick}
                >
                    <MessageOutlined style={{ fontSize: '24px' }} />
                </div>
            </div>
        );
    }

    // When Chatbox is expanded
    return (
        <Card
            title={
                <div
                    style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        padding: '10px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#fff',
                        width: '100%',
                        height: '100%'
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <MessageOutlined /> AI Assistant
                </div>
            }
            extra={
                <CloseOutlined
                    onClick={() => setIsOpen(false)}
                    style={{ cursor: 'pointer', color: '#fff', fontSize: '16px', padding: '4px' }}
                />
            }
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                width: 320,
                height: 450,
                zIndex: 9999,
                boxShadow: '0 12px 28px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            styles={{
                header: {
                    background: 'linear-gradient(135deg, #ff6b35, #ff9f1c)',
                    color: '#ffffff',
                    borderBottom: 'none',
                    minHeight: 56,
                },
                body: {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px',
                    background: '#fffef7',
                    overflow: 'hidden',
                    minHeight: 0,
                }
            }}
        >
            <style>
                {`.chat-messages {
                    scrollbar-width: thin;
                    scrollbar-color: #c7a98f #f8efe6;
                }

                .chat-messages::-webkit-scrollbar {
                    width: 8px;
                }

                .chat-messages::-webkit-scrollbar-track {
                    background: #f8efe6;
                    border-radius: 10px;
                }

                .chat-messages::-webkit-scrollbar-thumb {
                    background: #c7a98f;
                    border-radius: 10px;
                    border: 2px solid #f8efe6;
                }

                .chat-messages::-webkit-scrollbar-thumb:hover {
                    background: #b58d6f;
                }`}
            </style>

            <div style={{ flex: 1, marginBottom: 12, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div
                    className="chat-messages"
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        paddingRight: '6px',
                        scrollbarGutter: 'stable',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {messages.map((message, index) => (
                        <div
                            key={`${message.role}-${index}`}
                            style={{
                                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                                padding: '10px 14px',
                                background: message.role === 'user' ? '#2c3e50' : '#ffffff',
                                color: message.role === 'user' ? '#ffffff' : '#2c3e50',
                                borderRadius: message.role === 'user'
                                    ? '16px 16px 4px 16px'
                                    : '16px 16px 16px 4px',
                                maxWidth: '85%',
                                fontSize: '14px',
                                lineHeight: '1.4',
                                border: message.role === 'assistant' ? '1px solid #f2e8dc' : 'none',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {message.content}
                        </div>
                    ))}

                    {isLoading && (
                        <div
                            style={{
                                alignSelf: 'flex-start',
                                padding: '10px 14px',
                                background: '#ffffff',
                                color: '#8b9556',
                                borderRadius: '16px 16px 16px 4px',
                                border: '1px solid #f2e8dc',
                                fontSize: '14px',
                            }}
                        >
                            Đang phản hồi...
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
                </div>
            </div>

            {suggestions.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, maxHeight: 72, overflowY: 'auto', paddingRight: 2 }}>
                    {suggestions.slice(0, 3).map((item) => (
                        <Button
                            key={item}
                            size="small"
                            onClick={() => handleSend(item)}
                            disabled={isLoading}
                            style={{
                                borderRadius: 16,
                                borderColor: '#f2d2b6',
                                color: '#b1552f',
                                background: '#fff',
                            }}
                        >
                            {item}
                        </Button>
                    ))}
                </div>
            )}

            <div>
                <Input
                    placeholder="Nhập tin nhắn..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onPressEnter={() => handleSend(inputValue)}
                    disabled={isLoading}
                    style={{
                        borderRadius: '20px',
                        background: '#ffffff',
                        border: '1px solid #f2d2b6',
                        color: '#2c3e50',
                        padding: '8px 16px'
                    }}
                    suffix={
                        <SendOutlined
                            onClick={() => handleSend(inputValue)}
                            style={{ color: isLoading ? '#c8c8c8' : '#ff6b35', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '16px' }}
                        />
                    }
                />
            </div>
        </Card>
    );
};

export default FloatingChatbox;
