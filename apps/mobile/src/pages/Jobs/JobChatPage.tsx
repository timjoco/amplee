import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { sendOutline } from 'ionicons/icons';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type JobMessage = {
  id: number;
  job_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

type JobDetails = {
  id: string;
  title: string;
  status: string;
  vendor: {
    id: string;
    name: string;
    user_id: string;
  };
  band: {
    id: string;
    name: string;
  };
};

export default function JobChatPage() {
  const { jobId } = useParams<{ jobId: string }>();

  const [loading, setLoading] = React.useState(true);
  const [job, setJob] = React.useState<JobDetails | null>(null);
  const [messages, setMessages] = React.useState<JobMessage[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load job and messages
  React.useEffect(() => {
    const loadData = async () => {
      if (!jobId) return;

      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Load job details
      const { data: jobData, error: jobError } = await supabase
        .from('vendor_jobs')
        .select(`
          id,
          title,
          status,
          vendors (
            id,
            name,
            user_id
          ),
          bands (
            id,
            name
          )
        `)
        .eq('id', jobId)
        .single();

      if (jobError) {
        console.error('Error loading job:', jobError);
        setLoading(false);
        return;
      }

      setJob({
        ...jobData,
        vendor: jobData.vendors as any,
        band: jobData.bands as any,
      });

      // Load messages
      const { data: messagesData } = await supabase
        .from('vendor_job_messages')
        .select(`
          id,
          job_id,
          user_id,
          body,
          created_at,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(
          messagesData.map((m: any) => ({
            ...m,
            profile: m.profiles,
          }))
        );
      }

      setLoading(false);
      setTimeout(scrollToBottom, 100);
    };

    loadData();
  }, [jobId]);

  // Real-time subscription for new messages
  React.useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vendor_job_messages',
          filter: `job_id=eq.${jobId}`,
        },
        async (payload) => {
          const newMsg = payload.new as JobMessage;

          // Load profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', newMsg.user_id)
            .single();

          setMessages((prev) => {
            // Check if message already exists (from optimistic update)
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, { ...newMsg, profile: profile || undefined }];
          });

          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !jobId || !currentUserId || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const optimisticMessage: JobMessage = {
      id: Date.now(), // Temporary ID
      job_id: jobId,
      user_id: currentUserId,
      body: messageText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 50);

    try {
      const { error } = await supabase.from('vendor_job_messages').insert({
        job_id: jobId,
        user_id: currentUserId,
        body: messageText,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setNewMessage(messageText);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': '#050509' } as any}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Job Chat</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#050509' } as any}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!job) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': '#050509' } as any}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Job Chat</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#050509' } as any}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Job not found
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const isVendor = currentUserId === job.vendor.user_id;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#050509' } as any}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{job.title}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        style={{ '--background': '#050509' } as any}
        scrollY={true}
      >
        {/* Job Info Header */}
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                {isVendor ? 'From' : 'To'}: {isVendor ? job.band.name : job.vendor.name}
              </div>
            </div>
            <StatusBadge status={job.status} />
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            padding: '16px',
            paddingBottom: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.user_id === currentUserId}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </IonContent>

      {/* Message Input */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          background: 'rgba(5, 5, 9, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              fontSize: 15,
              color: '#fff',
              resize: 'none',
              fontFamily: 'inherit',
              maxHeight: 120,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: newMessage.trim()
                ? '#8B5CF6'
                : 'rgba(139, 92, 246, 0.3)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              flexShrink: 0,
            }}
          >
            <IonIcon
              icon={sendOutline}
              style={{ fontSize: 20, color: '#fff' }}
            />
          </button>
        </div>
      </div>
    </IonPage>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: JobMessage;
  isOwn: boolean;
}) {
  const displayName = message.profile?.display_name || 'Unknown';
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
      }}
    >
      {!isOwn && (
        <span
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
            marginBottom: 4,
            marginLeft: 12,
          }}
        >
          {displayName}
        </span>
      )}
      <div
        style={{
          maxWidth: '80%',
          padding: '10px 14px',
          borderRadius: 16,
          borderBottomRightRadius: isOwn ? 4 : 16,
          borderBottomLeftRadius: isOwn ? 16 : 4,
          background: isOwn
            ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
            : 'rgba(255,255,255,0.08)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: '#fff',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.body}
        </p>
      </div>
      <span
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          marginTop: 4,
          marginRight: isOwn ? 4 : 0,
          marginLeft: isOwn ? 0 : 12,
        }}
      >
        {time}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    inquiry: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
    quoted: { bg: 'rgba(251,191,36,0.2)', text: '#FBBF24' },
    negotiating: { bg: 'rgba(251,191,36,0.2)', text: '#FBBF24' },
    accepted: { bg: 'rgba(52,211,153,0.2)', text: '#34D399' },
    completed: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
    declined: { bg: 'rgba(239,68,68,0.2)', text: '#F87171' },
    cancelled: { bg: 'rgba(107,114,128,0.2)', text: '#9CA3AF' },
  };

  const color = colors[status] || colors.inquiry;

  return (
    <span
      style={{
        padding: '4px 10px',
        background: color.bg,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        color: color.text,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}
