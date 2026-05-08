import { useExportStore } from "@/stores/exportStore";

export function ExportOptions() {
  const format = useExportStore((s) => s.format);
  const setFormat = useExportStore((s) => s.setFormat);
  const resolution = useExportStore((s) => s.resolution);
  const setResolution = useExportStore((s) => s.setResolution);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-text-secondary mb-2">导出格式</label>
        <div className="flex gap-2">
          {(["html", "png", "both"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                format === f
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-text-secondary hover:border-accent-hover"
              }`}
            >
              {f === "html" ? "HTML" : f === "png" ? "PNG" : "HTML + PNG"}
            </button>
          ))}
        </div>
      </div>
      {(format === "png" || format === "both") && (
        <div>
          <label className="block text-sm text-text-secondary mb-2">图片分辨率</label>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((r) => (
              <button
                key={r}
                onClick={() => setResolution(r)}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  resolution === r
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-text-secondary hover:border-accent-hover"
                }`}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
