import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AgoraRTC, { ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { Camera, Mic, MicOff, Video, VideoOff, PhoneOff, Settings } from 'lucide-react';
import { useToast } from '../context/ToastContext';

// IMPORTANT: Replace this with the user's actual App ID later via env vars
// For now, we will leave it empty and show a message if it's missing.
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

interface CameraBroadcastProps {
  channelName: string;
  onClose: () => void;
  onStreamStarted: (url: string) => void;
}

export const CameraBroadcast: React.FC<CameraBroadcastProps> = ({ channelName, onClose, onStreamStarted }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  useEffect(() => {
    window.alert('تم فتح مكون الكاميرا. إذا رأيت هذه الرسالة فهذا يعني أن الكود يعمل وتم فتحه!');
    let isUnmounted = false;

    if (!APP_ID) {
      setSetupError('لم يتم إعداد معرف تطبيق Agora (APP ID) في ملف .env');
      return;
    }

    const initAgora = async () => {
      try {
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        
        if (isUnmounted) {
          microphoneTrack.stop();
          microphoneTrack.close();
          cameraTrack.stop();
          cameraTrack.close();
          return;
        }

        localAudioTrackRef.current = microphoneTrack;
        localVideoTrackRef.current = cameraTrack;

        if (videoRef.current) {
          cameraTrack.play(videoRef.current);
        }
      } catch (error) {
        console.error('Error initializing camera:', error);
        if (!isUnmounted) {
          setSetupError('حدث خطأ أثناء الوصول للكاميرا. تأكد من إعطاء الصلاحيات.');
        }
      }
    };

    initAgora();

    return () => {
      isUnmounted = true;
      leaveChannel();
    };
  }, []);

  const joinChannel = async () => {
    if (!clientRef.current || !localAudioTrackRef.current || !localVideoTrackRef.current) return;
    try {
      await clientRef.current.join(APP_ID, channelName, null, null);
      await clientRef.current.publish([localAudioTrackRef.current, localVideoTrackRef.current]);
      setIsJoined(true);
      toast.showToast('تم بدء البث بنجاح!', 'success');
      onStreamStarted(`agora://${channelName}`);
    } catch (error) {
      console.error('Error publishing stream:', error);
      toast.showToast('فشل في بدء البث. تأكد من صحة الـ APP ID', 'error');
    }
  };

  const leaveChannel = async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.leave();
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
      }
      setIsJoined(false);
      onClose();
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  };

  const toggleMic = () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setMuted(micOn);
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.setMuted(videoOn);
      setVideoOn(!videoOn);
    }
  };

  if (setupError) {
    const errorContent = (
      <div style={{ zIndex: 2147483647, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} className="flex items-center justify-center bg-black/90 p-4">
        <div className="bg-slate-900 w-full max-w-md rounded-3xl p-8 text-center border border-slate-700 shadow-2xl">
          <Settings className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">إعداد البث المباشر</h2>
          <p className="text-slate-400 mb-6">{setupError}</p>
          <div className="bg-slate-800 p-4 rounded-xl text-right text-sm text-slate-300 mb-6">
            لحل هذه المشكلة:<br/>
            1. سجل في موقع Agora.io للحصول على App ID مجاني.<br/>
            2. أضفه إلى ملف .env باسم VITE_AGORA_APP_ID.<br/>
            3. أعد تشغيل السيرفر.
          </div>
          <button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">
            إغلاق
          </button>
        </div>
      </div>
    );
    return createPortal(errorContent, document.body);
  }

  const content = (
    <div style={{ zIndex: 2147483647, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} className="flex items-center justify-center bg-black/95 p-0 md:p-4 backdrop-blur-sm">
      <div className="bg-slate-900 w-full h-full md:h-auto md:max-w-5xl md:rounded-3xl overflow-hidden shadow-2xl border-4 border-red-500 flex flex-col relative">
        {/* Header */}
        <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-white font-bold flex items-center gap-2 text-lg">
            <Camera className="text-red-500" />
            استوديو البث الحي للكاميرا
          </h2>
          <button onClick={leaveChannel} className="text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 p-2 rounded-full transition-colors">
            <PhoneOff size={20} />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative w-full flex-1 md:aspect-video bg-black flex items-center justify-center overflow-hidden">
          <div ref={videoRef} className="w-full h-full object-cover [&>div>video]:object-cover"></div>
          
          {!isJoined && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
              <button onClick={joinChannel} className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 rounded-full text-xl shadow-lg shadow-red-600/30 transition-transform hover:scale-105 active:scale-95 flex items-center gap-3">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                بدء البث الحي الآن
              </button>
            </div>
          )}
          
          {isJoined && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2 z-10 shadow-lg border border-red-500">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
              بث حي
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-slate-800 flex justify-center gap-6 border-t border-slate-700">
          <button onClick={toggleMic} className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 ${micOn ? 'bg-slate-700 text-white hover:bg-slate-600 shadow-lg' : 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20'}`}>
            {micOn ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          <button onClick={toggleVideo} className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 ${videoOn ? 'bg-slate-700 text-white hover:bg-slate-600 shadow-lg' : 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20'}`}>
            {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
