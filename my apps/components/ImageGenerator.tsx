import React, { useState, useCallback, useEffect } from 'react';
import { Download, Image, Zap, Loader2, Check, X, Video, Clipboard, Wand2, Edit, RefreshCcw, ListFilter, Film } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import CustomFileInput from './CustomFileInput';
import { PROMPT_TEMPLATES, RATIO_OPTIONS, LANGUAGE_OPTIONS, CAMERA_ANGLES } from '../constants';
import { fileToBase64, copyToClipboard, downloadImage } from '../utils';
import { PromptTemplate } from '../types';

const ImageGenerator: React.FC = () => {
    // State management
    const [productImageBase64, setProductImageBase64] = useState<string[]>([]);
    const [productDescription, setProductDescription] = useState('');
    const [modelImageBase64, setModelImageBase64] = useState<string[]>([]);
    const [modelDescriptions, setModelDescriptions] = useState<string[]>([]);
    const [selectedRatio, setSelectedRatio] = useState(RATIO_OPTIONS[0].key);
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGE_OPTIONS[0]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Results
    const [results, setResults] = useState<Record<string, (string | null)[]>>({
        'B-Roll': Array(4).fill(null),
        'UGC': Array(4).fill(null),
        'PHOTO PRODUK': Array(4).fill(null),
    });
    
    const [finalPrompts, setFinalPrompts] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Video Prompts State
    const [videoPrompts, setVideoPrompts] = useState<Record<string, (string | null)[]>>({
        'B-Roll': Array(4).fill(null),
        'UGC': Array(4).fill(null),
        'PHOTO PRODUK': Array(4).fill(null),
    });
    const [videoPromptLoading, setVideoPromptLoading] = useState<Record<string, boolean[]>>({
        'B-Roll': Array(4).fill(false),
        'UGC': Array(4).fill(false),
        'PHOTO PRODUK': Array(4).fill(false),
    });

    const [selectedPromptTypes, setSelectedPromptTypes] = useState<Record<string, Record<number, string>>>({
        'B-Roll': {},
        'UGC': {},
        'PHOTO PRODUK': {}
    });

    const [cinematicPrompts, setCinematicPrompts] = useState<Record<string, (string | null)[]>>({
        'B-Roll': Array(4).fill(null),
        'UGC': Array(4).fill(null),
        'PHOTO PRODUK': Array(4).fill(null),
    });
    const [cinematicPromptLoading, setCinematicPromptLoading] = useState<Record<string, boolean[]>>({
        'B-Roll': Array(4).fill(false),
        'UGC': Array(4).fill(false),
        'PHOTO PRODUK': Array(4).fill(false),
    });

    // Veo Video Generation State
    const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});
    const [videoGenLoading, setVideoGenLoading] = useState<Record<string, boolean>>({});

    // Edit and Regenerate State
    const [openEditMenu, setOpenEditMenu] = useState<string | null>(null);
    const [editedImages, setEditedImages] = useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = useState<string | null>(null);
    const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);

    // Lightbox
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxImageSrc, setLightboxImageSrc] = useState('');

    useEffect(() => {
        if (modelImageBase64.length !== modelDescriptions.length) {
            setModelDescriptions(prev => {
                const diff = modelImageBase64.length - prev.length;
                if (diff > 0) return [...prev, ...new Array(diff).fill('')];
                return prev.slice(0, modelImageBase64.length);
            });
        }
    }, [modelImageBase64.length]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>, isMultiple = false, maxFiles = 2) => {
        // Fix: Explicitly cast to File[] to avoid 'unknown' type inference which causes error in map below.
        const files = Array.from(event.target.files || []) as File[];
        if (files.length === 0) return;

        if (isMultiple) {
             const newFiles = files.slice(0, maxFiles);
             const base64Promises = newFiles.map(fileToBase64);
             const newBase64s = await Promise.all(base64Promises);
             setter(prev => [...prev, ...newBase64s].slice(0, maxFiles));
        } else {
            const base64 = await fileToBase64(files[0]);
            setter([base64]);
        }
        setError(null);
    };

    const buildFullPrompt = (baseTemplatePrompt: PromptTemplate, categoryKey: string) => {
        const ratioOptions = RATIO_OPTIONS.find(o => o.key === selectedRatio);
        const ratioKey = ratioOptions ? ratioOptions.key : '9:16';
        const modelDescText = modelDescriptions.filter(d => d && d.trim().length > 0).join(' dan model kedua: ');
        const isProductDescriptionProvided = productDescription && productDescription.trim() !== '';

        let modelIntegrationInstruction = '';
        if (categoryKey === 'UGC' && modelImageBase64.length > 0) {
            modelIntegrationInstruction = `
                PENTING UNTUK MODEL: Replikasi model dari foto referensi. Gunakan produk dari foto-foto produk utama dan tampilkan bersama model yang dihasilkan AI. Wajah model HARUS identik dengan foto model yang diunggah secara terpisah. JANGAN meniru wajah apapun yang mungkin ada di foto-foto produk.
                ${modelDescText ? `Keterangan tambahan untuk model: ${modelDescText}.` : ''}
            `;
        } else {
            modelIntegrationInstruction = ` PENTING: Tanpa model manusia di gambar ini. Fokus hanya pada produk.`;
        }

        return `
            Anda adalah pakar Image-to-Image (I2I) dan DALL-E. Tugas Anda adalah menghasilkan konten visual yang sangat detail dan realistis untuk tujuan pemasaran afiliasi.
            
            # ATURAN UTAMA
            1. REPLIKASI PRODUK: Produk yang dihasilkan HARUS terlihat 100% IDENTIK dengan gambar-gambar referensi produk utama.
            2. GAYA FOTO: Gunakan gaya fotografi komersial, ultra-realistis, dan sinematik.
            3. RAHASIA & OUTPUT: JANGAN PERNAH mengembalikan teks. Fokus hanya pada payload gambar Base64.
            4. INTRUKSI FINAL: Gambar ini akan dipotong menjadi rasio ${ratioKey}.
            5. PENTING: Jika ada wajah manusia di gambar-gambar referensi produk utama, ABAIKAN wajah tersebut.
            6. RASIO: Pastikan aspek rasio output adalah ${ratioKey}.
            7. PENTING (ANTI-TEKS): JANGAN PERNAH menambahkan teks buatan AI.

            # KONTEKS GAMBAR:
            - JENIS KONTEN: ${baseTemplatePrompt.title}
            - RASIO OUTPUT: ${ratioKey}
            - DESKRIPSI KONSEP UTAMA: ${baseTemplatePrompt.text}. ${isProductDescriptionProvided ? `Integrasikan suasana dan latar belakang berikut: "${productDescription}".` : ''}
            
            # DETAIL SPESIFIK:
            ${modelIntegrationInstruction}
            
            PENTING: Latar belakang, suasana, dan properti foto harus sesuai dengan konteks ini.
        `;
    };

    const generateImage = async (prompt: string, category: string, index: number) => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const shouldSendModelImages = category === 'UGC' && modelImageBase64.length > 0;
        
        const parts = [
            { text: prompt },
            ...productImageBase64.map(base64 => ({ inlineData: { mimeType: 'image/jpeg', data: base64 } })),
            ...(shouldSendModelImages ? modelImageBase64.map(base64 => ({ inlineData: { mimeType: 'image/jpeg', data: base64 } })) : [])
        ];

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image', // Using standard Flash Image as per instructions
                contents: [{ parts }]
            });
            
            // Iterate through parts to find image
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
                return imagePart.inlineData.data;
            } else {
                // If simple generation fails or returns text, throw error
                 const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
                 throw new Error(textPart?.text || "No image data returned.");
            }
        } catch (err) {
            throw err;
        }
    };

    const handleGenerate = async () => {
        if (productImageBase64.length === 0) {
            setError("Harap unggah setidaknya satu Foto Produk (utama) terlebih dahulu."); 
            return;
        }

        setIsLoading(true);
        // Reset states
        setResults({ 'B-Roll': Array(4).fill(null), 'UGC': Array(4).fill(null), 'PHOTO PRODUK': Array(4).fill(null) });
        setVideoPrompts({ 'B-Roll': Array(4).fill(null), 'UGC': Array(4).fill(null), 'PHOTO PRODUK': Array(4).fill(null) });
        setCinematicPrompts({ 'B-Roll': Array(4).fill(null), 'UGC': Array(4).fill(null), 'PHOTO PRODUK': Array(4).fill(null) });
        setEditedImages({});
        setGeneratedVideos({});
        setVideoGenLoading({});
        setFinalPrompts([]);
        setError(null);

        const tasks: {category: string, index: number, prompt: string}[] = [];
        const promptsList: string[] = [];

        for (const categoryKey in PROMPT_TEMPLATES) {
            PROMPT_TEMPLATES[categoryKey].forEach((template, index) => {
                const prompt = buildFullPrompt(template, categoryKey);
                tasks.push({ category: categoryKey, index, prompt });
                promptsList.push(prompt);
            });
        }
        setFinalPrompts(promptsList);

        // Execute tasks sequentially to avoid rate limits (simplistic approach) or parallel in batches
        // Given raw Gemini API limits, sequential or small batches is safer.
        
        for (const task of tasks) {
            try {
                const base64 = await generateImage(task.prompt, task.category, task.index);
                setResults(prev => {
                    const newRes = { ...prev };
                    newRes[task.category][task.index] = base64;
                    return newRes;
                });
            } catch (err: any) {
                console.error(`Failed ${task.category} ${task.index}`, err);
                // Continue to next task
            }
            // Small delay to be polite to the API
            await new Promise(r => setTimeout(r, 500)); 
        }
        setIsLoading(false);
    };
    
    // Helper to generate text from image (Video Prompts & Cinematic Prompts)
    const generateTextFromImage = async (prompt: string, imageBase64: string, modelName: string = "gemini-2.5-flash") => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
                ]
            }]
        });
        return response.response.text();
    };

    const handleGenerateVideoPrompt = async (category: string, index: number, imageBase64: string | null) => {
        if (!imageBase64) return;
        setVideoPromptLoading(prev => {
            const copy = {...prev}; copy[category][index] = true; return copy;
        });

        const selectedType = selectedPromptTypes[category]?.[index];
        let inspirationStyle = '';
        if (selectedType && category === 'UGC') {
             const defs: Record<string, string> = {
                'Hook': "Buat kalimat pembuka (HOOK) yang sangat menarik perhatian dalam 3 detik pertama.",
                'Masalah': "Fokus pada MASALAH (Pain Point) yang sering dialami audiens.",
                'Solusi': "Fokus pada SOLUSI dan MANFAAT utama produk.",
                'CTA': "Fokus pada CALL TO ACTION (Ajakan Bertindak)."
            };
            if (defs[selectedType]) inspirationStyle = `MODUS KHUSUS: ${selectedType}. ${defs[selectedType]}`;
        }

        const prompt = `
            Anda adalah copywriter. Buat prompt video (skenario) singkat berdasarkan GAMBAR INI.
            Produk: ${productDescription || 'produk di gambar'}
            Bahasa Dialog: ${selectedLanguage}
            
            Tugas: Buat skenario video pendek (5-10 detik) dan DIALOG KREATIF.
            ${inspirationStyle}
            
            Format Output:
            **Suasana:** ...
            **Gaya Kamera:** ...
            **Dialog (${selectedLanguage}):** ...
        `;

        try {
            const text = await generateTextFromImage(prompt, imageBase64, "gemini-2.5-flash");
            setVideoPrompts(prev => {
                const copy = {...prev}; copy[category][index] = text; return copy;
            });
        } catch (e) {
            console.error(e);
        } finally {
            setVideoPromptLoading(prev => {
                const copy = {...prev}; copy[category][index] = false; return copy;
            });
        }
    };

    const handleGenerateCinematicPrompt = async (category: string, index: number, imageBase64: string | null) => {
        if (!imageBase64) return;
         setCinematicPromptLoading(prev => {
            const copy = {...prev}; copy[category][index] = true; return copy;
        });

        const prompt = `
            Analyze this image and write a highly detailed, cinematic 'text-to-image' prompt in English to recreate it. 
            Focus on subject, lighting, atmosphere, and composition. One paragraph only.
        `;

        try {
            const text = await generateTextFromImage(prompt, imageBase64, "gemini-2.5-flash");
            setCinematicPrompts(prev => {
                const copy = {...prev}; copy[category][index] = text; return copy;
            });
        } catch (e) {
             console.error(e);
        } finally {
            setCinematicPromptLoading(prev => {
                const copy = {...prev}; copy[category][index] = false; return copy;
            });
        }
    };

    const handleGenerateEdit = async (categoryKey: string, index: number, originalImage: string | null, angle: string) => {
        if (!originalImage) return;
        const itemKey = `${categoryKey}-${index}`;
        const editKey = `${itemKey}-${angle}`;
        setEditLoading(editKey);

        const prompt = `
            EDIT GAMBAR INI.
            Ubah sudut kamera menjadi: "${angle}".
            JANGAN mengubah subjek atau produk. Pertahankan gaya asli.
        `;

        try {
            const base64 = await generateImage(prompt, categoryKey, index); // Reuse generateImage logic but needs handling input image as context
            // generateImage function currently uses global state for input images. 
            // We need a specific call for edits that includes the original generated image as input.
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const parts = [
                { text: prompt },
                { inlineData: { mimeType: 'image/jpeg', data: originalImage } },
                 // Add context images too? Instructions say "edit images... prompt with text, images or combination"
                 // Adding product images helps keep identity.
                ...productImageBase64.map(b => ({ inlineData: { mimeType: 'image/jpeg', data: b } }))
            ];
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [{ parts }]
            });
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart?.inlineData?.data) {
                setEditedImages(prev => ({ ...prev, [editKey]: imagePart.inlineData!.data }));
            }
        } catch (err: any) {
             setError(`Edit failed: ${err.message}`);
        } finally {
            setEditLoading(null);
        }
    };

    const handleRegenerateSingle = async (categoryKey: string, index: number, template: PromptTemplate) => {
        const itemKey = `${categoryKey}-${index}`;
        setRegeneratingKey(itemKey);
        try {
            const prompt = buildFullPrompt(template, categoryKey);
            const base64 = await generateImage(prompt, categoryKey, index);
            setResults(prev => {
                const copy = {...prev}; copy[categoryKey][index] = base64; return copy;
            });
            // Reset derived data
            setVideoPrompts(prev => { const c = {...prev}; c[categoryKey][index] = null; return c; });
            setCinematicPrompts(prev => { const c = {...prev}; c[categoryKey][index] = null; return c; });
            // Clear edits for this item
            setEditedImages(prev => {
                const copy = {...prev};
                Object.keys(copy).forEach(k => { if (k.startsWith(itemKey)) delete copy[k]; });
                return copy;
            });
            // Clear video for this item
            setGeneratedVideos(prev => { const c = {...prev}; delete c[itemKey]; return c; });
        } catch (err: any) {
            setError(`Regenerate failed: ${err.message}`);
        } finally {
            setRegeneratingKey(null);
        }
    };

    const handleGenerateVeoVideo = async (category: string, index: number, imageBase64: string) => {
        // Veo requires user's own paid key. Check if selected.
        if ((window as any).aistudio && !await (window as any).aistudio.hasSelectedApiKey()) {
            await (window as any).aistudio.openSelectKey();
            // We continue assuming the user selected a key.
        }

        const itemKey = `${category}-${index}`;
        setVideoGenLoading(prev => ({...prev, [itemKey]: true}));

        try {
            // Re-initialize AI to ensure it picks up the user-selected key from process.env if updated
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // Determine prompt: Use generated scenario if available, otherwise a default
            let promptText = "Cinematic product shot, slow motion, high quality, 4k, photorealistic";
            if (videoPrompts[category][index]) {
                // Use the text but trim it to avoid overly long prompts which might confuse Veo or hit limits
                const scenerioText = videoPrompts[category][index];
                if (scenerioText) {
                    // Simple logic to extract "Dialog" out if possible or just use whole thing. 
                    // Veo needs visual description.
                    promptText = `${scenerioText}. Cinematic, high resolution.`;
                }
            }

            // Determine Aspect Ratio. Veo supports '16:9' or '9:16'.
            // Image generator supports '1:1', '9:16', '16:9'.
            // If 1:1, we default to 9:16 (mobile vertical).
            let veoRatio = '16:9';
            if (selectedRatio === '9:16' || selectedRatio === '1:1') {
                veoRatio = '9:16';
            }

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: promptText,
                image: {
                    imageBytes: imageBase64,
                    mimeType: 'image/jpeg'
                },
                config: {
                   numberOfVideos: 1,
                   resolution: '720p',
                   aspectRatio: veoRatio
                }
            });

            // Polling loop
            while (!operation.done) {
                await new Promise(r => setTimeout(r, 10000)); // 10s poll
                operation = await ai.operations.getVideosOperation({operation});
            }

            const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (uri) {
                // Fetch the video blob using the key
                const vidResp = await fetch(`${uri}&key=${process.env.API_KEY}`);
                if (!vidResp.ok) throw new Error("Failed to download video bytes");
                const blob = await vidResp.blob();
                const blobUrl = URL.createObjectURL(blob);
                setGeneratedVideos(prev => ({...prev, [itemKey]: blobUrl}));
            } else {
                throw new Error("Video generation completed but no URI returned.");
            }

        } catch (e: any) {
            console.error("Video Gen Error:", e);
            setError(`Video Generation Failed: ${e.message}`);
        } finally {
             setVideoGenLoading(prev => ({...prev, [itemKey]: false}));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[95%] mx-auto">
            <div className="space-y-6">
                <div className="p-6 bg-gray-100/80 rounded-2xl shadow-xl border border-gray-300/50 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-4 flex items-center text-emerald-600">
                        <Zap className="w-6 h-6 mr-2" /> Input Generator
                    </h2>
                    
                    <CustomFileInput
                        id="product-upload-main"
                        label="1. Unggah Foto Produk (utama) - Wajib (Maks 2)" 
                        onChange={(e) => handleFileChange(e, setProductImageBase64, true, 2)} 
                        preview={productImageBase64}
                        onDelete={(idx) => setProductImageBase64(prev => prev.filter((_, i) => i !== idx))}
                        multiple={true}
                        maxFiles={2}
                    />

                    <div className="mt-6">
                        <label className="text-sm font-semibold text-gray-800 block mb-1">
                            2. Deskripsi Produk & Konsep Foto (Opsional)
                        </label>
                        <textarea
                            rows={3}
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                            placeholder="Contoh: Kaos ini sangat bagus. Konsep foto di kamar estetik, suasana santai pada malam hari"
                            className="w-full p-3 text-sm text-gray-900 bg-white/80 rounded-lg border border-gray-400 focus:ring-emerald-400 resize-none"
                        />
                    </div>

                    <div className="mt-6">
                        <CustomFileInput
                            id="model-upload"
                            label="3. Unggah Foto Model (Opsional, Max 2) - Hanya untuk UGC"
                            onChange={(e) => handleFileChange(e, setModelImageBase64, true, 2)}
                            preview={modelImageBase64}
                            multiple={true}
                            maxFiles={2}
                            modelDescription={modelDescriptions}
                            onModelDescriptionChange={(idx, val) => setModelDescriptions(prev => { const n = [...prev]; n[idx] = val; return n; })}
                            onDelete={(idx) => {
                                setModelImageBase64(prev => prev.filter((_, i) => i !== idx));
                                setModelDescriptions(prev => prev.filter((_, i) => i !== idx));
                            }}
                        />
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-800 block mb-1">4. Pilih Rasio</label>
                            <select
                                value={selectedRatio}
                                onChange={(e) => setSelectedRatio(e.target.value)}
                                className="w-full p-3 text-sm bg-white/80 rounded-lg border border-gray-400"
                            >
                                {RATIO_OPTIONS.map(option => (
                                    <option key={option.key} value={option.key}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="text-sm font-semibold text-gray-800 block mb-1">5. Pilih Bahasa Output</label>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="w-full p-3 text-sm bg-white/80 rounded-lg border border-gray-400"
                            >
                                {LANGUAGE_OPTIONS.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-300/50">
                        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || productImageBase64.length === 0}
                            className={`w-full text-white font-bold py-3 px-6 rounded-xl shadow-lg flex justify-center items-center transition duration-300
                                ${isLoading || productImageBase64.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                        >
                            {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : <><Zap className="w-5 h-5 mr-2" /> Generate 12 Konten</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="sticky top-8 p-6 bg-gray-100/80 rounded-2xl shadow-xl border border-gray-300/50 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-4 flex items-center text-purple-600">
                        <Download className="w-6 h-6 mr-2" /> Hasil Generator
                    </h2>
                    
                    <div className="space-y-8">
                        {Object.keys(PROMPT_TEMPLATES).map(categoryKey => (
                            <div key={categoryKey}>
                                <h3 className="text-xl font-bold text-emerald-600 mb-4">{categoryKey}</h3>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {PROMPT_TEMPLATES[categoryKey].map((template, index) => {
                                        const itemKey = `${categoryKey}-${index}`;
                                        const img = results[categoryKey][index];
                                        const isRegen = regeneratingKey === itemKey;
                                        const videoUrl = generatedVideos[itemKey];
                                        const isVideoLoading = videoGenLoading[itemKey];
                                        
                                        return (
                                            <div key={itemKey} className="flex flex-col items-center w-full">
                                                <div className={`image-container w-full ${selectedRatio === '1:1' ? 'aspect-square' : (selectedRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[16/9]')} bg-gray-200 rounded-xl border-4 border-dashed ${isLoading || isRegen ? 'border-purple-500' : 'border-gray-400'} flex items-center justify-center overflow-hidden`}>
                                                    {isLoading || isRegen ? (
                                                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                                    ) : img ? (
                                                        <>
                                                            <img src={`data:image/jpeg;base64,${img}`} alt="Generated" className="w-full h-full object-cover" />
                                                            <div className="image-overlay !flex-col !items-center !justify-center !p-2 space-y-2">
                                                                <div className="flex space-x-2">
                                                                    <button onClick={() => { setLightboxImageSrc(`data:image/jpeg;base64,${img}`); setIsLightboxOpen(true); }} className="bg-purple-600/80 p-2 rounded text-white hover:bg-purple-600"><Image className="w-5 h-5" /></button>
                                                                    <button onClick={() => downloadImage(img!, `gen_${itemKey}.jpg`)} className="bg-emerald-600/80 p-2 rounded text-white hover:bg-emerald-600"><Download className="w-5 h-5" /></button>
                                                                </div>
                                                                <button onClick={() => handleRegenerateSingle(categoryKey, index, template)} disabled={!!regeneratingKey} className="bg-blue-500/80 p-2 rounded text-white hover:bg-blue-500"><RefreshCcw className="w-5 h-5" /></button>
                                                            </div>
                                                        </>
                                                    ) : null}
                                                </div>

                                                {img && (
                                                    <div className="w-full mt-3 space-y-2">
                                                        {/* Video Prompt Section */}
                                                        {videoPrompts[categoryKey][index] ? (
                                                            <div className="p-3 bg-gray-200/70 rounded-lg text-xs">
                                                                <div className="font-bold text-blue-700 mb-1 flex items-center"><Video className="w-3 h-3 mr-1"/> Skenario</div>
                                                                <div className="whitespace-pre-wrap mb-2">{videoPrompts[categoryKey][index]}</div>
                                                                <button onClick={() => copyToClipboard(videoPrompts[categoryKey][index]!)} className="w-full bg-emerald-600 text-white py-1 rounded flex items-center justify-center"><Clipboard className="w-3 h-3 mr-1"/> Salin</button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-2">
                                                                {categoryKey === 'UGC' && (
                                                                    <select 
                                                                        className="text-xs p-2 rounded border"
                                                                        onChange={(e) => setSelectedPromptTypes(prev => ({...prev, [categoryKey]: {...prev[categoryKey], [index]: e.target.value}}))}
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="">-- Tipe Script --</option>
                                                                        <option value="Hook">Hook</option>
                                                                        <option value="Masalah">Masalah</option>
                                                                        <option value="Solusi">Solusi</option>
                                                                        <option value="CTA">CTA</option>
                                                                    </select>
                                                                )}
                                                                <button 
                                                                    onClick={() => handleGenerateVideoPrompt(categoryKey, index, img)}
                                                                    disabled={videoPromptLoading[categoryKey][index]}
                                                                    className="w-full bg-blue-400 text-white text-xs py-2 rounded flex justify-center items-center hover:bg-blue-500"
                                                                >
                                                                    {videoPromptLoading[categoryKey][index] ? <Loader2 className="w-3 h-3 animate-spin"/> : <Video className="w-3 h-3 mr-1"/>} Buat Skenario
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Cinematic Prompt Section */}
                                                        {cinematicPrompts[categoryKey][index] ? (
                                                            <div className="p-3 bg-gray-200/70 rounded-lg text-xs">
                                                                <div className="font-bold text-teal-700 mb-1 flex items-center"><Wand2 className="w-3 h-3 mr-1"/> Cinematic Prompt</div>
                                                                <div className="whitespace-pre-wrap mb-2">{cinematicPrompts[categoryKey][index]}</div>
                                                                <button onClick={() => copyToClipboard(cinematicPrompts[categoryKey][index]!)} className="w-full bg-emerald-600 text-white py-1 rounded flex items-center justify-center"><Clipboard className="w-3 h-3 mr-1"/> Salin</button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleGenerateCinematicPrompt(categoryKey, index, img)}
                                                                disabled={cinematicPromptLoading[categoryKey][index]}
                                                                className="w-full bg-teal-500 text-white text-xs py-2 rounded flex justify-center items-center hover:bg-teal-600"
                                                            >
                                                                {cinematicPromptLoading[categoryKey][index] ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3 mr-1"/>} Buat Prompt Cinematic
                                                            </button>
                                                        )}

                                                        {/* Edit Angles */}
                                                        <button onClick={() => setOpenEditMenu(openEditMenu === itemKey ? null : itemKey)} className="w-full bg-purple-500 text-white text-xs py-2 rounded flex justify-center items-center hover:bg-purple-600">
                                                            <Edit className="w-3 h-3 mr-1"/> Edit Angle
                                                        </button>
                                                        
                                                        {openEditMenu === itemKey && (
                                                            <div className="p-2 bg-gray-100 rounded space-y-2">
                                                                {CAMERA_ANGLES.map(angle => {
                                                                    const editKey = `${itemKey}-${angle}`;
                                                                    const editedImg = editedImages[editKey];
                                                                    const loading = editLoading === editKey;
                                                                    return (
                                                                        <div key={angle} className="text-xs">
                                                                            {!editedImg ? (
                                                                                <button onClick={() => handleGenerateEdit(categoryKey, index, img, angle)} disabled={loading} className="w-full bg-purple-400 text-white py-1 rounded hover:bg-purple-500 flex justify-center">{loading ? <Loader2 className="w-3 h-3 animate-spin"/> : angle}</button>
                                                                            ) : (
                                                                                <div className="flex items-center space-x-2">
                                                                                    <img src={`data:image/jpeg;base64,${editedImg}`} className="w-10 h-10 object-cover rounded cursor-pointer" onClick={() => { setLightboxImageSrc(`data:image/jpeg;base64,${editedImg}`); setIsLightboxOpen(true); }} alt="Edited"/>
                                                                                    <span className="flex-grow">{angle}</span>
                                                                                    <button onClick={() => downloadImage(editedImg, `edit_${itemKey}_${angle}.jpg`)} className="p-1 bg-emerald-500 text-white rounded"><Download className="w-3 h-3"/></button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Veo Video Generator Section */}
                                                        <div className="pt-2 border-t border-gray-300/50">
                                                            {!videoUrl && (
                                                                <button
                                                                    onClick={() => handleGenerateVeoVideo(categoryKey, index, img)}
                                                                    disabled={isVideoLoading}
                                                                    className={`w-full text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center transition duration-300 shadow-md ${isVideoLoading ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white shadow-red-900/40'}`}
                                                                >
                                                                    {isVideoLoading ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                                                            Generating Video (Veo)...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Film className="w-4 h-4 mr-1.5" />
                                                                            Generate Video (Veo)
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                            
                                                            {videoUrl && (
                                                                <div className="mt-2 bg-gray-200/50 p-2 rounded-lg border border-gray-300">
                                                                     <video 
                                                                        src={videoUrl} 
                                                                        controls 
                                                                        autoPlay 
                                                                        loop 
                                                                        className="w-full rounded-md shadow-sm mb-2"
                                                                    />
                                                                    <a 
                                                                        href={videoUrl} 
                                                                        download={`veo_${itemKey}.mp4`}
                                                                        className="w-full bg-emerald-600 text-white text-xs py-2 rounded flex justify-center items-center hover:bg-emerald-700 font-medium"
                                                                    >
                                                                        <Download className="w-4 h-4 mr-1.5"/> Download Video
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>

                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isLightboxOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setIsLightboxOpen(false)}>
                    <div className="relative max-w-full max-h-full">
                        <button className="absolute -top-10 right-0 text-white hover:text-gray-300" onClick={() => setIsLightboxOpen(false)}><X className="w-8 h-8"/></button>
                        <img src={lightboxImageSrc} className="max-w-full max-h-[85vh] object-contain rounded" onClick={(e) => e.stopPropagation()} alt="Lightbox"/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageGenerator;