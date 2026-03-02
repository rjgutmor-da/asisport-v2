import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, X, AlertCircle, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const FileInput = ({ label, name, onChange, error }) => {
    const [preview, setPreview] = useState(null);
    const [localError, setLocalError] = useState('');
    const [compressing, setCompressing] = useState(false);

    // Estados para la webcam
    const [showWebcam, setShowWebcam] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const inputRef = useRef(null);

    // Limpiar la cámara al desmontar
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const compressImage = async (file) => {
        const TARGET_KB = 100 * 1024; // 100 KB target
        const options = {
            maxSizeMB: 0.09, // ~90 KB para dejar margen
            maxWidthOrHeight: 800,
            useWebWorker: true,
            fileType: 'image/jpeg',
        };
        try {
            let compressedFile = await imageCompression(file, options);

            // Segundo pase si aún supera el target
            if (compressedFile.size > TARGET_KB) {
                compressedFile = await imageCompression(compressedFile, {
                    maxSizeMB: 0.07, // ~70 KB segundo intento
                    maxWidthOrHeight: 600,
                    useWebWorker: true,
                    fileType: 'image/jpeg',
                });
            }

            // Renombrar a .jpg
            return new File([compressedFile], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });
        } catch (error) {
            console.error('Error al comprimir', error);
            throw new Error(error.message || 'Error al comprimir la imagen');
        }
    };

    const processFile = async (file) => {
        if (!file) {
            onChange(null);
            return;
        }

        if (!file.type.startsWith('image/')) {
            setLocalError('El archivo debe ser una imagen.');
            return;
        }

        try {
            setCompressing(true);
            const fileToProcess = await compressImage(file);

            const reader = new FileReader();
            reader.onload = (event) => {
                setPreview(event.target.result);
                onChange(fileToProcess);
                setCompressing(false);
            };
            reader.readAsDataURL(fileToProcess);
        } catch (err) {
            console.error(err);
            setLocalError('Error al procesar la imagen.');
            setCompressing(false);
        }
    };

    const handleFileChange = (e) => {
        setLocalError('');
        setPreview(null);
        processFile(e.target.files[0]);
    };

    const triggerInput = () => {
        if (!inputRef.current) return;
        inputRef.current.value = '';
        inputRef.current.click();
    };

    const clearSelection = () => {
        setPreview(null);
        setLocalError('');
        onChange(null);
        if (inputRef.current) inputRef.current.value = '';
        stopCamera();
    };

    // --- Funciones de Webcam ---
    const startCamera = async () => {
        setLocalError('');
        setPreview(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            setShowWebcam(true);

            // Esperar a que el video se renderice para asignarle el stream
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error("Error al acceder a la cámara:", err);
            setLocalError("No se pudo acceder a la cámara. Verifica los permisos.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowWebcam(false);
    };

    const captureSnapshot = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            stopCamera();
            const file = new File([blob], `camara_${Date.now()}.jpg`, { type: 'image/jpeg' });
            processFile(file);
        }, 'image/jpeg', 0.9);
    };

    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}

            <div className={`
                relative flex flex-col items-center justify-center w-full min-h-[12rem] h-48 
                border-2 border-dashed rounded-xl overflow-hidden
                transition-all duration-300
                ${(error || localError) ? 'border-error bg-error/5' : 'border-border bg-surface/50 hover:border-primary/50'}
                ${showWebcam ? 'bg-black' : ''}
            `}>
                {compressing ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-xs font-bold text-primary animate-pulse uppercase tracking-widest">Procesando...</p>
                    </div>
                ) : showWebcam ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 flex gap-4">
                            <button
                                type="button"
                                onClick={stopCamera}
                                className="px-4 py-2 bg-error text-white font-bold rounded-full text-xs hover:bg-red-600 shadow-lg transition-transform active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={captureSnapshot}
                                className="px-6 py-2 bg-primary text-white font-bold rounded-full text-sm hover:scale-105 shadow-xl transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Camera size={18} /> Tomar Foto
                            </button>
                        </div>
                    </div>
                ) : preview ? (
                    <div className="relative w-full h-full p-2 bg-black/20 backdrop-blur-sm">
                        <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-error transition-all shadow-xl border border-white/10"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-5 p-4 w-full text-center">
                        <div className="flex gap-4 w-full max-w-[320px]">
                            <button
                                type="button"
                                onClick={triggerInput}
                                className="flex-1 flex flex-col items-center justify-center gap-3 p-5 bg-surface border-2 border-border/50 rounded-2xl hover:border-primary group transition-all duration-300 active:scale-95 shadow-lg relative overflow-hidden"
                            >
                                <Upload className="w-7 h-7 text-text-secondary group-hover:text-primary transition-transform group-hover:-translate-y-1" />
                                <span className="text-[11px] font-black uppercase tracking-wider text-text-secondary group-hover:text-primary">Subir</span>
                            </button>

                            <button
                                type="button"
                                onClick={startCamera}
                                className="flex-1 flex flex-col items-center justify-center gap-3 p-5 bg-surface border-2 border-border/50 rounded-2xl hover:border-primary group transition-all duration-300 active:scale-95 shadow-lg"
                            >
                                <Camera className="w-7 h-7 text-text-secondary group-hover:text-primary transition-transform group-hover:-translate-y-1" />
                                <span className="text-[11px] font-black uppercase tracking-wider text-text-secondary group-hover:text-primary">Cámara</span>
                            </button>
                        </div>
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-black">AI Auto-Compression</p>
                            <p className="text-[9px] text-text-secondary/70 font-bold uppercase tracking-widest">Target: Under 200 KB</p>
                        </div>
                    </div>
                )}

                <input
                    ref={inputRef}
                    id={name}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            {(error || localError) && (
                <span className="text-xs text-error font-bold flex items-center gap-1.5 px-1">
                    <AlertCircle size={14} />
                    {localError || error}
                </span>
            )}
        </div>
    );
};

export default FileInput;
