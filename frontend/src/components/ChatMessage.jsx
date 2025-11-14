export default function ChatMessage({ message }) {
  const isBot = message.sender === 'bot';
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: isBot ? 'flex-start' : 'flex-end'
    }}>
      <div style={{
        maxWidth: '200px',
        borderRadius: '8px',
        padding: '12px',
        backgroundColor: isBot ? '#f3f4f6' : '#3b82f6',
        color: isBot ? '#374151' : 'white'
      }}>
        <p style={{
          fontSize: '14px',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          {message.text}
        </p>
        <p style={{
          fontSize: '12px',
          margin: '4px 0 0 0',
          color: isBot ? '#9ca3af' : 'rgba(255,255,255,0.7)'
        }}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
}