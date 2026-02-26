import React, { useState, useRef } from 'react';
import { Upload, Camera, X, AlertCircle, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const FileInput = ({ label, name, onChange, error }) => {
    const [preview, setPreview] = useState(null);
    const [localError, setLocalError] = useState('');
    const [compressing, setCompressing] = useState(false);
    const inputRef = useRef(null);

    const compressImage = async (file) => {
        const MAX_SIZE = 200 * 1024; // 200 KB límite de Supabase
        const options = {
            maxSizeMB: 0.15, // ~150 KB para margen seguro
            maxWidthOrHeight: 800,
            useWebWorker: true,
        };
        try {
            let compressedFile = await imageCompression(file, options);

            // Si aún excede el límite, comprimir más agresivamente
            if (compressedFile.size > MAX_SIZE) {
                const secondPass = {
                    maxSizeMB: 0.10, // ~100 KB segundo intento
                    maxWidthOrHeight: 600,
                    useWebWorker: true,
                };
                compressedFile = await imageCompression(compressedFile, secondPass);
            }

            // Verificación final
            if (compressedFile.size > MAX_SIZE) {
                throw new Error('La imagen es demasiado grande incluso después de comprimir. Intenta con otra foto.');
            }

            // Renombrar a .jpg
            return new File([compressedFile], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });
        } catch (error) {
            console.error('Error al comprimir', error);
            throw new Error(error.message || 'Error al comprimir la imagen');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        setLocalError('');
        setPreview(null);

        if (!file) {
            onChange(null);
            return;
        }

        if (!file.type.startsWith('image/')) {
            setLocalError('El archivo debe ser una imagen.');
            return;
        }

        try {
            let fileToProcess = file;
            const MAX_SIZE = 200 * 1024; // 200 KB

            if (file.size > MAX_SIZE) {
                setCompressing(true);
                try {
                    fileToProcess = await compressImage(file);
                } catch (err) {
                    throw err;
                } finally {
                    setCompressing(false);
                }
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                setPreview(event.target.result);
                onChange(fileToProcess);
            };
            reader.readAsDataURL(fileToProcess);
        } catch (err) {
            console.error(err);
            setLocalError('Error al procesar la imagen.');
            setCompressing(false);
        }
    };

    const triggerInput = (mode) => {
        if (!inputRef.current) return;
        inputRef.current.value = '';
        if (mode === 'camera') {
            inputRef.current.setAttribute('capture', 'user');
        } else {
            inputRef.current.removeAttribute('capture');
        }
        inputRef.current.click();
    };

    const clearSelection = () => {
        setPreview(null);
        setLocalError('');
        onChange(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}

            <div className={`
                relative flex flex-col items-center justify-center w-full h-48 
                border-2 border-dashed rounded-xl bg-surface/50 overflow-hidden
                transition-all duration-300
                ${(error || localError) ? 'border-error bg-error/5' : 'border-border hover:border-primary/50'}
            `}>
                {compressing ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-xs font-bold text-primary animate-pulse uppercase tracking-widest">Optimizando...</p>
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
                                onClick={() => triggerInput('gallery')}
                                className="flex-1 flex flex-col items-center justify-center gap-3 p-5 bg-surface border-2 border-border/50 rounded-2xl hover:border-primary group transition-all duration-300 active:scale-95 shadow-lg"
                            >
                                <Upload className="w-7 h-7 text-text-secondary group-hover:text-primary transition-transform group-hover:-translate-y-1" />
                                <span className="text-[11px] font-black uppercase tracking-wider text-text-secondary group-hover:text-primary">Subir</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => triggerInput('camera')}
                                className="flex-1 flex flex-col items-center justify-center gap-3 p-5 bg-surface border-2 border-border/50 rounded-2xl hover:border-primary group transition-all duration-300 active:scale-95 shadow-lg"
                            >
                                <Camera className="w-7 h-7 text-text-secondary group-hover:text-primary transition-transform group-hover:-translate-y-1" />
                                <span className="text-[11px] font-black uppercase tracking-wider text-text-secondary group-hover:text-primary">Cámara</span>
                            </button>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">AI Auto-Compression</p>
                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Target: Under 200 KB</p>
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
