import { useState, useCallback } from 'react';

interface Props {
  files: File[];
  mainIndex: number;
  onChange: (files: File[], mainIndex: number) => void;
}

export default function ImageUploader({ files, mainIndex, onChange }: Props) {
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = useCallback(
    (selected: FileList | null) => {
      if (!selected) return;
      const newFiles = Array.from(selected).slice(0, 3 - files.length);
      const allFiles = [...files, ...newFiles].slice(0, 3);
      const urls = allFiles.map((f) => URL.createObjectURL(f));
      setPreviews(urls);
      onChange(allFiles, mainIndex);
    },
    [files, mainIndex, onChange]
  );

  const removeFile = (idx: number) => {
    const updated = files.filter((_, i) => i !== idx);
    const newMain = mainIndex >= updated.length ? Math.max(0, updated.length - 1) : mainIndex;
    const urls = updated.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    onChange(updated, newMain);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {files.map((file, idx) => (
          <div key={idx} className="relative w-24 h-24">
            <img
              src={previews[idx] || URL.createObjectURL(file)}
              alt=""
              className={`w-full h-full object-cover rounded-lg border-2 ${idx === mainIndex ? 'border-blue-500' : 'border-gray-200'}`}
            />
            <button
              type="button"
              onClick={() => removeFile(idx)}
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => onChange(files, idx)}
              className="absolute bottom-1 left-1 right-1 text-xs bg-black/50 text-white rounded py-0.5"
            >
              {idx === mainIndex ? 'Main' : 'Set main'}
            </button>
          </div>
        ))}
        {files.length < 3 && (
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 text-gray-400 text-xs">
            <span className="text-2xl mb-1">+</span>
            Add photo
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-gray-400">Up to 3 images. Click a photo to set it as main.</p>
    </div>
  );
}
