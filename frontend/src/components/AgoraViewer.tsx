import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, { IAgoraRTCClient, IRemoteVideoTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

interface AgoraViewerProps {
  channelName: string;
}

export const AgoraViewer: React.FC<AgoraViewerProps> = ({ channelName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  useEffect(() => {
    if (!APP_ID) {
      setError('البث غير متاح (App ID مفقود)');
      return;
    }

    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      
      if (mediaType === 'video' && user.videoTrack) {
        if (videoRef.current) {
          user.videoTrack.play(videoRef.current);
          setIsPlaying(true);
        }
      }
      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') setIsPlaying(false);
    });

    const joinStream = async () => {
      try {
        await client.join(APP_ID, channelName, null, null);
      } catch (err) {
        console.error('Failed to join Agora channel:', err);
        setError('فشل في الاتصال بالبث المباشر');
      }
    };

    joinStream();

    return () => {
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, [channelName]);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-center p-6">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl text-red-500">⚠️</span>
        </div>
        <p className="text-slate-300 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <div ref={videoRef} className="w-full h-full object-cover [&>div>video]:object-cover" />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-slate-300 font-bold animate-pulse">جاري الاتصال بالبث المباشر...</p>
        </div>
      )}
    </div>
  );
};
