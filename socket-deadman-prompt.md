## Socket.IO Dead Man Switch Sync Prompt

```
**GOAL:** Perfect real-time Dead Man Switch sync across devices

**SERVER EMITS (server.js cron):**
```js
// After user.save()
global.io.to(user._id.toString()).emit('dms-update', {
  status: user.triggerStatus,      // "warning" | "triggered" | "active"
  remainingMinutes: threshold - inactiveMinutes,
  lastActive: user.lastActive,
  userId: user._id.toString()
});
```

**CLIENT HANDLER (Dashboard.jsx):**
```js
useEffect(() => {
  const handleDMS = (data) => {
    if (data.userId === user._id.toString()) {
      // Status-specific toasts
      if (data.status === 'warning') {
        toast.warning(`⚠️ DMS Warning: ${data.remainingMinutes}min remaining`, { duration: 8000 });
      } else if (data.status === 'triggered') {
        toast.error('🚨 DEAD MAN SWITCH TRIGGERED! Legacy activated.', { duration: 0 });
        // Show AI message card
      }
      
      // Force refresh
      queryClient.invalidateQueries();
      setTimerKey(Date.now());
    }
  };
  
  socket.on('dms-update', handleDMS);
  return () => socket.off('dms-update', handleDMS);
}, [user]);
```

**ROOMS (user-specific):**
```js
// Server connection
socket.join(req.user._id.toString());
```

**FALLBACK (reconnect):**
```js
socket.on('join-room', (userId) => {
  socket.join(userId);
  // Send current DMS status
  emitCurrentDMSStatus(userId);
});
```

**EVENT FLOW:**
1. Cron detects change → emit to user ROOM
2. All devices get instant update
3. Status toast + timer sync
4. Reconnect → auto-join room + catch up

**VISUAL HIERARCHY:**
- warning (14 days inactive): 🟡 Yellow toast + blink timer
- triggered (>28 days): 🔴 Full screen red + emergency card
- active (ping): 🟢 Green confirmation

**PERFECT MULTI-DEVICE SYNC!** ⌚✨
```

