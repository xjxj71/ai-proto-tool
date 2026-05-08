import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Send, X, ImagePlus } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string, images: string[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, onCancel, isLoading }: ChatInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && images.length === 0) return;
    onSend(trimmed, images);
    setText("");
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) handleSend();
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImages((prev) => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-border p-2">
      {images.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative w-12 h-12 rounded overflow-hidden border border-border">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-0 right-0 w-4 h-4 bg-bg-primary/80 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 items-end">
        <button
          onClick={handleImageSelect}
          className="flex-shrink-0 p-1.5 text-text-tertiary hover:text-text-primary"
          title={t("chat.uploadImage")}
        >
          <ImagePlus size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.inputPlaceholder")}
          className="flex-1 bg-bg-tertiary text-text-primary text-sm rounded px-2 py-1.5 resize-none border border-border focus:outline-none focus:border-accent max-h-24"
          rows={1}
        />

        {isLoading ? (
          <button
            onClick={onCancel}
            className="flex-shrink-0 p-1.5 text-text-tertiary hover:text-accent"
            title={t("chat.cancel")}
          >
            <X size={16} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() && images.length === 0}
            className="flex-shrink-0 p-1.5 text-text-tertiary hover:text-accent disabled:opacity-30"
            title={t("chat.send")}
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
