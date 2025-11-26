import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { VEO_PROMPT_DATA } from '../constants';
import { copyToClipboard } from '../utils';

const VeoPromptCrafter: React.FC = () => {
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [promptId, setPromptId] = useState('');
    const [promptEn, setPromptEn] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');

    const handleInputChange = (key: string, value: string) => {
        setInputs(prev => ({ ...prev, [key]: value }));
        setCopyStatus('');
    };

    const assembleIndonesianPrompt = (values: Record<string, string>) => {
        const subject = values.subject || "Subjek";
        const action = values.action || "melakukan suatu aksi";
        const expression = values.expression ? `, dengan ekspresi ${values.expression}` : "";
        const place = values.place ? ` ${values.place}` : "";
        
        // Find label for time selection
        const timeOption = VEO_PROMPT_DATA.time.options?.find(o => o.value === values.time);
        const time = values.time ? ` (${timeOption?.label || values.time})` : "";
        
        let core = `${subject} ${action}${expression}${place}.`;
        
        let details = "\n\nDetail Teknis:";
        
        const getLabel = (key: string, val: string) => 
            VEO_PROMPT_DATA[key].options?.find(o => o.value === val)?.label || val || 'Tidak Ditentukan';

        details += `\n- Waktu: ${time}`;
        details += `\n- Gerakan Kamera: ${getLabel('camera_motion', values.camera_motion)}`;
        details += `\n- Pencahayaan: ${getLabel('lighting', values.lighting)}`;
        details += `\n- Gaya Video: ${getLabel('video_style', values.video_style)}`;
        details += `\n- Suasana: ${getLabel('video_vibe', values.video_vibe)}`;

        let soundAndDialogue = "";
        if (values.sound_music) soundAndDialogue += `\n\nSuara/Musik: ${values.sound_music}.`;
        if (values.dialogue) soundAndDialogue += `\n\nKalimat yang Diucapkan: "${values.dialogue}".`;

        let additional = "";
        if (values.additional_details) additional += `\n\nDetail Tambahan: ${values.additional_details}.`;

        return core + details + soundAndDialogue + additional;
    };
    
    const assembleEnglishPrompt = (values: Record<string, string>, _indonesianText: string) => {
        const core = [
            values.subject, 
            values.action, 
            values.place
        ].filter(v => v && v.length > 0).join(' ');

        const modifiers: string[] = [];
        if (values.expression) modifiers.push(`with an ${values.expression} expression`);
        if (values.time) modifiers.push(values.time);
        if (values.lighting) modifiers.push(values.lighting);
        if (values.video_style) modifiers.push(values.video_style);
        if (values.video_vibe) modifiers.push(values.video_vibe);
        if (values.camera_motion) modifiers.push(values.camera_motion);
        if (values.additional_details) modifiers.push(values.additional_details);
        
        modifiers.push("highly detailed, cinematic, high quality, 8K");

        let finalPrompt = core;
        if (modifiers.length > 0) {
            finalPrompt += ', ' + modifiers.join(', ');
        }

        let soundAndDialogueEN = "";
        if (values.sound_music) soundAndDialogueEN += ` (Sound Design: ${values.sound_music})`;
        if (values.dialogue) soundAndDialogueEN += ` (Dialogue: "${values.dialogue}")`;
        
        return finalPrompt.trim().replace(/\s*,\s*,/g, ', ').replace(/, \./g, '. ') + soundAndDialogueEN;
    };

    const handleGenerate = () => {
        setCopyStatus('');
        if (!inputs.subject && !inputs.action) {
            setPromptId("Harap isi minimal Subjek Utama atau Aksi/Tindakan.");
            setPromptEn("");
            return;
        }

        setIsGenerating(true);
        setTimeout(() => {
            const pid = assembleIndonesianPrompt(inputs);
            const pen = assembleEnglishPrompt(inputs, pid);

            setPromptId(pid);
            setPromptEn(pen);
            setIsGenerating(false);
            
            copyToClipboard(pen);
            setCopyStatus("✅ Prompt Inggris Berhasil Disalin!");
            setTimeout(() => setCopyStatus(''), 3000);
        }, 200);
    };

    const handleUpdateAndCopy = () => {
        const values = inputs;
        const newPromptId = promptId;
        const newPromptEnFromInputs = assembleEnglishPrompt(values, newPromptId);

        setPromptEn(newPromptEnFromInputs);
        copyToClipboard(newPromptEnFromInputs);
        setCopyStatus("✅ Prompt Inggris (di-update) Berhasil Disalin!");
        setTimeout(() => setCopyStatus(''), 3000);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="p-6 bg-gray-100/80 rounded-2xl shadow-xl border border-gray-300/50 backdrop-blur-sm mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-emerald-600 border-b border-gray-300/50 pb-2">
                    Input Komponen Prompt (12 Poin)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(VEO_PROMPT_DATA).map(key => {
                        const data = VEO_PROMPT_DATA[key];
                        return (
                            <div key={key} className="flex flex-col space-y-2">
                                <label htmlFor={key} className="text-sm font-semibold text-gray-800">
                                    {data.label}
                                </label>
                                
                                {data.type === 'text' ? (
                                    <input
                                        type="text"
                                        id={key}
                                        name={key}
                                        placeholder={data.placeholder}
                                        value={inputs[key] || ''}
                                        onChange={(e) => handleInputChange(key, e.target.value)}
                                        className="w-full p-3 text-sm text-gray-900 bg-white/80 rounded-lg border border-gray-400 focus:ring-emerald-400 focus:border-emerald-400 transition duration-200"
                                    />
                                ) : (
                                    <select
                                        id={key}
                                        name={key}
                                        value={inputs[key] || ''}
                                        onChange={(e) => handleInputChange(key, e.target.value)}
                                        className="w-full p-3 text-sm text-gray-900 bg-white/80 rounded-lg border border-gray-400 focus:ring-emerald-400 focus:border-emerald-400 transition duration-200 appearance-none cursor-pointer"
                                    >
                                        <option value="">--- Pilih Opsi ---</option>
                                        {data.options?.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`w-full text-white font-bold py-3 px-6 rounded-xl transition duration-300 ease-in-out shadow-lg flex justify-center items-center 
                            ${isGenerating
                                ? 'bg-gray-400 cursor-not-allowed text-gray-700' 
                                : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(52,211,153,0.7)] shadow-emerald-900/50'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" />
                                Processing...
                            </>
                        ) : (
                            'Generate Prompt Awal'
                        )}
                    </button>
                </div>
            </div>

            <div className="p-6 bg-gray-100/80 rounded-2xl shadow-xl border border-gray-300/50 backdrop-blur-sm">
                <h2 className="text-2xl font-semibold mb-4 text-purple-600 border-b border-gray-300/50 pb-2">
                    Prompt Hasil & Finalisasi
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="output-prompt-id" className="text-lg font-medium text-gray-800">
                            Prompt Bahasa Indonesia (Edit & Kembangkan)
                        </label>
                        <textarea
                            id="output-prompt-id"
                            rows={8}
                            value={promptId}
                            onChange={(e) => setPromptId(e.target.value)}
                            className="w-full mt-2 p-4 text-sm text-gray-900 bg-white/80 rounded-lg border-2 border-dashed border-gray-400 focus:ring-emerald-400 focus:border-emerald-400 whitespace-pre-wrap resize-vertical"
                        ></textarea>
                        <p className="text-sm text-gray-500 mt-1">
                            Anda bisa mengedit teks ini (tetapi tidak akan memengaruhi hasil EN secara otomatis).
                        </p>
                    </div>

                    <div>
                        <label htmlFor="output-prompt-en" className="text-lg font-medium text-gray-800">
                            Prompt Bahasa Inggris (Final untuk Model)
                        </label>
                        <textarea
                            id="output-prompt-en"
                            rows={8}
                            readOnly
                            value={promptEn}
                            className="w-full mt-2 p-4 text-sm text-gray-900 bg-gray-200/80 rounded-lg border-2 border-dashed border-purple-600 whitespace-pre-wrap resize-vertical opacity-80 cursor-not-allowed"
                        ></textarea>
                        <p className="text-sm text-gray-500 mt-1">
                            Ini adalah hasil akhir yang siap disalin.
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={handleUpdateAndCopy}
                        disabled={!promptId || isGenerating}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Update & Salin Prompt Bahasa Inggris
                    </button>
                    {copyStatus && (
                        <div className="text-emerald-600 font-medium">
                            {copyStatus}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VeoPromptCrafter;